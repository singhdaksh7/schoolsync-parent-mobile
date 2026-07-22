import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, clearGetDedupCache, NetworkError, resetUnauthorizedGuard, SCHOOL_SLUG, SCHOOL_SLUG_CONFIG_ERROR, setUnauthorizedHandler, UnauthorizedError } from './api-client';
import { cacheKey, cachedFetch, CACHE_TTL, clearAllCache } from './query-cache';
import { clearPdfCache } from './pdf-download';
import { clearSession, loadSession, persistSession } from './session';
import { DEFAULT_BRANDING } from './types';
import type { AppUser, Branding, DriverLoginResponse, MobileMeResponse, SchoolInfo, StudentUser, UnifiedLoginResponse } from './types';

const AUTHENTICATED_BRANDING_SCOPE = 'mobile-branding';

function normalizeRole(role?: string) {
  if (role === 'GUARDIAN') return 'PARENT';
  return role || 'PARENT';
}

function userFromMobileMe(response: MobileMeResponse): AppUser {
  if (response.role === 'STUDENT' && response.student) {
    return {
      id: response.student.id,
      name: response.student.name,
      email: response.student.email,
      role: 'STUDENT',
      schoolId: response.student.schoolId,
    };
  }
  if (response.user) return { ...response.user, role: normalizeRole(response.user.role) };
  return { id: 'mobile-user', name: 'SchoolSync User', role: normalizeRole(response.role) };
}

type LoginResult = { user: AppUser; student?: StudentUser };

type AuthState = {
  token: string | null;
  user: AppUser | null;
  role: string;
  restoring: boolean;
  /** Set when session bootstrap (background /api/mobile/me revalidation) fails
   * due to a network/timeout error while an optimistically-restored session is
   * still in place. The stored session is NOT cleared for this — only for an
   * explicit 401. Screens may show a retry affordance; navigation proceeds. */
  bootstrapError: string | null;
  branding: Branding;
  loadingBranding: boolean;
  studentProfile: StudentUser | null;
  studentSchool: SchoolInfo | null;
  loginParentOrStudent: (identifier: string, password: string) => Promise<LoginResult>;
  loginStaff: (email: string, password: string) => Promise<AppUser>;
  loginDriver: (identifier: string, password: string) => Promise<AppUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchGenericBranding(): Promise<Branding> {
  try {
    const data = await apiRequest<Partial<Branding>>('/api/branding');
    return { ...DEFAULT_BRANDING, ...data };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentUser | null>(null);
  const [studentSchool, setStudentSchool] = useState<SchoolInfo | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const invalidatingRef = useRef(false);

  const logout = useCallback(() => {
    clearSession().catch(() => undefined);
    clearAllCache();
    clearGetDedupCache();
    clearPdfCache().catch(() => undefined);
    setToken(null);
    setUser(null);
    setStudentProfile(null);
    setStudentSchool(null);
    setBootstrapError(null);
    invalidatingRef.current = false;
  }, []);

  // Any 401 from apiRequest (expired/revoked token) invalidates the session
  // exactly once, wherever in the app it fires from (see api-client's
  // invalidationInFlight guard) — this callback itself only needs to be
  // idempotent, which logout() already is.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Unauthenticated fallback (login screen, hostname-resolved — may be
  // generic on a shared, non-per-school-subdomain API host). Superseded by
  // the authenticated fetch below the moment a session exists.
  useEffect(() => {
    let active = true;
    setLoadingBranding(true);
    cachedFetch(cacheKey(null, 'branding'), CACHE_TTL.BRANDING, fetchGenericBranding)
      .then((data) => {
        if (active) setBranding((prev) => ({ ...prev, ...data }));
      })
      .finally(() => {
        if (active) setLoadingBranding(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Authenticated mobile branding (Phase 6C): GET /api/mobile/branding is the
  // canonical source for every actor once a session exists — resolved from
  // the bearer token's schoolId, not request hostname, so it works correctly
  // for Teacher/Admin sessions on a shared API host and for a restored
  // session with no fresh login response to read branding from. A fresh
  // Parent/Student login's inline `branding` (set above) is used as an
  // immediate optimistic value; this fetch confirms/replaces it. Failure
  // here must never invalidate the session — it just leaves the current
  // (generic or login-optimistic) branding in place.
  useEffect(() => {
    if (!token) return;
    let active = true;
    cachedFetch(cacheKey(token, AUTHENTICATED_BRANDING_SCOPE), CACHE_TTL.BRANDING, () => apiRequest<Branding>('/api/mobile/branding', {}, token))
      .then((data) => {
        if (active) setBranding((prev) => ({ ...prev, ...data }));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [token]);

  // Session bootstrap (Phase 6 requirement #3): a stored token is restored
  // OPTIMISTICALLY first — the app never blocks on the network to decide
  // whether to show the actor experience. Validation against
  // /api/mobile/me happens after, in the background:
  //   - 401  -> the session really is gone; clear it and drop to login.
  //   - network/timeout -> the stored session is NOT touched; only
  //     bootstrapError is set so a screen can offer a retry.
  //   - success -> refresh the cached user/profile from the server's view.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await loadSession();
        if (!stored) return;
        setToken(stored.token);
        setUser(stored.user);
        // studentProfile (rollNo/admissionNo/section) isn't part of the
        // persisted session — it's populated below once /api/mobile/me
        // confirms the session and returns the full student record.

        try {
          const me = await apiRequest<MobileMeResponse>('/api/mobile/me', {}, stored.token);
          if (!active) return;
          const restoredUser = userFromMobileMe(me);
          setUser(restoredUser);
          if (me.role === 'STUDENT' && me.student) {
            setStudentProfile(me.student);
            setStudentSchool(me.school ?? null);
          }
          setBootstrapError(null);
          resetUnauthorizedGuard();
        } catch (validationError) {
          if (!active) return;
          if (validationError instanceof UnauthorizedError) {
            // logout() already ran via the global 401 handler; nothing else to do.
            return;
          }
          if (validationError instanceof NetworkError) {
            setBootstrapError(validationError.message);
            return;
          }
          throw validationError;
        }
      } catch {
        await clearSession();
      } finally {
        if (active) setRestoring(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const loginParentOrStudent = useCallback(async (identifier: string, password: string) => {
    if (SCHOOL_SLUG_CONFIG_ERROR) throw new Error(SCHOOL_SLUG_CONFIG_ERROR);
    const res = await apiRequest<UnifiedLoginResponse>('/api/mobile/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, schoolSlug: SCHOOL_SLUG }),
    });
    resetUnauthorizedGuard();

    if (res.actorType === 'PARENT') {
      const nextUser: AppUser = {
        id: res.guardian.id,
        name: res.guardian.name,
        email: res.guardian.email,
        phone: res.guardian.phone,
        role: 'PARENT',
        schoolId: res.school.id,
        schoolSlug: res.school.slug,
      };
      await persistSession(res.token, nextUser);
      setToken(res.token);
      setUser(nextUser);
      setStudentProfile(null);
      setStudentSchool(null);
      setBranding((prev) => ({
        ...prev,
        schoolName: res.school.name,
        logoUrl: res.branding.logoUrl ?? prev.logoUrl,
        primaryColor: res.branding.primaryColor ?? prev.primaryColor,
        secondaryColor: res.branding.secondaryColor ?? prev.secondaryColor,
        appName: res.branding.appName ?? res.school.name,
      }));
      return { user: nextUser };
    }

    const nextUser: AppUser = {
      id: res.student.id,
      name: res.student.name,
      email: res.student.email,
      role: 'STUDENT',
      schoolId: res.student.schoolId,
    };
    await persistSession(res.token, nextUser);
    setToken(res.token);
    setUser(nextUser);
    setStudentProfile(res.student);
    setStudentSchool(res.school);
    setBranding((prev) => ({
      ...prev,
      schoolName: res.school.name,
      logoUrl: res.branding.logoUrl ?? prev.logoUrl,
      primaryColor: res.branding.primaryColor ?? prev.primaryColor,
      secondaryColor: res.branding.secondaryColor ?? prev.secondaryColor,
      appName: res.branding.appName ?? res.school.name,
    }));
    return { user: nextUser, student: res.student };
  }, []);

  const loginStaff = useCallback(async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; role: string; user: AppUser; school?: { name?: string; logoUrl?: string | null } }>(
      '/api/mobile/staff/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    resetUnauthorizedGuard();
    const nextUser = { ...res.user, role: normalizeRole(res.user.role) };
    await persistSession(res.token, nextUser);
    setToken(res.token);
    setUser(nextUser);
    // Staff login does not return colors/appName (see Phase 6 report §2) —
    // only merge what's actually present, keep existing branding otherwise.
    if (res.school?.name || res.school?.logoUrl) {
      setBranding((prev) => ({
        ...prev,
        schoolName: res.school?.name ?? prev.schoolName,
        logoUrl: res.school?.logoUrl ?? prev.logoUrl,
      }));
    }
    return nextUser;
  }, []);

  // Transport Driver Portal (Phase 2A) login — same request/response/
  // error-handling/token-storage structure as loginStaff above, pointed at
  // the driver-specific login route.
  const loginDriver = useCallback(async (identifier: string, password: string) => {
    const res = await apiRequest<DriverLoginResponse>('/api/mobile/driver/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    resetUnauthorizedGuard();
    const nextUser = { ...res.user, role: normalizeRole(res.user.role) };
    await persistSession(res.token, nextUser);
    setToken(res.token);
    setUser(nextUser);
    if (res.school?.name || res.school?.logoUrl) {
      setBranding((prev) => ({
        ...prev,
        schoolName: res.school?.name ?? prev.schoolName,
        logoUrl: res.school?.logoUrl ?? prev.logoUrl,
      }));
    }
    return nextUser;
  }, []);

  const role = normalizeRole(user?.role);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      role,
      restoring,
      bootstrapError,
      branding,
      loadingBranding,
      studentProfile,
      studentSchool,
      loginParentOrStudent,
      loginStaff,
      loginDriver,
      logout,
    }),
    [
      token,
      user,
      role,
      restoring,
      bootstrapError,
      branding,
      loadingBranding,
      studentProfile,
      studentSchool,
      loginParentOrStudent,
      loginStaff,
      loginDriver,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

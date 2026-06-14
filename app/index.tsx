import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AppRole = 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'VICE_PRINCIPAL' | 'TEACHER' | 'PARENT' | 'GUARDIAN' | 'STUDENT';
type LoginMode = 'STAFF' | 'PARENT' | 'STUDENT';

type AppUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  role: AppRole | string;
  schoolId?: string;
  schoolSlug?: string;
};

type LoginResponse = {
  token: string;
  role?: string;
  user: AppUser;
  student?: StudentUser;
  school?: SchoolInfo;
};

type StudentUser = {
  id: string;
  name: string;
  rollNo: string;
  admissionNo?: string | null;
  email?: string | null;
  schoolId?: string;
  // Class/section are not returned by /api/mobile/me today; kept optional so the
  // header renders them automatically if the backend starts including them.
  section?: { name?: string; class?: { name?: string } } | null;
};

type SchoolInfo = {
  id?: string;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
};

type MobileMeResponse = {
  role: string;
  user?: AppUser;
  student?: StudentUser;
  school?: SchoolInfo;
};

type Branding = {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  poweredBySchoolSync: boolean;
};

type Child = {
  id: string;
  name: string;
  rollNo: string;
  section?: { name?: string; class?: { name?: string } };
};

type AttendanceItem = {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  type: string;
};

type MarkItem = {
  id: string;
  marks: number;
  grade?: string | null;
  exam: { name: string; maxMarks: number; scheme?: { name: string } };
};

type StudentAttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
};

type ReportCardItem = {
  id: string;
  status: 'PUBLISHED';
  totalMarks: number;
  percentage: number;
  grade: string;
  publishedAt: string | null;
  student: { name: string; rollNo: string };
  examScheme: { name: string };
};

type TimetableItem = {
  id: string;
  dayOfWeek: number;
  period: number;
  subject?: string;
  teacher?: { name?: string };
  section?: { name?: string; class?: { name?: string } };
  startTime?: string | null;
  endTime?: string | null;
};

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  createdBy?: { name?: string; role?: string };
};

type HomeworkItem = {
  id: string;
  homeworkId: string;
  studentId: string;
  title: string;
  subject: string;
  dueDate: string;
  deadlineAt: string;
  homeworkStatus: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  submissionStatus:
    | 'PENDING'
    | 'SUBMITTED'
    | 'LATE_SUBMITTED'
    | 'NOT_SUBMITTED'
    | 'CHECKED'
    | 'REJECTED';
  submissionMethod: 'NONE' | 'ONLINE' | 'PHYSICAL';
  checkedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  teacherRemark: string | null;
  submission?: {
    id: string;
    attachmentUrl: string;
    fileName: string | null;
    fileType: string | null;
    submittedAt: string;
    status: 'SUBMITTED' | 'LATE' | 'REVIEWED' | 'REJECTED';
    submissionStatus: HomeworkItem['submissionStatus'];
    submissionMethod: HomeworkItem['submissionMethod'];
    checkedAt: string | null;
  } | null;
  teacher?: { name?: string };
};

type PendingFeeItem = {
  student: {
    id: string;
    name: string;
    rollNo: string;
    section?: { name?: string; class?: { name?: string } };
  };
  feeStructure: {
    id: string;
    name: string;
    amount: number;
    frequency: string;
  };
};

type TeacherTodayAttendance = {
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | null;
  attendance?: { status?: 'PRESENT' | 'ABSENT' | 'LATE' } | null;
};

type TeacherArrangement = {
  id: string;
  date?: string;
  period?: number;
  subject?: string | null;
  section?: { name?: string; class?: { name?: string } };
  absentTeacher?: { name?: string } | null;
  reason?: string | null;
};

type TeacherEarlyLeave = {
  id: string;
  date: string;
  leaveAfterPeriod: number;
  reason: string;
  status: string;
};

const DEFAULT_BRANDING: Branding = {
  schoolName: 'SchoolSync',
  logoUrl: null,
  primaryColor: '#1976D2',
  secondaryColor: '#0f172a',
  appName: 'SchoolSync',
  poweredBySchoolSync: false,
};

const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const API_CONFIG_ERROR = API_BASE_URL
  ? null
  : 'Backend API URL is not configured. Set EXPO_PUBLIC_API_URL before running the app.';
const SESSION_STORAGE_KEY = 'schoolsync.mobile.session.v1';

function ensureApiBaseUrl() {
  if (!API_BASE_URL) throw new Error(API_CONFIG_ERROR || 'Backend API URL is not configured.');
  return API_BASE_URL;
}

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${ensureApiBaseUrl()}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload as T;
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString();
}

function formatDateTime(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleString();
}

function isAdminRole(role?: string) {
  return role === 'SCHOOL_OWNER' || role === 'SCHOOL_ADMIN' || role === 'VICE_PRINCIPAL';
}

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

async function persistSession(token: string, user: AppUser) {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user }));
}

export default function App() {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loginMode, setLoginMode] = useState<LoginMode>('PARENT');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [marks, setMarks] = useState<MarkItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [pendingFees, setPendingFees] = useState<PendingFeeItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});

  const [teacherAttendance, setTeacherAttendance] = useState<TeacherTodayAttendance | null>(null);
  const [teacherTimetable, setTeacherTimetable] = useState<TimetableItem[]>([]);
  const [teacherHomework, setTeacherHomework] = useState<HomeworkItem[]>([]);
  const [teacherArrangements, setTeacherArrangements] = useState<TeacherArrangement[]>([]);
  const [teacherEarlyLeaves, setTeacherEarlyLeaves] = useState<TeacherEarlyLeave[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  const [studentProfile, setStudentProfile] = useState<StudentUser | null>(null);
  const [studentSchool, setStudentSchool] = useState<SchoolInfo | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceItem[]>([]);
  const [studentAttendanceSummary, setStudentAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [studentHomework, setStudentHomework] = useState<HomeworkItem[]>([]);
  const [studentTodayTimetable, setStudentTodayTimetable] = useState<TimetableItem[]>([]);
  const [studentMarks, setStudentMarks] = useState<MarkItem[]>([]);
  const [studentReportCards, setStudentReportCards] = useState<ReportCardItem[]>([]);
  const [studentAnnouncements, setStudentAnnouncements] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    let active = true;
    setLoadingBranding(true);
    apiRequest<Branding>('/api/branding')
      .then((data) => {
        if (active) setBranding({ ...DEFAULT_BRANDING, ...data });
      })
      .catch(() => {
        if (active) setBranding(DEFAULT_BRANDING);
      })
      .finally(() => {
        if (active) setLoadingBranding(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as { token?: string };
        if (!parsed.token) return;
        const me = await apiRequest<MobileMeResponse>('/api/mobile/me', {}, parsed.token);
        if (!active) return;
        const restoredUser = userFromMobileMe(me);
        setToken(parsed.token);
        setUser(restoredUser);
        const restoredRole = normalizeRole(restoredUser.role);
        if (restoredRole === 'PARENT') await loadParentDashboard(parsed.token, null);
        if (restoredRole === 'TEACHER') await loadTeacherDashboard(parsed.token);
        if (restoredRole === 'STUDENT') {
          if (me.student) {
            setStudentProfile(me.student);
            setStudentSchool(me.school ?? null);
          }
          await loadStudentDashboard(parsed.token);
        }
      } catch {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (active) setRestoringSession(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
    // Restore should run once at app startup; dashboard loaders are intentionally invoked from the restored token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attendanceSummary = useMemo(() => {
    return attendance.reduce(
      (acc, item) => {
        if (item.status === 'PRESENT') acc.present += 1;
        if (item.status === 'ABSENT') acc.absent += 1;
        if (item.status === 'LATE') acc.late += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );
  }, [attendance]);

  async function loadStudentData(authToken: string, studentId: string) {
    const query = `?studentId=${encodeURIComponent(studentId)}`;
    const [attendanceRes, marksRes, reportCardsRes, timetableRes, homeworkRes] = await Promise.all([
      apiRequest<{ attendance: AttendanceItem[] }>(`/api/parent/attendance${query}`, {}, authToken),
      apiRequest<{ marks: MarkItem[] }>(`/api/parent/marks${query}`, {}, authToken),
      apiRequest<{ reportCards: ReportCardItem[] }>(`/api/parent/report-cards${query}`, {}, authToken),
      apiRequest<{ timetable: TimetableItem[] }>(`/api/parent/timetable${query}`, {}, authToken),
      apiRequest<{ homework: HomeworkItem[] }>(`/api/parent/homework${query}`, {}, authToken),
    ]);

    setAttendance(attendanceRes.attendance || []);
    setMarks(marksRes.marks || []);
    setReportCards(reportCardsRes.reportCards || []);
    setTimetable(timetableRes.timetable || []);
    setHomework(homeworkRes.homework || []);
  }

  async function loadParentDashboard(authToken: string, preferredStudentId?: string | null) {
    setLoadingData(true);
    setError(null);
    try {
      const [childrenRes, announcementsRes, feesRes] = await Promise.all([
        apiRequest<{ children: Child[] }>('/api/parent/children', {}, authToken),
        apiRequest<{ announcements: AnnouncementItem[] }>('/api/parent/announcements', {}, authToken),
        apiRequest<{ pendingFees: PendingFeeItem[] }>('/api/parent/fees', {}, authToken),
      ]);

      const nextChildren = childrenRes.children || [];
      const defaultStudentId =
        preferredStudentId && nextChildren.some((child) => child.id === preferredStudentId)
          ? preferredStudentId
          : (nextChildren[0]?.id ?? null);

      setChildren(nextChildren);
      setAnnouncements(announcementsRes.announcements || []);
      setPendingFees(feesRes.pendingFees || []);
      setSelectedStudentId(defaultStudentId);

      if (defaultStudentId) {
        await loadStudentData(authToken, defaultStudentId);
      } else {
        clearStudentData();
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.');
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }

  async function loadTeacherDashboard(authToken: string) {
    setTeacherLoading(true);
    setTeacherError(null);
    try {
      const [attendanceRes, timetableRes, homeworkRes, arrangementsRes, earlyLeaveRes] = await Promise.all([
        apiRequest<TeacherTodayAttendance>('/api/teacher/attendance/today', {}, authToken),
        apiRequest<{ timetable?: TimetableItem[]; slots?: TimetableItem[]; teachingSections?: unknown[] }>('/api/teacher/timetable', {}, authToken),
        apiRequest<{ homework?: HomeworkItem[] }>('/api/teacher/homework', {}, authToken),
        apiRequest<TeacherArrangement[] | { arrangements?: TeacherArrangement[] }>('/api/teacher/arrangements', {}, authToken),
        apiRequest<TeacherEarlyLeave[] | { requests?: TeacherEarlyLeave[]; earlyLeaves?: TeacherEarlyLeave[] }>('/api/teacher/early-leave', {}, authToken),
      ]);

      setTeacherAttendance(attendanceRes);
      setTeacherTimetable(timetableRes.timetable || timetableRes.slots || []);
      setTeacherHomework(homeworkRes.homework || []);
      setTeacherArrangements(Array.isArray(arrangementsRes) ? arrangementsRes : arrangementsRes.arrangements || []);
      setTeacherEarlyLeaves(Array.isArray(earlyLeaveRes) ? earlyLeaveRes : earlyLeaveRes.requests || earlyLeaveRes.earlyLeaves || []);
    } catch (loadError) {
      setTeacherError(loadError instanceof Error ? loadError.message : 'Failed to load teacher dashboard.');
    } finally {
      setTeacherLoading(false);
      setRefreshing(false);
    }
  }

  async function loadStudentDashboard(authToken: string) {
    setStudentLoading(true);
    setStudentError(null);
    try {
      // Each section is independent — use allSettled so one failing endpoint
      // doesn't blank the whole dashboard. All requests carry the student Bearer
      // token and are scoped server-side to this student's own school/data.
      const [meR, attR, hwR, ttR, mkR, rcR, anR] = await Promise.allSettled([
        apiRequest<MobileMeResponse>('/api/mobile/me', {}, authToken),
        apiRequest<{ attendance: AttendanceItem[]; summary: StudentAttendanceSummary }>('/api/student/attendance', {}, authToken),
        apiRequest<{ homework: HomeworkItem[] }>('/api/student/homework', {}, authToken),
        apiRequest<{ timetable: TimetableItem[]; today: TimetableItem[] }>('/api/student/timetable', {}, authToken),
        apiRequest<{ marks: MarkItem[] }>('/api/student/marks', {}, authToken),
        apiRequest<{ reportCards: ReportCardItem[] }>('/api/student/report-cards', {}, authToken),
        apiRequest<{ announcements: AnnouncementItem[] }>('/api/student/announcements', {}, authToken),
      ]);

      if (meR.status === 'fulfilled' && meR.value.role === 'STUDENT' && meR.value.student) {
        setStudentProfile(meR.value.student);
        setStudentSchool(meR.value.school ?? null);
      }
      if (attR.status === 'fulfilled') {
        setStudentAttendance(attR.value.attendance || []);
        setStudentAttendanceSummary(attR.value.summary ?? null);
      }
      if (hwR.status === 'fulfilled') setStudentHomework(hwR.value.homework || []);
      if (ttR.status === 'fulfilled') setStudentTodayTimetable(ttR.value.today || []);
      if (mkR.status === 'fulfilled') setStudentMarks(mkR.value.marks || []);
      if (rcR.status === 'fulfilled') setStudentReportCards(rcR.value.reportCards || []);
      if (anR.status === 'fulfilled') setStudentAnnouncements(anR.value.announcements || []);

      const failures = [meR, attR, hwR, ttR, mkR, rcR, anR].filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected'
      );
      if (failures.length === 7) {
        const reason = failures[0].reason;
        setStudentError(reason instanceof Error ? reason.message : 'Failed to load student dashboard.');
      } else if (failures.length > 0) {
        setStudentError('Some sections could not be loaded. Pull down to refresh and try again.');
      }
    } finally {
      setStudentLoading(false);
      setRefreshing(false);
    }
  }

  function clearStudentData() {
    setAttendance([]);
    setMarks([]);
    setReportCards([]);
    setTimetable([]);
    setHomework([]);
  }

  async function handleLogin() {
    setError(null);
    setLoadingLogin(true);
    try {
      if (loginMode === 'PARENT') {
        if (!phone.trim() || !password.trim()) throw new Error('Please enter phone and password.');
        const loginRes = await apiRequest<LoginResponse>('/api/parent/login', {
          method: 'POST',
          body: JSON.stringify({ phone: phone.trim(), password }),
        });
        const nextUser = { ...loginRes.user, role: normalizeRole(loginRes.user.role) };
        setToken(loginRes.token);
        setUser(nextUser);
        await persistSession(loginRes.token, nextUser);
        await loadParentDashboard(loginRes.token, null);
        return;
      }

      if (loginMode === 'STAFF') {
        if (!email.trim() || !password.trim()) throw new Error('Please enter email and password.');
        const loginRes = await apiRequest<LoginResponse>('/api/mobile/staff/login', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const nextUser = { ...loginRes.user, role: normalizeRole(loginRes.user.role) };
        setToken(loginRes.token);
        setUser(nextUser);
        await persistSession(loginRes.token, nextUser);
        if (nextUser.role === 'TEACHER') await loadTeacherDashboard(loginRes.token);
        return;
      }

      if (loginMode === 'STUDENT') {
        if (!email.trim() || !password.trim()) throw new Error('Please enter admission number/email and password.');
        const loginRes = await apiRequest<LoginResponse>('/api/mobile/student/login', {
          method: 'POST',
          body: JSON.stringify({ admissionNo: email.trim(), email: email.trim(), password }),
        });
        const student = loginRes.student;
        if (!student) throw new Error('Invalid credentials');
        const nextUser: AppUser = {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'STUDENT',
          schoolId: student.schoolId,
        };
        setToken(loginRes.token);
        setUser(nextUser);
        setStudentProfile(student);
        setStudentSchool(loginRes.school ?? null);
        await persistSession(loginRes.token, nextUser);
        await loadStudentDashboard(loginRes.token);
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoadingLogin(false);
    }
  }

  async function handleChildChange(studentId: string) {
    if (!token) return;
    setSelectedStudentId(studentId);
    setLoadingData(true);
    setError(null);
    try {
      await loadStudentData(token, studentId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load student data.');
    } finally {
      setLoadingData(false);
    }
  }

  async function handleRefresh() {
    if (!token || !user) return;
    setRefreshing(true);
    const role = normalizeRole(user.role);
    if (role === 'PARENT') await loadParentDashboard(token, selectedStudentId);
    else if (role === 'TEACHER') await loadTeacherDashboard(token);
    else if (role === 'STUDENT') await loadStudentDashboard(token);
    else setRefreshing(false);
  }

  async function handleCreateFeeOrder(fee: PendingFeeItem) {
    if (!token) return;
    setError(null);
    try {
      await apiRequest(
        '/api/parent/fees/create-order',
        {
          method: 'POST',
          body: JSON.stringify({ studentId: fee.student.id, feeStructureId: fee.feeStructure.id }),
        },
        token
      );
      setError('Payment order created. Razorpay checkout needs the native mobile package to complete payment.');
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'Failed to create payment order.');
    }
  }

  async function handleSubmitHomework(item: HomeworkItem) {
    if (!token) return;
    const attachmentUrl = (submissionUrls[item.id] || '').trim();
    if (!attachmentUrl) {
      setError('Enter an attachment URL before submitting homework.');
      return;
    }

    setSubmittingHomeworkId(item.id);
    setError(null);
    try {
      await apiRequest(
        `/api/parent/homework/${item.homeworkId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ studentId: item.studentId, attachmentUrl }),
        },
        token
      );
      setSubmissionUrls((prev) => ({ ...prev, [item.id]: '' }));
      if (selectedStudentId) await loadStudentData(token, selectedStudentId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit homework.');
    } finally {
      setSubmittingHomeworkId(null);
    }
  }

  async function markTeacherPresent() {
    if (!token) return;
    setTeacherError(null);
    setMarkingAttendance(true);
    try {
      await apiRequest('/api/teacher/attendance/mark', { method: 'POST', body: JSON.stringify({ status: 'PRESENT' }) }, token);
      await loadTeacherDashboard(token);
    } catch (markError) {
      setTeacherError(markError instanceof Error ? markError.message : 'Failed to mark attendance.');
    } finally {
      setMarkingAttendance(false);
    }
  }

  function handleLogout() {
    AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => undefined);
    setToken(null);
    setUser(null);
    setChildren([]);
    setSelectedStudentId(null);
    clearStudentData();
    setAnnouncements([]);
    setPendingFees([]);
    setTeacherAttendance(null);
    setTeacherTimetable([]);
    setTeacherHomework([]);
    setTeacherArrangements([]);
    setTeacherEarlyLeaves([]);
    setTeacherError(null);
    setMarkingAttendance(false);
    setStudentProfile(null);
    setStudentSchool(null);
    setStudentLoading(false);
    setStudentError(null);
    setStudentAttendance([]);
    setStudentAttendanceSummary(null);
    setStudentHomework([]);
    setStudentTodayTimetable([]);
    setStudentMarks([]);
    setStudentReportCards([]);
    setStudentAnnouncements([]);
    setEmail('');
    setPhone('');
    setPassword('');
    setError(null);
  }

  const role = normalizeRole(user?.role);
  const theme = { backgroundColor: branding.primaryColor || DEFAULT_BRANDING.primaryColor };

  if (restoringSession) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, theme]}>
          <BrandHeader branding={branding} loading={loadingBranding} />
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={branding.primaryColor} />
        </View>
      </View>
    );
  }

  if (!token || !user) {
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, theme]}>
          <BrandHeader branding={branding} loading={loadingBranding} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Login</Text>
          <Segmented
            value={loginMode}
            options={[
              { value: 'STAFF', label: 'Staff' },
              { value: 'PARENT', label: 'Parent' },
              { value: 'STUDENT', label: 'Student' },
            ]}
            onChange={setLoginMode}
            color={branding.primaryColor}
          />

          {loginMode === 'STAFF' ? (
            <>
              <Text style={styles.label}>Staff Email</Text>
              <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="admin@school.edu" placeholderTextColor="#8a8a8a" style={styles.input} value={email} onChangeText={setEmail} />
            </>
          ) : null}

          {loginMode === 'PARENT' ? (
            <>
              <Text style={styles.label}>Guardian Phone</Text>
              <TextInput autoCapitalize="none" keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor="#8a8a8a" style={styles.input} value={phone} onChangeText={setPhone} />
            </>
          ) : null}

          {loginMode === 'STUDENT' ? (
            <>
              <Text style={styles.label}>Admission No or Email</Text>
              <TextInput autoCapitalize="none" placeholder="Admission number or email" placeholderTextColor="#8a8a8a" style={styles.input} value={email} onChangeText={setEmail} />
            </>
          ) : null}

          {loginMode === 'STUDENT' || loginMode === 'STAFF' || loginMode === 'PARENT' ? (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput secureTextEntry placeholder="Enter password" placeholderTextColor="#8a8a8a" style={styles.input} value={password} onChangeText={setPassword} />
            </>
          ) : null}

          {API_CONFIG_ERROR ? <Text style={styles.errorText}>{API_CONFIG_ERROR}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, theme, API_CONFIG_ERROR && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loadingLogin || Boolean(API_CONFIG_ERROR)}
          >
            {loadingLogin ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Login</Text>}
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={[styles.header, theme]}>
        <Text style={styles.title}>{branding.appName}</Text>
        <Text style={styles.subtitle}>Welcome, {user.name}</Text>
        <View style={styles.headerActions}>
          <Text style={styles.rolePill}>{roleLabel(role)}</Text>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {role === 'PARENT' ? (
        <ParentDashboard
          students={children}
          selectedStudentId={selectedStudentId}
          loadingData={loadingData}
          attendance={attendance}
          attendanceSummary={attendanceSummary}
          marks={marks}
          reportCards={reportCards}
          timetable={timetable}
          homework={homework}
          announcements={announcements}
          pendingFees={pendingFees}
          submittingHomeworkId={submittingHomeworkId}
          submissionUrls={submissionUrls}
          setSubmissionUrls={setSubmissionUrls}
          onChildChange={handleChildChange}
          onCreateFeeOrder={handleCreateFeeOrder}
          onSubmitHomework={handleSubmitHomework}
          color={branding.primaryColor}
        />
      ) : null}

      {role === 'TEACHER' ? (
        <TeacherDashboard
          loading={teacherLoading}
          attendance={teacherAttendance}
          timetable={teacherTimetable}
          homework={teacherHomework}
          arrangements={teacherArrangements}
          earlyLeaves={teacherEarlyLeaves}
          error={teacherError}
          markingAttendance={markingAttendance}
          onMarkPresent={markTeacherPresent}
          color={branding.primaryColor}
        />
      ) : null}

      {isAdminRole(role) ? <AdminDashboard role={role} color={branding.primaryColor} /> : null}
      {role === 'STUDENT' ? (
        <StudentDashboard
          student={studentProfile}
          school={studentSchool}
          loading={studentLoading}
          error={studentError}
          color={branding.primaryColor}
          attendance={studentAttendance}
          attendanceSummary={studentAttendanceSummary}
          homework={studentHomework}
          todayTimetable={studentTodayTimetable}
          marks={studentMarks}
          reportCards={studentReportCards}
          announcements={studentAnnouncements}
        />
      ) : null}
    </ScrollView>
  );
}

function BrandHeader({ branding, loading }: { branding: Branding; loading: boolean }) {
  return (
    <View style={styles.brandRow}>
      {branding.logoUrl ? <Image source={{ uri: branding.logoUrl }} style={styles.logo} /> : <View style={styles.logoFallback}><Text style={styles.logoText}>S</Text></View>}
      <View style={styles.brandText}>
        <Text style={styles.title}>{branding.appName}</Text>
        <Text style={styles.subtitle}>{loading ? 'Loading school branding...' : branding.schoolName}</Text>
        {branding.poweredBySchoolSync ? <Text style={styles.poweredBy}>Powered by SchoolSync</Text> : null}
      </View>
    </View>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  color,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  color: string;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} style={[styles.segment, active && { backgroundColor: color }]} onPress={() => onChange(option.value)}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ParentDashboard(props: {
  students: Child[];
  selectedStudentId: string | null;
  loadingData: boolean;
  attendance: AttendanceItem[];
  attendanceSummary: { present: number; absent: number; late: number };
  marks: MarkItem[];
  reportCards: ReportCardItem[];
  timetable: TimetableItem[];
  homework: HomeworkItem[];
  announcements: AnnouncementItem[];
  pendingFees: PendingFeeItem[];
  submittingHomeworkId: string | null;
  submissionUrls: Record<string, string>;
  setSubmissionUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onChildChange: (studentId: string) => void;
  onCreateFeeOrder: (fee: PendingFeeItem) => void;
  onSubmitHomework: (item: HomeworkItem) => void;
  color: string;
}) {
  if (props.loadingData) {
    return <View style={styles.loaderWrap}><ActivityIndicator size="large" color={props.color} /></View>;
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Children</Text>
        {props.students.length === 0 ? <Text style={styles.emptyText}>No linked students found for this account.</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {props.students.map((child) => {
            const isSelected = props.selectedStudentId === child.id;
            return (
              <Pressable key={child.id} style={[styles.childChip, isSelected && { borderColor: props.color, backgroundColor: '#eef6ff' }]} onPress={() => props.onChildChange(child.id)}>
                <Text style={[styles.childChipText, isSelected && { color: props.color }]}>{child.name}</Text>
                <Text style={styles.childChipSubtext}>
                  Roll {child.rollNo}
                  {child.section?.class?.name && child.section?.name ? ` - ${child.section.class.name}-${child.section.name}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FeesCard pendingFees={props.pendingFees} onCreateFeeOrder={props.onCreateFeeOrder} />
      <HomeworkCard {...props} />
      <AttendanceCard attendance={props.attendance} summary={props.attendanceSummary} />
      <MarksCard marks={props.marks} />
      <ReportCardsCard reportCards={props.reportCards} />
      <TimetableCard timetable={props.timetable} />
      <AnnouncementsCard announcements={props.announcements} />
    </>
  );
}

function TeacherDashboard({
  loading,
  attendance,
  timetable,
  homework,
  arrangements,
  earlyLeaves,
  error,
  markingAttendance,
  onMarkPresent,
  color,
}: {
  loading: boolean;
  attendance: TeacherTodayAttendance | null;
  timetable: TimetableItem[];
  homework: HomeworkItem[];
  arrangements: TeacherArrangement[];
  earlyLeaves: TeacherEarlyLeave[];
  error: string | null;
  markingAttendance: boolean;
  onMarkPresent: () => void;
  color: string;
}) {
  const status = attendance?.status || attendance?.attendance?.status || 'Not marked';
  const isPresent = status === 'PRESENT';
  const visibleHomework = homework.slice(0, 8);
  const activeHomework = homework.filter((item) => item.homeworkStatus === 'ACTIVE').length;

  return (
    <>
      <View style={styles.teacherHero}>
        <View style={styles.teacherHeroText}>
          <Text style={styles.teacherHeroLabel}>Today</Text>
          <Text style={styles.teacherHeroTitle}>Teacher Dashboard</Text>
          <Text style={styles.teacherHeroSubtext}>
            {timetable.length} periods · {activeHomework} active homework · {arrangements.length} substitutions
          </Text>
        </View>
        {loading ? <ActivityIndicator color={color} /> : null}
      </View>

      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorTitle}>Could not refresh teacher data</Text>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, styles.attendanceCard]}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Attendance</Text>
            <Text style={styles.listRowSubtext}>Today status</Text>
          </View>
          <Text style={[styles.statusBadge, isPresent ? styles.statusBadgeSuccess : styles.statusBadgeMuted]}>
            {formatStatus(status)}
          </Text>
        </View>
        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: isPresent ? '#94a3b8' : color },
            (loading || markingAttendance || isPresent) && styles.primaryButtonDisabled,
          ]}
          onPress={onMarkPresent}
          disabled={loading || markingAttendance || isPresent}
        >
          {markingAttendance ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{isPresent ? 'Present Marked' : 'Mark Present'}</Text>
          )}
        </Pressable>
      </View>

      <TeacherSection title="Today's Timetable" emptyText="No periods assigned for today.">
        {timetable.map((slot) => (
          <View key={slot.id} style={styles.teacherListItem}>
            <View style={[styles.periodBadge, { borderColor: color }]}>
              <Text style={[styles.periodBadgeText, { color }]}>P{slot.period}</Text>
            </View>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{slot.subject || 'Subject TBD'}</Text>
              <Text style={styles.listRowSubtext}>
                {classSectionLabel(slot.section)}
                {slot.startTime || slot.endTime ? ` · ${slot.startTime || ''}${slot.endTime ? `-${slot.endTime}` : ''}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </TeacherSection>

      <TeacherSection title="Homework" emptyText="No homework assigned yet.">
        {visibleHomework.map((item) => (
          <View key={item.id} style={styles.teacherListItem}>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{item.title}</Text>
              <Text style={styles.listRowSubtext}>{item.subject} · Deadline {formatDateTime(item.deadlineAt)}</Text>
              <View style={styles.teacherMetaRow}>
                <Text style={styles.methodPill}>{formatStatus(item.submissionStatus)}</Text>
                <Text style={styles.statusPill}>{item.homeworkStatus}</Text>
              </View>
            </View>
          </View>
        ))}
      </TeacherSection>

      <TeacherSection title="Arrangements / Substitutions" emptyText="No substitutions assigned.">
        {arrangements.map((item) => (
          <View key={item.id} style={styles.teacherListItem}>
            <View style={[styles.periodBadge, { borderColor: color }]}>
              <Text style={[styles.periodBadgeText, { color }]}>P{item.period || '-'}</Text>
            </View>
            <View style={styles.teacherListBody}>
              <Text style={styles.listRowTitle}>{item.subject || 'Substitution'}</Text>
              <Text style={styles.listRowSubtext}>{classSectionLabel(item.section)}</Text>
              {item.absentTeacher?.name ? <Text style={styles.remarkText}>For {item.absentTeacher.name}</Text> : null}
              {item.reason ? <Text style={styles.remarkText}>{item.reason}</Text> : null}
            </View>
          </View>
        ))}
      </TeacherSection>

      <TeacherSection title="Early Leave Requests" emptyText="No early leave requests." last>
        {earlyLeaves.map((item) => (
          <View key={item.id} style={styles.teacherListItem}>
            <View style={styles.teacherListBody}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.listRowTitle}>{formatStatus(item.status)}</Text>
                <Text style={styles.listRowValue}>After P{item.leaveAfterPeriod}</Text>
              </View>
              <Text style={styles.listRowSubtext}>{formatDate(item.date)}</Text>
              <Text style={styles.remarkText}>{item.reason}</Text>
            </View>
          </View>
        ))}
      </TeacherSection>
    </>
  );
}

function TeacherSection({
  title,
  emptyText,
  children,
  last,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const childArray = React.Children.toArray(children);
  return (
    <View style={[styles.card, last && styles.lastCard]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {childArray.length > 0 ? childArray : <Text style={styles.emptyText}>{emptyText}</Text>}
    </View>
  );
}

function AdminDashboard({ role, color }: { role: string; color: string }) {
  const cards = ['Students', 'Teachers', 'Fees', 'Attendance', 'Homework', 'Substitutions', 'Report Cards'];
  return (
    <View style={[styles.card, styles.lastCard]}>
      <Text style={styles.sectionTitle}>{roleLabel(role)} Dashboard</Text>
      <Text style={styles.emptyText}>Mobile admin overview is ready for backend summary APIs.</Text>
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card} style={styles.overviewTile}>
            <Text style={[styles.overviewNumber, { color }]}>--</Text>
            <Text style={styles.overviewLabel}>{card}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StudentDashboard({
  student,
  school,
  loading,
  error,
  color,
  attendance,
  attendanceSummary,
  homework,
  todayTimetable,
  marks,
  reportCards,
  announcements,
}: {
  student: StudentUser | null;
  school: SchoolInfo | null;
  loading: boolean;
  error: string | null;
  color: string;
  attendance: AttendanceItem[];
  attendanceSummary: StudentAttendanceSummary | null;
  homework: HomeworkItem[];
  todayTimetable: TimetableItem[];
  marks: MarkItem[];
  reportCards: ReportCardItem[];
  announcements: AnnouncementItem[];
}) {
  const className = student?.section?.class?.name;
  const sectionName = student?.section?.name;
  const classSection =
    className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
  const initial = (student?.name || 'S').trim().charAt(0).toUpperCase();
  const hasData =
    attendance.length > 0 ||
    homework.length > 0 ||
    todayTimetable.length > 0 ||
    marks.length > 0 ||
    reportCards.length > 0 ||
    announcements.length > 0 ||
    attendanceSummary !== null;

  return (
    <>
      {error ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorTitle}>Could not refresh student data</Text>
          <Text style={styles.inlineErrorText}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, styles.studentProfileCard]}>
        <View style={[styles.studentAvatar, { backgroundColor: color }]}>
          <Text style={styles.studentAvatarText}>{initial}</Text>
        </View>
        <View style={styles.studentProfileBody}>
          <Text style={styles.studentName}>{student?.name || 'Student'}</Text>
          <Text style={styles.studentClassLine}>{classSection || 'Class & section not provided'}</Text>
          <View style={styles.studentMetaRow}>
            <Text style={styles.studentMetaPill}>Roll {student?.rollNo || '--'}</Text>
            {student?.admissionNo ? <Text style={styles.studentMetaPill}>Adm {student.admissionNo}</Text> : null}
          </View>
          <Text style={styles.studentSchool}>{school?.name || 'School'}</Text>
        </View>
        {loading ? <ActivityIndicator color={color} /> : null}
      </View>

      {loading && !hasData ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={color} />
        </View>
      ) : (
        <>
          <StudentAttendanceCard attendance={attendance} summary={attendanceSummary} color={color} />
          <StudentHomeworkCard homework={homework} />
          <StudentTodayTimetableCard timetable={todayTimetable} color={color} />
          <MarksCard marks={marks} />
          <ReportCardsCard reportCards={reportCards} />
          <AnnouncementsCard announcements={announcements} />
        </>
      )}
    </>
  );
}

function StudentAttendanceCard({
  attendance,
  summary,
  color,
}: {
  attendance: AttendanceItem[];
  summary: StudentAttendanceSummary | null;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        {summary ? <Text style={[styles.attendancePct, { color }]}>{summary.percentage}%</Text> : null}
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Present: {summary?.present ?? 0}</Text>
        <Text style={styles.summaryText}>Absent: {summary?.absent ?? 0}</Text>
        <Text style={styles.summaryText}>Late: {summary?.late ?? 0}</Text>
      </View>
      {attendance.slice(0, 8).map((item) => (
        <InfoRow key={item.id} title={formatDate(item.date)} value={formatStatus(item.status)} />
      ))}
      {attendance.length === 0 ? <Text style={styles.emptyText}>No attendance records in the last 30 days.</Text> : null}
    </View>
  );
}

function StudentHomeworkCard({ homework }: { homework: HomeworkItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Homework</Text>
      {homework.slice(0, 8).map((item) => (
        <View key={item.id} style={styles.homeworkRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{item.title}</Text>
            <Text style={styles.listRowSubtext}>{item.subject} · Deadline {formatDateTime(item.deadlineAt)}</Text>
            {item.teacherRemark ? <Text style={styles.remarkText}>Remark: {item.teacherRemark}</Text> : null}
          </View>
          <View style={styles.homeworkMeta}>
            <Text style={styles.statusPill}>{formatStatus(item.submissionStatus)}</Text>
            <Text style={styles.methodPill}>{item.submissionMethod}</Text>
            {item.score !== null && item.maxScore !== null ? (
              <Text style={styles.listRowValue}>{item.score}/{item.maxScore}</Text>
            ) : null}
          </View>
        </View>
      ))}
      {homework.length === 0 ? <Text style={styles.emptyText}>No homework assigned.</Text> : null}
    </View>
  );
}

function StudentTodayTimetableCard({ timetable, color }: { timetable: TimetableItem[]; color: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Today&apos;s Timetable</Text>
      {timetable.map((slot) => (
        <View key={slot.id} style={styles.teacherListItem}>
          <View style={[styles.periodBadge, { borderColor: color }]}>
            <Text style={[styles.periodBadgeText, { color }]}>P{slot.period}</Text>
          </View>
          <View style={styles.teacherListBody}>
            <Text style={styles.listRowTitle}>{slot.subject || 'Subject TBD'}</Text>
            <Text style={styles.listRowSubtext}>{slot.teacher?.name || 'Teacher not assigned'}</Text>
          </View>
        </View>
      ))}
      {timetable.length === 0 ? <Text style={styles.emptyText}>No periods scheduled for today.</Text> : null}
    </View>
  );
}

function FeesCard({ pendingFees, onCreateFeeOrder }: { pendingFees: PendingFeeItem[]; onCreateFeeOrder: (fee: PendingFeeItem) => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Pending Fees</Text>
      {pendingFees.slice(0, 6).map((fee) => (
        <View key={`${fee.student.id}-${fee.feeStructure.id}`} style={styles.listRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{fee.feeStructure.name}</Text>
            <Text style={styles.listRowSubtext}>{fee.student.name}</Text>
          </View>
          <View style={styles.feeAction}>
            <Text style={styles.listRowValue}>Rs. {fee.feeStructure.amount.toLocaleString('en-IN')}</Text>
            <Pressable style={styles.smallButton} onPress={() => onCreateFeeOrder(fee)}><Text style={styles.smallButtonText}>Order</Text></Pressable>
          </View>
        </View>
      ))}
      {pendingFees.length === 0 ? <Text style={styles.emptyText}>No pending fees.</Text> : null}
    </View>
  );
}

function HomeworkCard(props: {
  homework: HomeworkItem[];
  submissionUrls: Record<string, string>;
  setSubmissionUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  submittingHomeworkId: string | null;
  onSubmitHomework: (item: HomeworkItem) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Homework</Text>
      {props.homework.slice(0, 8).map((item) => (
        <View key={item.id} style={styles.homeworkRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{item.title}</Text>
            <Text style={styles.listRowSubtext}>{item.subject} - Deadline {formatDateTime(item.deadlineAt)}</Text>
            <Text style={styles.remarkText}>Status: {item.submissionStatus.replace('_', ' ')} - Method: {item.submissionMethod}</Text>
            {item.teacherRemark ? <Text style={styles.remarkText}>Remark: {item.teacherRemark}</Text> : null}
            {item.homeworkStatus === 'ACTIVE' ? (
              <View style={styles.submitWrap}>
                <TextInput
                  autoCapitalize="none"
                  placeholder="Paste attachment URL"
                  placeholderTextColor="#8a8a8a"
                  style={styles.submitInput}
                  value={props.submissionUrls[item.id] || ''}
                  onChangeText={(value) => props.setSubmissionUrls((prev) => ({ ...prev, [item.id]: value }))}
                />
                <Pressable style={styles.smallButton} onPress={() => props.onSubmitHomework(item)} disabled={props.submittingHomeworkId === item.id}>
                  {props.submittingHomeworkId === item.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>Submit</Text>}
                </Pressable>
              </View>
            ) : null}
          </View>
          <View style={styles.homeworkMeta}>
            <Text style={styles.statusPill}>{item.submissionStatus.replace('_', ' ')}</Text>
            <Text style={styles.methodPill}>{item.submissionMethod}</Text>
            {item.score !== null && item.maxScore !== null ? <Text style={styles.listRowValue}>{item.score}/{item.maxScore}</Text> : null}
          </View>
        </View>
      ))}
      {props.homework.length === 0 ? <Text style={styles.emptyText}>No homework assigned.</Text> : null}
    </View>
  );
}

function AttendanceCard({ attendance, summary }: { attendance: AttendanceItem[]; summary: { present: number; absent: number; late: number } }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Attendance</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Present: {summary.present}</Text>
        <Text style={styles.summaryText}>Absent: {summary.absent}</Text>
        <Text style={styles.summaryText}>Late: {summary.late}</Text>
      </View>
      {attendance.slice(0, 8).map((item) => <InfoRow key={item.id} title={formatDate(item.date)} value={item.status} />)}
      {attendance.length === 0 ? <Text style={styles.emptyText}>No attendance records.</Text> : null}
    </View>
  );
}

function MarksCard({ marks }: { marks: MarkItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Marks</Text>
      {marks.map((item) => <InfoRow key={item.id} title={item.exam.name} subtitle={item.exam.scheme?.name || 'Exam'} value={`${item.marks}/${item.exam.maxMarks}${item.grade ? ` · ${item.grade}` : ''}`} />)}
      {marks.length === 0 ? <Text style={styles.emptyText}>No marks published yet.</Text> : null}
    </View>
  );
}

function ReportCardsCard({ reportCards }: { reportCards: ReportCardItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Published Report Cards</Text>
      {reportCards.map((item) => <InfoRow key={item.id} title={item.examScheme.name} subtitle={`${item.student.name} - Roll ${item.student.rollNo}${item.publishedAt ? ` - ${formatDate(item.publishedAt)}` : ''}`} value={`${item.percentage}% - ${item.grade}`} />)}
      {reportCards.length === 0 ? <Text style={styles.emptyText}>No published report cards yet.</Text> : null}
    </View>
  );
}

function TimetableCard({ timetable, title = 'Timetable' }: { timetable: TimetableItem[]; title?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {timetable.map((slot) => <InfoRow key={slot.id} title={`${DAY_NAMES[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`} - P${slot.period}`} subtitle={slot.teacher?.name || 'Teacher not assigned'} value={slot.subject || 'Subject TBD'} />)}
      {timetable.length === 0 ? <Text style={styles.emptyText}>No timetable available.</Text> : null}
    </View>
  );
}

function AnnouncementsCard({ announcements }: { announcements: AnnouncementItem[] }) {
  return (
    <View style={[styles.card, styles.lastCard]}>
      <Text style={styles.sectionTitle}>Announcements</Text>
      {announcements.map((item) => (
        <View key={item.id} style={styles.announcementCard}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementBody}>{item.body}</Text>
          <Text style={styles.announcementMeta}>{formatDate(item.publishedAt)}{item.createdBy?.name ? ` - ${item.createdBy.name}` : ''}</Text>
        </View>
      ))}
      {announcements.length === 0 ? <Text style={styles.emptyText}>No announcements yet.</Text> : null}
    </View>
  );
}

function InfoRow({ title, subtitle, value }: { title: string; subtitle?: string; value?: string }) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listRowLeft}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listRowSubtext}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.listRowValue}>{value}</Text> : null}
    </View>
  );
}

function classSectionLabel(section?: { name?: string; class?: { name?: string } }) {
  if (section?.class?.name && section.name) return `${section.class.name}-${section.name}`;
  if (section?.class?.name) return section.class.name;
  if (section?.name) return section.name;
  return 'Section not assigned';
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function roleLabel(role?: string) {
  if (role === 'SCHOOL_OWNER') return 'Owner';
  if (role === 'SCHOOL_ADMIN') return 'Admin';
  if (role === 'VICE_PRINCIPAL') return 'Principal';
  if (role === 'TEACHER') return 'Teacher';
  if (role === 'STUDENT') return 'Student';
  return 'Parent';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingVertical: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#fff' },
  logoFallback: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#1976D2', fontWeight: '800', fontSize: 24 },
  brandText: { flex: 1 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#E3F2FD', marginTop: 6 },
  poweredBy: { fontSize: 12, color: '#E3F2FD', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  rolePill: { overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 14, marginTop: 14, padding: 14, borderWidth: 1, borderColor: '#e8e8e8' },
  lastCard: { marginBottom: 24 },
  attendanceCard: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#222', marginBottom: 12, backgroundColor: '#fff' },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: '#dbe2ea', borderRadius: 12, padding: 3, marginBottom: 14, backgroundColor: '#f8fafc' },
  segment: { flex: 1, borderRadius: 9, paddingVertical: 9, alignItems: 'center' },
  segmentText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  segmentTextActive: { color: '#fff' },
  primaryButton: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryButtonDisabled: { backgroundColor: '#9bb8d8' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#d32f2f', marginBottom: 10, fontSize: 13 },
  errorBanner: { backgroundColor: '#ffebee', color: '#b71c1c', marginHorizontal: 14, marginTop: 14, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  inlineError: { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', marginHorizontal: 14, marginTop: 14, borderRadius: 12, padding: 12 },
  inlineErrorTitle: { color: '#9f1239', fontSize: 14, fontWeight: '800' },
  inlineErrorText: { color: '#be123c', fontSize: 12, lineHeight: 17, marginTop: 4 },
  infoBox: { backgroundColor: '#eef6ff', color: '#1d4f8f', padding: 10, borderRadius: 10, fontSize: 12, lineHeight: 17, marginBottom: 12 },
  logoutButton: { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  childChip: { borderWidth: 1, borderColor: '#dbe8f6', backgroundColor: '#f8fbff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginRight: 10, minWidth: 150 },
  childChipText: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  childChipSubtext: { marginTop: 4, fontSize: 12, color: '#596779' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  summaryText: { fontSize: 13, fontWeight: '600', color: '#333' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listRowLeft: { flexShrink: 1, paddingRight: 10 },
  listRowTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
  listRowSubtext: { marginTop: 2, fontSize: 12, color: '#666' },
  listRowValue: { fontSize: 13, fontWeight: '600', color: '#1976D2', textAlign: 'right' },
  feeAction: { alignItems: 'flex-end', gap: 6 },
  homeworkRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  homeworkMeta: { alignItems: 'flex-end', gap: 6 },
  statusPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#e9f2ff', color: '#0d47a1', paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  methodPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#f3f4f6', color: '#374151', paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  statusBadge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '800' },
  statusBadgeSuccess: { backgroundColor: '#dcfce7', color: '#166534' },
  statusBadgeMuted: { backgroundColor: '#f1f5f9', color: '#475569' },
  remarkText: { marginTop: 5, fontSize: 12, lineHeight: 16, color: '#4b5563' },
  submitWrap: { marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  submitInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#222', backgroundColor: '#fff' },
  smallButton: { backgroundColor: '#1976D2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  announcementCard: { borderWidth: 1, borderColor: '#ededed', borderRadius: 10, padding: 10, marginBottom: 10, backgroundColor: '#fcfcfc' },
  announcementTitle: { fontSize: 15, fontWeight: '700', color: '#222' },
  announcementBody: { marginTop: 6, fontSize: 13, lineHeight: 18, color: '#444' },
  announcementMeta: { marginTop: 8, fontSize: 12, color: '#666' },
  emptyText: { color: '#666', fontSize: 13, lineHeight: 19 },
  loaderWrap: { paddingVertical: 40 },
  teacherHero: { marginHorizontal: 14, marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  teacherHeroText: { flex: 1 },
  teacherHeroLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  teacherHeroTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', marginTop: 3 },
  teacherHeroSubtext: { color: '#475569', fontSize: 12, lineHeight: 17, marginTop: 5 },
  teacherListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  teacherListBody: { flex: 1 },
  teacherMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  periodBadge: { minWidth: 38, borderRadius: 10, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 8, alignItems: 'center', backgroundColor: '#f8fafc' },
  periodBadgeText: { fontSize: 12, fontWeight: '800' },
  studentProfileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  studentAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  studentProfileBody: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  studentClassLine: { marginTop: 3, fontSize: 13, fontWeight: '600', color: '#475569' },
  studentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  studentMetaPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#eef2ff', color: '#3730a3', paddingHorizontal: 9, paddingVertical: 3, fontSize: 11, fontWeight: '700' },
  studentSchool: { marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: '600' },
  attendancePct: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  overviewTile: { width: '47%', borderWidth: 1, borderColor: '#eef0f3', borderRadius: 12, padding: 12, backgroundColor: '#fbfcfe' },
  overviewNumber: { fontSize: 24, fontWeight: '800' },
  overviewLabel: { color: '#475569', fontSize: 12, marginTop: 4, fontWeight: '600' },
});

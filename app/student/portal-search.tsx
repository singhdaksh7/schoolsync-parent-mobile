import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { PortalSearch } from '@/components/PortalSearch';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { computeVisibleStudentPortalModules } from '@/lib/student-portal-modules';

// Filterable list rendering the same Student Portal tiles shown on
// app/student/index.tsx's grid — see lib/student-portal-modules.ts for the
// shared, unit-tested source of truth for what's real vs. dropped.
export default function StudentPortalSearchScreen() {
  const { role, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const modules = computeVisibleStudentPortalModules(hasFeature);

  return (
    <PortalSearch
      color={branding.primaryColor}
      modules={modules}
      onNavigate={(route) => router.push(route as never)}
      onBack={() => router.back()}
      onLogout={logout}
    />
  );
}

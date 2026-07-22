import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { PortalSearch } from '@/components/PortalSearch';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { useTeacherOperationsSelfStatus } from '@/hooks/useTeacherOperationsSelfStatus';
import { computeVisibleTeacherPortalModules } from '@/lib/teacher-portal-modules';

// Filterable list rendering the same Teacher Portal tiles shown on the Home
// tab's grid — see lib/teacher-portal-modules.ts for the shared,
// unit-tested source of truth for what's real vs. dropped.
export default function TeacherPortalSearchScreen() {
  const { role, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const opsStatus = useTeacherOperationsSelfStatus();
  const router = useRouter();

  if (role !== 'TEACHER') return <Redirect href="/" />;

  const modules = computeVisibleTeacherPortalModules(hasFeature, opsStatus.data?.isEffectiveOperationsHead ?? false);

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

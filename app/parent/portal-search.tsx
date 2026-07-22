import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { PortalSearch } from '@/components/PortalSearch';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { computeVisibleParentPortalModules } from '@/lib/parent-portal-modules';

// Filterable list rendering the same Parent Portal tiles shown in
// app/parent/index.tsx's grid — see lib/parent-portal-modules.ts for the
// shared, unit-tested source of truth for what's real vs. dropped.
export default function ParentPortalSearchScreen() {
  const { role, branding, logout } = useAuth();
  const { hasFeature } = useFeatureBootstrap();
  const router = useRouter();

  if (role !== 'PARENT') return <Redirect href="/" />;

  const modules = computeVisibleParentPortalModules(hasFeature);

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

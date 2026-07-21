import React from 'react';
import { Redirect } from 'expo-router';
import { ScrollView } from 'react-native';
import { ActorHeader } from '@/components/BrandHeader';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/lib/auth-context';
import { isAdminRole, roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';

export default function AdminScreen() {
  const { role, user, branding, logout } = useAuth();

  if (!isAdminRole(role)) return <Redirect href="/" />;

  return (
    <ScrollView style={styles.container}>
      <ActorHeader branding={branding} userName={user?.name || ''} roleLabel={roleLabel(role)} onLogout={logout} />
      <AdminDashboard role={role} color={branding.primaryColor} />
    </ScrollView>
  );
}

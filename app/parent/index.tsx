import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { ActorHeader } from '@/components/BrandHeader';
import { AnnouncementsCard } from '@/components/AnnouncementsCard';
import { AttendanceCard } from '@/components/AttendanceCard';
import { FeesCard } from '@/components/FeesCard';
import { HomeworkCard } from '@/components/HomeworkCard';
import { MarksCard } from '@/components/MarksCard';
import { ReportCardsCard } from '@/components/ReportCardsCard';
import { StudentLeaveCard } from '@/components/StudentLeaveCard';
import { TimetableCard } from '@/components/TimetableCard';
import { useParentDashboard } from '@/hooks/useParentDashboard';
import { useParentStudentLeave } from '@/hooks/useParentStudentLeave';
import { useAuth } from '@/lib/auth-context';
import { roleLabel } from '@/lib/format';
import { styles } from '@/lib/styles';

export default function ParentScreen() {
  const { role, user, branding, logout, token } = useAuth();
  const dashboard = useParentDashboard();
  const leave = useParentStudentLeave(dashboard.selectedStudentId);

  if (role !== 'PARENT') return <Redirect href="/" />;

  const refreshing = dashboard.refreshing || leave.refreshing;
  const handleRefresh = () => {
    dashboard.handleRefresh();
    leave.handleRefresh();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <ActorHeader branding={branding} userName={user?.name || ''} roleLabel={roleLabel(role)} onLogout={logout} />

      {dashboard.error ? <Text style={styles.errorBanner}>{dashboard.error}</Text> : null}

      {dashboard.loadingData ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={branding.primaryColor} />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Children</Text>
            {dashboard.children.length === 0 ? (
              <Text style={styles.emptyText}>No linked students found for this account.</Text>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dashboard.children.map((child) => {
                const isSelected = dashboard.selectedStudentId === child.id;
                return (
                  <Pressable
                    key={child.id}
                    style={[styles.childChip, isSelected && { borderColor: branding.primaryColor, backgroundColor: '#eef6ff' }]}
                    onPress={() => dashboard.handleChildChange(child.id)}
                  >
                    <Text style={[styles.childChipText, isSelected && { color: branding.primaryColor }]}>{child.name}</Text>
                    <Text style={styles.childChipSubtext}>
                      Roll {child.rollNo}
                      {child.section?.class?.name && child.section?.name ? ` - ${child.section.class.name}-${child.section.name}` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <FeesCard pendingFees={dashboard.pendingFees} />
          <HomeworkCard
            homework={dashboard.homework}
            submittingHomeworkId={dashboard.submittingHomeworkId}
            onSubmitHomework={dashboard.handleSubmitHomework}
          />
          <AttendanceCard attendance={dashboard.attendance} summary={dashboard.attendanceSummary} />
          <MarksCard marks={dashboard.marks} />
          <ReportCardsCard reportCards={dashboard.reportCards} token={token} pdfPathPrefix="/api/parent/report-cards" />
          <TimetableCard timetable={dashboard.timetable} />
          <StudentLeaveCard
            leaves={leave.leaves}
            loading={leave.loading}
            creating={leave.creating}
            error={leave.error}
            color={branding.primaryColor}
            onCreate={leave.createLeave}
          />
          <AnnouncementsCard announcements={dashboard.announcements} />
        </>
      )}
    </ScrollView>
  );
}

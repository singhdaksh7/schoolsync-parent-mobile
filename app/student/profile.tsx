import React from 'react';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { SubScreenHeader } from '@/components/SubScreenHeader';
import { styles } from '@/lib/styles';

// Same profile fields already shown inline on app/student/index.tsx's main
// dashboard — this screen just gives Profile its own reachable route for the
// Student Portal grid/search, reusing the identical data (no new endpoint).
export default function StudentProfileScreen() {
  const { role, studentProfile, studentSchool, branding } = useAuth();
  const router = useRouter();

  if (role !== 'STUDENT') return <Redirect href="/" />;

  const className = studentProfile?.section?.class?.name;
  const sectionName = studentProfile?.section?.name;
  const classSection = className && sectionName ? `${className} - ${sectionName}` : className || sectionName || null;
  const initial = (studentProfile?.name || 'S').trim().charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <SubScreenHeader title="Profile" color={branding.primaryColor} onBack={() => router.back()} />

      <View style={[styles.card, styles.studentProfileCard]}>
        <View style={[styles.studentAvatar, { backgroundColor: branding.primaryColor }]}>
          <Text style={styles.studentAvatarText}>{initial}</Text>
        </View>
        <View style={styles.studentProfileBody}>
          <Text style={styles.studentName}>{studentProfile?.name || 'Student'}</Text>
          <Text style={styles.studentClassLine}>{classSection || 'Class & section not provided'}</Text>
          <View style={styles.studentMetaRow}>
            <Text style={styles.studentMetaPill}>Roll {studentProfile?.rollNo || '--'}</Text>
            {studentProfile?.admissionNo ? <Text style={styles.studentMetaPill}>Adm {studentProfile.admissionNo}</Text> : null}
          </View>
          <Text style={styles.studentSchool}>{studentSchool?.name || 'School'}</Text>
        </View>
      </View>

      {studentProfile?.email ? (
        <View style={[styles.card, styles.lastCard]}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.listRowSubtext}>{studentProfile.email}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

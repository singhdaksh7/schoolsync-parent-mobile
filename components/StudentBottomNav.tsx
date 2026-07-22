import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { Theme } from '@/constants/theme';

export type StudentNavTab = 'home' | 'schedule' | 'academic' | 'menu';

const TABS: { key: StudentNavTab; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'home', label: 'Home', icon: 'home', route: '/student' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar', route: '/student/timetable' },
  // Stitch's mockups show "Academic" highlighted as active on several
  // different screens (Profile, Attendance, Marks, Report Cards, Homework)
  // but never define where tapping it actually navigates (every nav link in
  // the source HTML is href="#"). Marks was picked as the single
  // destination — the most representative "academic data" screen — rather
  // than inventing a new hub screen not in the Stitch design set.
  { key: 'academic', label: 'Academic', icon: 'school', route: '/student/marks' },
  { key: 'menu', label: 'Menu', icon: 'menu', route: '/student/portal' },
];

/**
 * Floating frosted bottom nav shared by every rebuilt student screen
 * (Stitch's `<nav class="fixed bottom-6 ... backdrop-blur-2xl">`). This is a
 * plain shared UI component, not an Expo Router `Tabs` navigator — see the
 * bottom-nav investigation in the task report for why. Each screen renders
 * this at the bottom and passes which tab is "active"; tapping a tab calls
 * `router.push`, exactly like the existing `PortalGrid` tile navigation.
 * Student portal only.
 */
export function StudentBottomNav({ active, color }: { active: StudentNavTab; color: string }) {
  const router = useRouter();

  return (
    <GlassSurface
      intensity={50}
      radius={Theme.radii.full}
      glow
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        zIndex: 50,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => router.push(tab.route as never)}
            hitSlop={6}
            style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 4 }}
          >
            <Ionicons name={tab.icon} size={22} color={isActive ? color : Theme.colors.onSurfaceVariant} />
            <Text
              style={{
                marginTop: 2,
                fontSize: 10,
                fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? color : Theme.colors.onSurfaceVariant,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </GlassSurface>
  );
}

export const STUDENT_BOTTOM_NAV_HEIGHT = 88;

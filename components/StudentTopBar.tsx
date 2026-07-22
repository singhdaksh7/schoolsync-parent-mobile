import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { Theme } from '@/constants/theme';

/**
 * Floating frosted top app bar shared by every rebuilt student screen
 * (Stitch's `<header class="fixed top-4 ... backdrop-blur-xl">`). Student
 * portal only — `SubScreenHeader` (the solid, non-floating header Parent and
 * Teacher use) is untouched.
 *
 * Stitch's bar also shows a notification bell and a student photo avatar.
 * Dropped both: there is no notifications feature/endpoint anywhere in this
 * app (the bell would be decorative and do nothing on press — that's the
 * kind of faked affordance the brief says not to build), and there is no
 * profile photo URL in the data model. A single-letter avatar (from the
 * student's real name, same pattern already used on the dashboard/profile
 * screens) stands in for the photo circle instead of a fake image.
 */
export function StudentTopBar({
  title,
  initial,
  onBack,
  color,
}: {
  title: string;
  initial?: string;
  onBack?: () => void;
  color: string;
}) {
  return (
    <GlassSurface
      intensity={50}
      radius={Theme.radii.xl}
      glow
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 10,
      }}
    >
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={22} color={color} />
        </Pressable>
      ) : null}
      <Text style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 18, fontWeight: '700', color }} numberOfLines={1}>
        {title}
      </Text>
      {initial ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color,
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 14, fontWeight: '700' }}>{initial}</Text>
        </View>
      ) : null}
    </GlassSurface>
  );
}

export const STUDENT_TOP_BAR_HEIGHT = 76;

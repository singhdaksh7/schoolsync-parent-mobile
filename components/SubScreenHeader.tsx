import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '@/lib/styles';

/**
 * Shared back-arrow header for Student Portal detail screens and the portal
 * Search screen. `onBack` defaults to router.back() at the call site; kept
 * as a required prop here so this component stays navigation-library-free.
 */
export function SubScreenHeader({
  title,
  color,
  onBack,
  rightIcon,
  onRightPress,
}: {
  title: string;
  color: string;
  onBack: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.subScreenHeader, { backgroundColor: color, paddingTop: insets.top + styles.subScreenHeader.paddingVertical }]}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </Pressable>
      <Text style={styles.subScreenHeaderTitle}>{title}</Text>
      {rightIcon ? (
        <Pressable onPress={onRightPress} hitSlop={10}>
          <Ionicons name={rightIcon} size={22} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { Theme } from '@/constants/theme';

/**
 * Shared empty-state block matching the Stitch "Empty States" screen —
 * icon + title + message, with an optional single call-to-action. Drop-in
 * replacement for the old bare `<Text style={styles.emptyText}>` fallbacks
 * used inside card components (AnnouncementsCard, MarksCard, etc.).
 */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyStateWrap}>
      <View style={styles.emptyStateIconWrap}>
        <Ionicons name={icon} size={26} color={Theme.colors.onSurfaceVariant} />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {message ? <Text style={styles.emptyStateMessage}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={[styles.smallButton, { marginTop: 8 }]} onPress={onAction}>
          <Text style={styles.smallButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

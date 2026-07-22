import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { Theme } from '@/constants/theme';

/**
 * Shared empty-state block matching the Stitch "Empty States" screen —
 * a large icon circle (optionally with a second small overlapping badge
 * circle, e.g. a checkmark/hourglass), title, message, and EITHER a single
 * call-to-action button OR an info-strip footer (Stitch's two Empty States
 * examples use one or the other, never both — same here). Drop-in
 * replacement for the old bare `<Text style={styles.emptyText}>` fallbacks
 * used inside card components (AnnouncementsCard, MarksCard, etc.).
 *
 * NOTE: shared by Parent and Teacher screens too (MarksCard, ReportCardsCard,
 * AnnouncementsCard, TimetableCard, PortalSearch all render this) — there is
 * no separate empty-state primitive to fork, so this restyle cosmetically
 * affects their empty states as well. Reported as required. All existing
 * call sites keep working unchanged: the new `badgeIcon`/`infoText` props
 * are additive and optional.
 */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
  badgeIcon,
  badgeColor = Theme.colors.primary,
  infoText,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Small overlapping badge icon on the main icon circle (Stitch's second, smaller circle). */
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  badgeColor?: string;
  /** Info-strip footer instead of a button (e.g. "Expected date: ..."). */
  infoText?: string;
}) {
  return (
    <View style={styles.emptyStateWrap}>
      <View style={{ position: 'relative', marginBottom: 4 }}>
        <View style={styles.emptyStateIconWrapLg}>
          <Ionicons name={icon} size={40} color={Theme.colors.onSurfaceVariant + '99'} />
        </View>
        {badgeIcon ? (
          <View style={[styles.emptyStateBadge, { backgroundColor: badgeColor + '33', bottom: -4, right: -4 }]}>
            <Ionicons name={badgeIcon} size={18} color={badgeColor} />
          </View>
        ) : null}
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {message ? <Text style={styles.emptyStateMessage}>{message}</Text> : null}
      {infoText ? (
        <View style={styles.emptyStateInfoStrip}>
          <Ionicons name="information-circle-outline" size={16} color={Theme.colors.secondary} />
          <Text style={styles.emptyStateInfoStripText}>{infoText}</Text>
        </View>
      ) : actionLabel && onAction ? (
        <Pressable style={[styles.smallButton, { marginTop: 12, borderRadius: Theme.radii.full, paddingHorizontal: Theme.spacing.md }]} onPress={onAction}>
          <Text style={styles.smallButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

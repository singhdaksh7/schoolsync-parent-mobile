import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';

type Blob = { color: string; size: number; top?: number; left?: number; right?: number; bottom?: number };

/**
 * Ambient screen background behind the "liquid glass" student portal
 * screens. Previously drawn as concentric-circle "blobs" approximating
 * Stitch's `filter: blur(80px)` color orbs — on-device that read as visible
 * hard-edged rings, not a soft glow (expo-blur's BlurView blurs whatever
 * renders *behind* it; it cannot soften a shape's own edges, so the
 * concentric-ring trick was the best available approximation and it still
 * wasn't good enough). Replaced with a subtle diagonal wash via
 * expo-linear-gradient instead: primary-tinted at top-left, the flat
 * Academic Clarity background color in the middle, secondary-tinted at
 * bottom-right — echoes Stitch's two-color blob scheme (primaryContainer /
 * secondaryContainer) without any hard edges. Tints are held to 6-7% opacity
 * ("rgba" alpha, not the base theme color) specifically so the wash stays
 * quiet behind the glass cards — enough spatial variation for BlurView's
 * blur to visibly do something, not enough to compete with the foreground.
 *
 * The `blobs` prop is accepted but intentionally unused — kept so none of
 * the 10 call sites (all `app/student/*`) needed touching for this
 * background-only change.
 */
export function LiquidBackground(_props: { blobs?: Blob[] }) {
  return (
    <LinearGradient
      colors={['rgba(0,91,191,0.07)', Theme.colors.background, 'rgba(77,142,254,0.06)']}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

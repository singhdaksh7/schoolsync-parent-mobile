import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '@/constants/theme';

/**
 * Student-portal-only "liquid glass" surface — the frosted, translucent card
 * used throughout the Stitch designs (`.glass-card`/`.glass-panel`/
 * `.liquid-card`/`.liquid-glass`). Not used by Parent/Teacher, which have no
 * Stitch design and keep the flat `styles.card` look.
 *
 * CSS `backdrop-filter: blur(Npx)` has no React Native equivalent — the
 * closest faithful substitute is expo-blur's `BlurView`, which blurs
 * whatever is rendered *behind* it in the view hierarchy (works because
 * every screen using this renders `LiquidBackground` blobs behind the
 * content). `intensity` (0-100) approximates the blur px value; there is no
 * 1:1 mapping to CSS px, so values below are chosen by visual match against
 * the Stitch screenshots, not computed.
 */
export function GlassSurface({
  children,
  style,
  intensity = 40,
  radius = Theme.radii.lg,
  tint = 'light',
  glow = false,
  borderColor = 'rgba(255,255,255,0.5)',
  overlayColor = 'rgba(255,255,255,0.35)',
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  radius?: number;
  tint?: 'light' | 'dark' | 'default';
  glow?: boolean;
  borderColor?: string;
  overlayColor?: string;
}) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor }, glow ? styles.glow : null, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // CSS `box-shadow: 0 8px 32px rgba(31,38,135,0.07)` (soft colored glow) has
  // no cross-platform RN equivalent: iOS honors shadowColor/Offset/Opacity/
  // Radius with soft, colored shadows; Android's `elevation` only produces a
  // fixed grey shadow with no color/blur-radius control. Both are set below
  // so the glow shows on both platforms, but Android's will look flatter/
  // greyer than iOS's — a real platform capability gap, not an oversight.
  glow: Platform.select({
    ios: {
      shadowColor: '#1f2687',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle,
});

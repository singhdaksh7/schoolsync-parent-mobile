import React from 'react';
import { StyleSheet, View } from 'react-native';

type Blob = { color: string; size: number; top?: number; left?: number; right?: number; bottom?: number };

/**
 * Decorative ambient background blobs behind the "liquid glass" screens
 * (Stitch's `.liquid-bg-blob` / `.liquid-orb`, e.g. `filter: blur(80px);
 * opacity: 0.4`). CSS `filter: blur()` on a shape's own edges has no React
 * Native equivalent — expo-blur's BlurView blurs whatever renders *behind*
 * it, it cannot soften a shape's own boundary. A true Gaussian blur here
 * would need an image/shader-based blur library, which wasn't authorized
 * (only expo-blur was). Substitute used: each blob is drawn as 3 concentric
 * circles of the same color at decreasing opacity/increasing size, which
 * approximates a soft falloff at the edge instead of Stitch's exact blur
 * radius — closer than a single flat-opacity circle, but still a visibly
 * harder edge than the CSS original.
 */
export function LiquidBackground({ blobs }: { blobs: Blob[] }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {blobs.map((blob, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: blob.top,
            left: blob.left,
            right: blob.right,
            bottom: blob.bottom,
            width: blob.size * 1.6,
            height: blob.size * 1.6,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: blob.size * 1.6,
              height: blob.size * 1.6,
              borderRadius: blob.size * 0.8,
              backgroundColor: blob.color,
              opacity: 0.08,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: blob.size * 1.2,
              height: blob.size * 1.2,
              borderRadius: blob.size * 0.6,
              backgroundColor: blob.color,
              opacity: 0.14,
            }}
          />
          <View
            style={{
              width: blob.size,
              height: blob.size,
              borderRadius: blob.size / 2,
              backgroundColor: blob.color,
              opacity: 0.2,
            }}
          />
        </View>
      ))}
    </View>
  );
}

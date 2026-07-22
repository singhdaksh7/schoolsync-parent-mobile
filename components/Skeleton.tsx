import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { styles } from '@/lib/styles';

/**
 * Single pulsing skeleton block. Matches the Stitch "Loading State
 * (Skeleton)" screen's shimmer treatment — used directly, or composed via
 * CardSkeleton/ListSkeleton below.
 */
export function Skeleton({ width, height, style }: { width?: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeletonBlock, { width: width ?? '100%', height: height ?? 14, opacity }, style]} />;
}

/** A skeleton shaped like a `styles.card` with a title line + N body rows — for screens like Timetable/Attendance/Marks while their first fetch is in flight. */
export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="50%" height={18} style={{ marginBottom: 14 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: 12, gap: 6 }}>
          <Skeleton width="90%" height={13} />
          <Skeleton width="60%" height={11} />
        </View>
      ))}
    </View>
  );
}

/** A skeleton for list-heavy screens (announcements/report cards) — N standalone card blocks stacked. */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <View>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} rows={2} />
      ))}
    </View>
  );
}

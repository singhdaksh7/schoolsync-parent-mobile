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

/**
 * Loading Skeleton shaped like the real Stitch "Dashboard" bento layout
 * (2 stat-card placeholders + a 6-tile Quick Actions grid placeholder) —
 * student portal only, used while `app/student/index.tsx`'s first fetch is
 * in flight. Purely additive to this file; `Skeleton`/`CardSkeleton`/
 * `ListSkeleton` above are unchanged and still used as-is by Parent screens.
 */
export function DashboardSkeleton() {
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
        <View style={[styles.card, { flex: 1, marginHorizontal: 0, marginTop: 0, minHeight: 108, justifyContent: 'space-between' }]}>
          <Skeleton width="60%" height={11} />
          <Skeleton width="40%" height={24} />
        </View>
        <View style={[styles.card, { flex: 1, marginHorizontal: 0, marginTop: 0, minHeight: 108, justifyContent: 'space-between' }]}>
          <Skeleton width="60%" height={11} />
          <Skeleton width="40%" height={24} />
        </View>
      </View>
      <Skeleton width="35%" height={20} style={{ marginTop: 32, marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={[styles.card, { width: '47%', marginHorizontal: 0, marginTop: 0, alignItems: 'center', gap: 8, paddingVertical: 24 }]}>
            <Skeleton width={48} height={48} style={{ borderRadius: 24 }} />
            <Skeleton width="70%" height={11} />
          </View>
        ))}
      </View>
    </View>
  );
}

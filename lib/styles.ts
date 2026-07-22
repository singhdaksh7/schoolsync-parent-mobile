// Shared StyleSheet for the SchoolSync mobile app. Extracted from the
// original single-file app/index.tsx so every screen/component draws from
// one place instead of redefining the same card/list/pill styles.
// Colors/typography/spacing/radii are drawn from the "Academic Clarity"
// design tokens in constants/theme.ts.
import { StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

const { colors, typography, spacing, radii } = Theme;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: '#fff' },
  logoFallback: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.primary, fontWeight: '800', fontSize: 24 },
  brandText: { flex: 1 },
  title: { ...typography.headlineMd, color: '#fff' },
  subtitle: { ...typography.bodyMd, color: '#dbe9ff', marginTop: 6 },
  poweredBy: { ...typography.labelSm, color: '#dbe9ff', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 12 },
  rolePill: { overflow: 'hidden', borderRadius: radii.full, backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', paddingHorizontal: 10, paddingVertical: 5, ...typography.labelMd, letterSpacing: 0 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, marginHorizontal: 14, marginTop: 14, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant },
  lastCard: { marginBottom: 24 },
  attendanceCard: { gap: 12 },
  sectionTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: 10 },
  label: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.DEFAULT, paddingHorizontal: 12, paddingVertical: 10, ...typography.bodyMd, color: colors.onSurface, marginBottom: 12, backgroundColor: colors.surfaceContainerLowest },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, padding: 3, marginBottom: 14, backgroundColor: colors.surfaceContainerLow },
  segment: { flex: 1, borderRadius: radii.DEFAULT, paddingVertical: 9, alignItems: 'center' },
  segmentText: { ...typography.labelMd, color: colors.onSurfaceVariant, letterSpacing: 0 },
  segmentTextActive: { color: '#fff' },
  primaryButton: { borderRadius: radii.DEFAULT, paddingVertical: 12, alignItems: 'center', marginTop: 4, backgroundColor: colors.primary },
  primaryButtonDisabled: { backgroundColor: colors.surfaceDim },
  primaryButtonText: { color: '#fff', ...typography.bodyLg, fontWeight: '700' },
  errorText: { color: colors.error, marginBottom: 10, ...typography.bodyMd, fontSize: 13 },
  errorBanner: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer, marginHorizontal: 14, marginTop: 14, borderRadius: radii.DEFAULT, paddingHorizontal: 12, paddingVertical: 10, ...typography.bodyMd, fontSize: 13 },
  inlineError: { backgroundColor: colors.errorContainer, borderWidth: 1, borderColor: colors.error, marginHorizontal: 14, marginTop: 14, borderRadius: radii.md, padding: 12 },
  inlineErrorTitle: { color: colors.onErrorContainer, ...typography.bodyMd, fontWeight: '800' },
  inlineErrorText: { color: colors.onErrorContainer, fontSize: 12, lineHeight: 17, marginTop: 4 },
  infoBox: { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer, padding: 10, borderRadius: radii.DEFAULT, fontSize: 12, lineHeight: 17, marginBottom: 12 },
  logoutButton: { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  logoutButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  pilotBadge: { backgroundColor: colors.warning, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2 },
  pilotBadgeText: { color: '#1f2937', fontWeight: '800', fontSize: 10, letterSpacing: 0.5 },
  childChip: { borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingVertical: 10, paddingHorizontal: 12, marginRight: 10, minWidth: 150 },
  childChipText: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  childChipSubtext: { marginTop: 4, fontSize: 12, color: colors.onSurfaceVariant },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  summaryText: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  listRowLeft: { flexShrink: 1, paddingRight: 10 },
  listRowTitle: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  listRowSubtext: { marginTop: 2, fontSize: 12, color: colors.onSurfaceVariant },
  listRowValue: { fontSize: 13, fontWeight: '600', color: colors.primary, textAlign: 'right' },
  feeAction: { alignItems: 'flex-end', gap: 6 },
  homeworkRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  homeworkMeta: { alignItems: 'flex-end', gap: 6 },
  statusPill: { overflow: 'hidden', borderRadius: radii.full, backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  methodPill: { overflow: 'hidden', borderRadius: radii.full, backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '700' },
  statusBadge: { overflow: 'hidden', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '800' },
  statusBadgeSuccess: { backgroundColor: colors.successContainer, color: colors.success },
  statusBadgeMuted: { backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant },
  remarkText: { marginTop: 5, fontSize: 12, lineHeight: 16, color: colors.onSurfaceVariant },
  submitWrap: { marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  submitInput: { flex: 1, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: colors.onSurface, backgroundColor: colors.surfaceContainerLowest },
  smallButton: { backgroundColor: colors.primary, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5 },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  announcementCard: { borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.DEFAULT, padding: 10, marginBottom: 10, backgroundColor: colors.surfaceContainerLow },
  announcementTitle: { ...typography.bodyLg, fontSize: 15, fontWeight: '700', color: colors.onSurface },
  announcementBody: { marginTop: 6, fontSize: 13, lineHeight: 18, color: colors.onSurfaceVariant },
  announcementMeta: { marginTop: 8, fontSize: 12, color: colors.onSurfaceVariant },
  emptyText: { color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 19 },
  loaderWrap: { paddingVertical: 40 },
  teacherHero: { marginHorizontal: 14, marginTop: 14, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  teacherHeroText: { flex: 1 },
  teacherHeroLabel: { color: colors.onSurfaceVariant, ...typography.labelMd, letterSpacing: 0.6 },
  teacherHeroTitle: { color: colors.onSurface, ...typography.titleLg, fontWeight: '800', marginTop: 3 },
  teacherHeroSubtext: { color: colors.onSurfaceVariant, fontSize: 12, lineHeight: 17, marginTop: 5 },
  teacherListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  teacherListBody: { flex: 1 },
  teacherMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  periodBadge: { minWidth: 38, borderRadius: radii.DEFAULT, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 8, alignItems: 'center', backgroundColor: colors.surfaceContainerLow },
  periodBadgeText: { fontSize: 12, fontWeight: '800' },
  studentProfileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  studentAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  studentProfileBody: { flex: 1 },
  studentName: { ...typography.titleLg, fontWeight: '800', color: colors.onSurface },
  studentClassLine: { marginTop: 3, fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant },
  studentMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  studentMetaPill: { overflow: 'hidden', borderRadius: radii.full, backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer, paddingHorizontal: 9, paddingVertical: 3, fontSize: 11, fontWeight: '700' },
  studentSchool: { marginTop: 8, fontSize: 12, color: colors.onSurfaceVariant, fontWeight: '600' },
  attendancePct: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  overviewTile: { width: '47%', borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, padding: 12, backgroundColor: colors.surfaceContainerLow },
  overviewNumber: { fontSize: 24, fontWeight: '800' },
  overviewLabel: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4, fontWeight: '600' },

  // Simple back-arrow sub-screen header, shared by every Student Portal
  // detail screen (Profile/Timetable/Attendance/Marks/Report Cards/
  // Announcements) and the portal Search screen — distinct from
  // components/BrandHeader.tsx's ActorHeader, which is branding-first and
  // has no back navigation.
  subScreenHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, gap: 14, borderBottomLeftRadius: radii.lg, borderBottomRightRadius: radii.lg },
  subScreenHeaderTitle: { flex: 1, ...typography.titleLg, color: '#fff' },
  subScreenHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // Student/Parent/Teacher Portal grid (3-column icon-tile menu), shared via
  // components/PortalGrid.tsx.
  portalGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingTop: 16, gap: '2%' },
  portalTile: { width: '31.33%', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii.lg, paddingVertical: 16, paddingHorizontal: 6, marginBottom: 14 },
  portalTileBadge: { width: 52, height: 52, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  portalTileLabel: { fontSize: 12, fontWeight: '600', color: colors.onSurface, textAlign: 'center', lineHeight: 16 },

  // Student/Parent/Teacher Portal search (filterable vertical list, same
  // tiles as rows), shared via components/PortalSearch.tsx.
  searchInputWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.surfaceContainerLowest },
  searchInput: { flex: 1, fontSize: 15, color: colors.onSurface, padding: 0 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  searchRowBadge: { width: 36, height: 36, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  searchRowLabel: { fontSize: 15, fontWeight: '600', color: colors.onSurface },

  // Skeleton loading primitive (components/Skeleton.tsx).
  skeletonBlock: { backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.DEFAULT, overflow: 'hidden' },

  // Empty state primitive (components/EmptyState.tsx).
  emptyStateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16, gap: 8 },
  emptyStateIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyStateTitle: { ...typography.bodyLg, fontWeight: '700', color: colors.onSurface, textAlign: 'center' },
  emptyStateMessage: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },

  // System-state screens (components/ScreenErrorFallback.tsx).
  systemStateIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12, backgroundColor: colors.errorContainer },
});

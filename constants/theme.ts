// Design tokens for the "Academic Clarity" design system (Stitch project
// "Unified School Management Hub"). Replaces the unused create-expo-app
// boilerplate that used to live here.

export const Theme = {
  colors: {
    background: '#f7f9ff',
    surface: '#f7f9ff',
    surfaceDim: '#d7dae0',
    surfaceBright: '#f7f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f4fa',
    surfaceContainer: '#ebeef4',
    surfaceContainerHigh: '#e5e8ee',
    surfaceContainerHighest: '#dfe3e8',
    onSurface: '#181c20',
    onSurfaceVariant: '#414754',
    inverseSurface: '#2d3135',
    inverseOnSurface: '#eef1f7',
    outline: '#727785',
    outlineVariant: '#c1c6d6',
    primary: '#005bbf',
    onPrimary: '#ffffff',
    primaryContainer: '#1a73e8',
    onPrimaryContainer: '#ffffff',
    secondary: '#005ac1',
    onSecondary: '#ffffff',
    secondaryContainer: '#4d8efe',
    onSecondaryContainer: '#00285c',
    tertiary: '#5c5e60',
    onTertiary: '#ffffff',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    success: '#166534',
    successContainer: '#dcfce7',
    warning: '#b45309',
    warningContainer: '#fef3c7',
  },
  typography: {
    displayLg: { fontFamily: 'Inter_700Bold', fontSize: 48, fontWeight: '700' as const, lineHeight: 56, letterSpacing: -0.4 },
    headlineLg: { fontFamily: 'Inter_600SemiBold', fontSize: 32, fontWeight: '600' as const, lineHeight: 40, letterSpacing: -0.2 },
    headlineMd: { fontFamily: 'Inter_600SemiBold', fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    titleLg: { fontFamily: 'Inter_500Medium', fontSize: 20, fontWeight: '500' as const, lineHeight: 28 },
    bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    labelMd: { fontFamily: 'Inter_600SemiBold', fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.6 },
    labelSm: { fontFamily: 'Inter_500Medium', fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radii: { sm: 4, DEFAULT: 8, md: 12, lg: 16, xl: 24, full: 9999 },
};

// Teacher Portal restyle — design tokens lifted directly from the Stitch
// "Teacher Management Portal" project ("Modern Educational Professional"
// design system, fetched 2026-07-24). Flat/no-glass, deliberately separate
// from `Theme` above so the Student/Parent portals (which draw from `Theme`
// and the shared components in components/PortalGrid.tsx, PortalSearch.tsx,
// Segmented.tsx, EmptyState.tsx, SubScreenHeader.tsx) are untouched. Teacher
// screens use these fixed brand colors instead of the per-school
// `branding.primaryColor` for their own chrome (header/buttons/accents) —
// the Stitch design fixes navy/blue regardless of school branding.
export const TeacherTheme = {
  colors: {
    background: '#f7f9fb',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f2f4f6',
    surfaceContainer: '#eceef0',
    surfaceContainerHigh: '#e6e8ea',
    surfaceContainerHighest: '#e0e3e5',
    onSurface: '#191c1e',
    onSurfaceVariant: '#44474d',
    outline: '#75777e',
    outlineVariant: '#c5c6ce',
    cardBorder: '#e2e8f0', // Elevation/Level 1 hairline border, more specific than outlineVariant
    primary: '#031632', // Deep Navy — headers, active nav, high-emphasis chrome
    onPrimary: '#ffffff',
    primaryContainer: '#1a2b48',
    secondary: '#0051d5', // Professional Blue — primary actions/focus
    onSecondary: '#ffffff',
    secondaryContainer: '#316bf3',
    onSecondaryContainer: '#fefcff',
    success: '#065f46', // Emerald text — Present/submitted/approved
    successContainer: '#ecfdf5',
    warning: '#b45309', // Amber text — Late/pending (Stitch spec names the semantic, not a hex; reusing the app's existing amber token)
    warningContainer: '#fef3c7',
    error: '#ba1a1a', // Rose — Absent/rejected/critical
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
  },
  typography: {
    displayLg: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.5 },
    headlineMd: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
    bodyBase: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
    labelCaps: { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, letterSpacing: 0.6 },
    statLg: { fontSize: 28, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.5 },
    meta: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  },
  // Radii are numerically identical to `Theme.radii` (sm4/DEFAULT8/md12/lg16/xl24/full9999) — reused as-is.
  radii: { sm: 4, DEFAULT: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  // Tighter spacing scale than `Theme.spacing` (md12/lg16/xl24 vs 16/24/32).
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, touchTarget: 48 },
  // Elevation & Depth: Level 1 (cards/lists) — hairline border + a very
  // subtle ambient shadow. box-shadow "4px blur, 2% opacity" has no direct
  // RN equivalent; translated to shadow*/elevation below.
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  // Level 2 (modals/overlays) — more pronounced shadow.
  shadowModal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
};

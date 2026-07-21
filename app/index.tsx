import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { useFeatureBootstrap } from '@/hooks/useFeatureBootstrap';
import { resolveLandingRoute } from '@/lib/navigation-rules';
import { styles } from '@/lib/styles';

// Auth-gated redirect: every actor route (parent/teacher/student/admin) lands
// here first (directly or via deep link) so role routing — and the
// MOBILE_APP channel gate — stays in one place instead of duplicated per
// screen. See lib/navigation-rules.ts for the actual decision logic.
export default function Index() {
  const { restoring, token, role, branding } = useAuth();
  const { features } = useFeatureBootstrap();

  if (restoring) {
    return (
      <View style={[styles.container, styles.loaderWrap]}>
        <ActivityIndicator size="large" color={branding.primaryColor} />
      </View>
    );
  }

  const mobileAppEnabled = features ? features.MOBILE_APP : null;
  const destination = resolveLandingRoute({ token, role, mobileAppEnabled });
  return <Redirect href={destination} />;
}

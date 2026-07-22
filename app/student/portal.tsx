import { Redirect } from 'expo-router';

// The grid this screen used to show is now the Student Portal's landing
// screen itself (app/student/index.tsx) — kept as a redirect rather than
// deleted outright in case anything still links to /student/portal.
export default function StudentPortalRedirect() {
  return <Redirect href="/student" />;
}

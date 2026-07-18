# SchoolSync Mobile — Principal Demo Runbook

Controlled, synthetic-data demo of the SchoolSync mobile app for a School
Principal. No real student/parent/staff data. No passwords in this document —
credentials are handed to the presenter out-of-band (password manager or a
verbal handoff), never committed to source control.

## Before the demo

1. **App installation check** — confirm the preview APK from the current EAS
   build is installed on the demo phone, cold-launches without Metro, and
   shows "SchoolSync" as the app name.
2. **API health check** — hit the configured `EXPO_PUBLIC_API_URL` for the
   build (`docs/mobile-environments.md`) and confirm `/api/mobile/login`,
   `/api/mobile/staff/login`, `/api/mobile/me`, `/api/mobile/features`, and
   `/api/mobile/branding` all respond (401/405 on unauthenticated/GET probes
   is expected and fine — a 404 or connection failure is not).
3. **Account readiness — ACTION REQUIRED.** This runbook assumes four demo
   accounts exist on the backend the build points at:
   - a Teacher account
   - a Teacher account with effective Operations Head authority
   - a Parent account linked to at least two children
   - a Student account

   `schoolsync/scripts/seed-pilot.ts` generates realistic synthetic data of
   this shape, but it is **safety-guarded to refuse running against any
   managed/production-looking database** (see
   `src/lib/pilot-seed-guard.ts`) — it has never been run against the Neon
   database backing the live deployment. Confirm whether these four accounts
   already exist on that deployment before the demo; if not, they must be
   created deliberately (e.g. through the admin dashboard) with the school
   owner's authorization, not by pointing the pilot seed script at production.
   Treat this as a blocker until confirmed.
4. **Demo reset** — for any data mutated during rehearsal (attendance marks,
   homework submissions, leave approvals, report-card publishes), either
   restore from a pre-demo snapshot or accept the mutation as part of the
   synthetic dataset. Do not reset by deleting rows directly in production.

## Teacher flow (~4 min)

1. Log in as the demo Teacher.
2. Show Home → today's timetable.
3. Mark self-attendance.
4. Open Homework → create one homework item.
5. Attach a file via the Android file picker, submit.
6. Open Submissions → score one submission.
7. Open Report Cards → generate → show live job progress → publish.
8. Download the published PDF → show the Android share sheet.

## Operations flow (~3 min, same or a second Teacher account)

1. Log in as the effective Operations Head.
2. Show the Operations entry point (absent for a normal Teacher — mention this
   contrast).
3. Today / Needs Attention view.
4. Uncovered Lectures → show a replacement recommendation → create an
   arrangement.
5. Teacher Status → one status mutation (not on self — show that self-mutation
   is disabled).

## Parent flow (~3 min)

1. Log out, log in as the demo Parent.
2. Switch between the two children — call out that data refreshes cleanly,
   no stale flash.
3. Homework → submit via file picker for one child.
4. Attendance and fee ledger (manual ledger only — explicitly note there is no
   "Pay Now" / payment gateway in this build).
5. Report Cards → download PDF → share sheet.

## Student flow (~2 min)

1. Log out, log in as the demo Student.
2. Homework (read-only — no submission control).
3. Attendance / Results / Report Cards → PDF download.
4. Timetable.

**Expected total duration:** ~12–15 minutes including transitions.

## Fallback

Record a short screen capture (or take screenshots) of each flow above during
rehearsal. If a live network/API issue occurs during the actual demo, fall
back to the recording rather than debugging live in front of the Principal.

## After the demo

- Log out of all demo accounts on the device.
- Note any FAIL/BLOCKED items observed against
  `docs/mobile-real-device-demo-test.md` for follow-up.

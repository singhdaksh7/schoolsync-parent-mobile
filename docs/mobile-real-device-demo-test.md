# SchoolSync Mobile — Real Android Device Test Script

Strict physical-device QA script for the SchoolSync Android preview build. Run on
an actual Android phone, never in a simulator/emulator or Expo Go, with the
preview APK installed independently of Metro/`expo start`.

**Accounts:** use dedicated demo/staging synthetic accounts only. Do not use
real student, parent, or staff data. Passwords are never written into this
document or any committed file — obtain them out-of-band (a password manager
entry or a message from whoever provisioned the demo accounts).

**Backend under test:** the API base URL baked into the build (see
`docs/mobile-environments.md`). Confirm the build's target environment before
starting — a preview build must not be pointed at production customer data.

Mark every row exactly one of: `PASS` / `FAIL` / `BLOCKED` / `NOT ATTEMPTED`.

## Install

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | APK downloads from the EAS build/install link | | |
| 2 | APK installs ("install from this source" prompt handled) | | |
| 3 | Home screen icon and label read "SchoolSync" | | |
| 4 | Cold launch from icon | | |
| 5 | No immediate crash on first launch | | |
| 6 | App runs with Metro/dev server fully closed (airplane-mode-safe UI shell) | | |

## Teacher

| # | Check | Result | Notes |
|---|---|---|---|
| 7 | Teacher login succeeds | | |
| 8 | Lands on Teacher home route | | |
| 9 | School branding (logo/name) loads | | |
| 10 | Home dashboard renders | | |
| 11 | Live timetable loads | | |
| 12 | Pull-to-refresh on a Teacher screen | | |
| 13 | Self attendance mark/view | | |
| 14 | Student attendance roster loads | | |
| 15 | Large roster scrolls smoothly | | |
| 16 | Attendance edit works | | |
| 17 | One attendance submission completes | | |
| 18 | Homework list loads | | |
| 19 | Create homework | | |
| 20 | Android DocumentPicker (system file/SAF chooser) opens | | |
| 21 | Select a PDF or image | | |
| 22 | Managed upload completes (progress → success) | | |
| 23 | Attachment displays after upload | | |
| 24 | Homework submissions list loads | | |
| 25 | Score a submission | | |
| 26 | Batch scoring works | | |
| 27 | Marks: exam picker works | | |
| 28 | Marks: validation blocks an invalid entry | | |
| 29 | Notebook checking works | | |
| 30 | Report-card list loads | | |
| 31 | Generate a report card | | |
| 32 | Job status shows live progress (not stuck) | | |
| 33 | Publish a report card | | |
| 34 | Authenticated PDF download completes | | |
| 35 | Android share/open sheet appears for the PDF | | |
| 36 | Temporary PDF file is gone after share/close (check via Files app or re-download) | | |
| 37 | Full leave request submits | | |
| 38 | Arrangements screen loads | | |

## Teacher Operations

| # | Check | Result | Notes |
|---|---|---|---|
| 39 | A normal Teacher (no Operations authority) has no Operations entry point | | |
| 40 | An effective Operations Head sees the Operations entry point | | |
| 41 | Today view loads | | |
| 42 | Needs Attention loads | | |
| 43 | Current Period loads | | |
| 44 | Next Period loads | | |
| 45 | Teacher Status list loads | | |
| 46 | A status mutation succeeds | | |
| 47 | Self-mutation is disabled (cannot change own status) | | |
| 48 | Leave Management list loads | | |
| 49 | Approve/reject a leave request | | |
| 50 | Own leave controls are disabled in Operations view | | |
| 51 | Uncovered Lectures loads | | |
| 52 | Replacement recommendations appear | | |
| 53 | Create an arrangement | | |
| 54 | Workload view loads | | |
| 55 | Activity view loads | | |
| 56 | Pull-to-refresh on an Operations screen | | |
| 57 | Simulated authority loss on a 403 does not log the user out | | |

## Session

| # | Check | Result | Notes |
|---|---|---|---|
| 58 | Force-close the app (task switcher, not just background) | | |
| 59 | Reopen the app | | |
| 60 | No credential re-login is required | | |
| 61 | Session is restored automatically | | |
| 62 | The previously active actor's route is restored (not dropped to login) | | |

## Parent

| # | Check | Result | Notes |
|---|---|---|---|
| 63 | Logout from prior actor | | |
| 64 | Parent login succeeds | | |
| 65 | Branding loads | | |
| 66 | Switch between children | | |
| 67 | No stale prior-child data flashes during the switch | | |
| 68 | Homework list loads for selected child | | |
| 69 | Android DocumentPicker opens for homework submission | | |
| 70 | Managed homework submission upload completes | | |
| 71 | Attendance loads for selected child | | |
| 72 | Fee ledger loads (manual/read-only) | | |
| 73 | No "Pay Now" control is present | | |
| 74 | No Razorpay/payment SDK surface is present | | |
| 75 | Report cards list loads | | |
| 76 | Report-card PDF downloads | | |
| 77 | Android share/open sheet appears for the PDF | | |

## Student

| # | Check | Result | Notes |
|---|---|---|---|
| 78 | Logout from prior actor | | |
| 79 | Student login succeeds | | |
| 80 | Homework list loads (read-only) | | |
| 81 | No submission action is offered to the Student | | |
| 82 | Attendance view loads | | |
| 83 | Results view loads | | |
| 84 | Report cards list loads | | |
| 85 | Report-card PDF downloads and opens | | |
| 86 | Timetable loads | | |
| 87 | Notebook view loads where enabled | | |
| 88 | Leave request/status view loads | | |
| 89 | No other student's private data is visible (profile privacy) | | |

## Cross-Actor

| # | Check | Result | Notes |
|---|---|---|---|
| 90 | Logout | | |
| 91 | After a fresh Student login, no Parent child data is visible | | |
| 92 | After a fresh Teacher login, no Student data is visible | | |
| 93 | After a fresh Parent login, no Teacher Operations authority is visible | | |
| 94 | No reference to a previously downloaded private PDF remains reachable | | |
| 95 | No navigation loop between login and role-home routes | | |
| 96 | No blank/white screen at any transition above | | |

## Native UX

| # | Check | Result | Notes |
|---|---|---|---|
| 97 | On-screen keyboard never permanently blocks a submit button | | |
| 98 | Hardware/gesture back navigation works throughout | | |
| 99 | Long lists (roster, homework, activity) stay scrollable and responsive | | |
| 100 | After DocumentPicker, the app returns to the correct screen | | |
| 101 | After the share sheet closes, the app returns to the foreground correctly | | |
| 102 | Turning on airplane mode mid-request shows a network error, not a crash | | |
| 103 | A simulated 403 never triggers a logout | | |
| 104 | A simulated 401 returns to login exactly once (no repeated prompts) | | |
| 105 | App remains stable through ~10 minutes of continuous navigation | | |

## Summary

PASS: __  FAIL: __  BLOCKED: __  NOT ATTEMPTED: __

Tester:
Device model / Android version:
Date:
Build ID / version code tested:

// Shared DTO types for the SchoolSync mobile app. These mirror the frozen
// schoolsync backend's mobile-facing JSON responses (see schoolsync/src/app/api/{mobile,parent,teacher,student}/**)
// — not the backend's internal Prisma/engine types.

export type AppRole = 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'VICE_PRINCIPAL' | 'TEACHER' | 'PARENT' | 'GUARDIAN' | 'STUDENT';
// STAFF -> POST /api/mobile/staff/login (email). PARENT_STUDENT -> POST
// /api/mobile/login (single identifier field; backend resolves the actor —
// the app must not ask which one the user is, see unified-mobile-login.ts).
export type LoginMode = 'STAFF' | 'PARENT_STUDENT';

export type AppUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  role: AppRole | string;
  schoolId?: string;
  schoolSlug?: string;
};

export type StudentUser = {
  id: string;
  name: string;
  rollNo: string;
  admissionNo?: string | null;
  email?: string | null;
  schoolId?: string;
  sectionId?: string;
  // Class/section are not returned by /api/mobile/me today; kept optional so the
  // header renders them automatically if the backend starts including them.
  section?: { name?: string; class?: { name?: string } } | null;
};

// POST /api/mobile/login (unified parent/student) — see
// schoolsync/src/lib/unified-mobile-login.ts. `branding` here is a partial
// subset (no schoolName/poweredBySchoolSync) scoped to the actor's actual
// school; prefer it over GET /api/branding, which resolves by request
// hostname and cannot identify the school for a mobile client hitting a
// shared (non-per-school-subdomain) API base URL.
export type UnifiedLoginSchool = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  appName: string | null;
};

export type UnifiedLoginBranding = {
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  appName: string | null;
};

export type UnifiedLoginResponse =
  | {
      actorType: 'PARENT';
      token: string;
      guardian: { id: string; name: string; phone: string; email: string | null };
      school: UnifiedLoginSchool;
      branding: UnifiedLoginBranding;
    }
  | {
      actorType: 'STUDENT';
      token: string;
      student: StudentUser;
      school: UnifiedLoginSchool;
      branding: UnifiedLoginBranding;
    };

// GET /api/mobile/features — mirrors schoolsync's FEATURE_FLAG_KEYS
// (src/lib/feature-flag-constants.ts) exactly. A `true` value means the
// module is enabled for the school — it is NOT an authorization grant.
export type FeatureFlagKey =
  | 'ATTENDANCE'
  | 'HOMEWORK'
  | 'FEES'
  | 'REPORT_CARDS'
  | 'REPORT_CARD_BUILDER'
  | 'MOBILE_APP'
  | 'PARENT_PORTAL'
  | 'STUDENT_PORTAL'
  | 'NOTIFICATIONS'
  | 'ANALYTICS'
  | 'WHITE_LABEL'
  | 'TEACHER_PERMISSIONS'
  | 'AI_FEATURES'
  | 'NOTEBOOK_CHECKING';

export type FeaturesResponse = { features: Record<FeatureFlagKey, boolean> };

// GET /api/teacher/permissions — custom teacher-RBAC introspection, gated by
// the TEACHER_PERMISSIONS feature flag (403, no body fields beyond error, when
// off). Not authoritative for authorization (the backend re-checks on every
// mutating route) — mobile only uses this for nav hints/action affordances.
export type PermissionPair = { module: string; action: string; allowed: boolean };
export type TeacherScope = { classIds: string[]; sectionIds: string[]; unrestricted: boolean };
export type TeacherPermissionsResponse = {
  permissions: PermissionPair[];
  scope: TeacherScope;
  hasCustomRole: boolean;
};

// GET /api/teacher/timetable — the ONLY bearer-JWT-reachable teacher
// timetable/schedule source (schoolsync/src/lib/homework.ts
// getTeacherAssignments + raw TimetableSlot rows). Deliberately NOT the same
// shape as the parent/student TimetableItem type above — this route returns
// flat sectionName/className strings, no id/teacher/time fields.
export type TeacherTimetableSlot = {
  dayOfWeek: number;
  period: number;
  subject: string | null;
  sectionName: string;
  className: string;
};

export type TeacherAssignment = {
  sectionId: string;
  sectionName: string;
  className: string;
  subject: string;
  students: { id: string; name: string; rollNo: string }[];
};

export type TeacherTimetableResponse = {
  teachingSections: TeacherAssignment[];
  slots: TeacherTimetableSlot[];
  timetable: TeacherTimetableSlot[];
  periodsPerDay: number;
};

// GET/POST /api/teacher/homework — list/create only (no bearer route exists
// for edit/submissions/scoring; see Phase 6C report Mobile Integration
// Blockers). Shape mirrors schoolsync's homeworkIncludeForList().
export type TeacherHomeworkStudentStatus = {
  id: string;
  status: string;
  submissionStatus: string;
  score: number | null;
  maxScore: number | null;
  teacherRemark: string | null;
  student: { id: string; name: string; rollNo: string; sectionId: string };
};

export type TeacherHomeworkItem = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  dueDate: string;
  deadlineAt: string;
  attachmentUrl: string | null;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  section: { id: string; name: string; class: { id: string; name: string } };
  teacher: { id: string; name: string; subject: string | null };
  studentStatuses: TeacherHomeworkStudentStatus[];
};

export type TeacherHomeworkListResponse = {
  assignments: TeacherAssignment[];
  homework: TeacherHomeworkItem[];
};

export type SchoolInfo = {
  id?: string;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
};

export type MobileMeResponse = {
  role: string;
  user?: AppUser;
  student?: StudentUser;
  school?: SchoolInfo;
};

export type Branding = {
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  poweredBySchoolSync: boolean;
};

export type Child = {
  id: string;
  name: string;
  rollNo: string;
  section?: { name?: string; class?: { name?: string } };
};

export type AttendanceItem = {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  type: string;
};

export type MarkItem = {
  id: string;
  marks: number;
  grade?: string | null;
  exam: { name: string; maxMarks: number; scheme?: { name: string } };
};

export type StudentAttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
};

export type ReportCardItem = {
  id: string;
  status: 'PUBLISHED';
  totalMarks: number;
  percentage: number;
  grade: string;
  publishedAt: string | null;
  student: { name: string; rollNo: string };
  examScheme: { name: string };
};

export type TimetableItem = {
  id: string;
  dayOfWeek: number;
  period: number;
  subject?: string;
  teacher?: { name?: string };
  section?: { name?: string; class?: { name?: string } };
  startTime?: string | null;
  endTime?: string | null;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  createdBy?: { name?: string; role?: string };
};

export type HomeworkItem = {
  id: string;
  homeworkId: string;
  studentId: string;
  title: string;
  subject: string;
  dueDate: string;
  deadlineAt: string;
  homeworkStatus: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  submissionStatus: 'PENDING' | 'SUBMITTED' | 'LATE_SUBMITTED' | 'NOT_SUBMITTED' | 'CHECKED' | 'REJECTED';
  submissionMethod: 'NONE' | 'ONLINE' | 'PHYSICAL';
  checkedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  teacherRemark: string | null;
  submission?: {
    id: string;
    attachmentUrl: string;
    fileName: string | null;
    fileType: string | null;
    submittedAt: string;
    status: 'SUBMITTED' | 'LATE' | 'REVIEWED' | 'REJECTED';
    submissionStatus: HomeworkItem['submissionStatus'];
    submissionMethod: HomeworkItem['submissionMethod'];
    checkedAt: string | null;
  } | null;
  teacher?: { name?: string };
};

export type PendingFeeItem = {
  student: {
    id: string;
    name: string;
    rollNo: string;
    section?: { name?: string; class?: { name?: string } };
  };
  feeStructure: {
    id: string;
    name: string;
    amount: number;
    frequency: string;
  };
};

export type TeacherTodayAttendance = {
  status?: 'PRESENT' | 'ABSENT' | 'LATE' | null;
  attendance?: { status?: 'PRESENT' | 'ABSENT' | 'LATE' } | null;
  canMarkPresent?: boolean;
  cutoffPassed?: boolean;
};

export type TeacherArrangement = {
  id: string;
  date?: string;
  period?: number;
  subject?: string | null;
  section?: { name?: string; class?: { name?: string } };
  absentTeacher?: { name?: string } | null;
  reason?: string | null;
};

export type TeacherEarlyLeave = {
  id: string;
  date: string;
  leaveAfterPeriod: number;
  reason: string;
  status: string;
};

// GET /api/teacher/operational-roles/self-status (JWT-reachable; the full
// admin Operations Command Center is session-cookie-only and out of mobile's
// reach per Phase 6 scope — see PHASE6 audit).
export type TeacherOperationsSelfStatus = {
  roleType: 'TEACHER_OPERATIONS';
  isEffectiveOperationsHead: boolean;
  delegated: boolean;
  reasonCode: string | null;
};

// ── Teacher Operations Command Center (mobile, bearer-Teacher-effective-head
// only) — GET/PATCH /api/schools/[schoolId]/operations/* + leaves, mirroring
// schoolsync's src/lib/operations-*.ts engine output shapes exactly. Every
// route here is reached ONLY via guardOperationsCapability's bearer path
// (schoolsync src/lib/operations-route-guard.ts) — a Teacher who is not
// currently the effective Operations Head gets 403 from the backend itself,
// never a client-side guess.

export type OperationsTeacherStatusSummary = {
  totalActiveTeachers: number;
  present: number;
  absent: number;
  onLeave: number;
  notMarked: number;
  currentlyInClass: number;
  currentlyFree: number;
};

export type OperationsCoverageTotals = {
  scheduled: number;
  normal: number;
  substituted: number;
  uncovered: number;
  coveragePercentage: number | null;
};

export type OperationsStudentAttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  attendancePercentage: number | null;
};

export type OperationsCurrentPeriod = {
  status: string;
  periodNumber: number | null;
  label: string | null;
  runningClasses: number;
  normal: number;
  substituted: number;
  uncovered: number;
  teachersInClass: number;
  teachersFree: number;
  teachersUnavailable: number;
  uncoveredDetails: OperationsUncoveredLectureDetail[];
};

export type OperationsRiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type OperationsNextPeriodRisk = {
  hasNextPeriod: boolean;
  periodNumber: number | null;
  label: string | null;
  startTime: string | null;
  startsInMinutes: number | null;
  scheduled: number;
  unavailableTeacherLectures: number;
  covered: number;
  uncovered: number;
  riskLevel: OperationsRiskLevel;
  uncoveredDetails: OperationsUncoveredLectureDetail[];
};

export type OperationsTodaySummary = {
  dateKey: string;
  timeOfDay: string;
  periodState: string;
  teacherSummary: OperationsTeacherStatusSummary;
  studentAttendance: OperationsStudentAttendanceSummary;
  coverage: OperationsCoverageTotals;
  currentPeriod: OperationsCurrentPeriod;
  nextPeriodRisk: OperationsNextPeriodRisk;
};

export type OperationsAttentionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type OperationsAttentionItem = {
  code: string;
  severity: OperationsAttentionSeverity;
  title: string;
  description: string;
  count: number;
  actionTarget: string | null;
  metadata: Record<string, unknown>;
};

export type OperationsHealthStatus = 'HEALTHY' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';

export type OperationsHealth = {
  status: OperationsHealthStatus;
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
};

export type OperationsAttentionResponse = { attention: OperationsAttentionItem[]; health: OperationsHealth };

export type OperationsBaseAttendanceStatus = 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'NOT_MARKED';
export type OperationsOperationalStatus = 'IN_CLASS' | 'FREE' | 'UNAVAILABLE' | 'NOT_MARKED';

export type OperationsAssignmentSummary = {
  sectionId: string;
  className: string;
  sectionName: string;
  subject: string | null;
  period: number;
};

export type OperationsTeacherTodayStatus = {
  teacherId: string;
  teacherName: string;
  baseStatus: OperationsBaseAttendanceStatus;
  operationalStatus: OperationsOperationalStatus;
  todayScheduledPeriods: number;
  todayCoveredPeriods: number;
  todayFreePeriods: number;
  currentAssignment: OperationsAssignmentSummary | null;
  nextAssignment: OperationsAssignmentSummary | null;
  onApprovedLeave: boolean;
  substitutingToday: OperationsAssignmentSummary[];
  warnings: string[];
};

export type OperationsPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type OperationsTeacherStatusResponse = {
  summary: OperationsTeacherStatusSummary;
  data: OperationsTeacherTodayStatus[];
  pagination: OperationsPaginationMeta;
};

export type OperationsTeacherStatusUpdateResult = {
  teacherId: string;
  ok: boolean;
  reason?: 'FOREIGN_TEACHER' | 'ON_APPROVED_LEAVE' | 'SELF_TEACHER_STATUS_MUTATION_FORBIDDEN';
};

export type OperationsTeacherStatusUpdateResponse = { results: OperationsTeacherStatusUpdateResult[] };

export type OperationsUncoveredLectureDetail = {
  period: number;
  className: string;
  sectionName: string;
  subject: string | null;
  originalTeacherId: string | null;
  originalTeacherName: string | null;
  unavailabilityReason: 'ABSENT' | 'ON_LEAVE' | null;
  topRecommendations: { teacherId: string; teacherName: string }[];
};

export type OperationsLectureClassification = {
  sectionId: string;
  sectionName: string;
  className: string;
  period: number;
  subject: string | null;
  originalTeacherId: string | null;
  effectiveTeacherId: string | null;
  status: 'NORMAL' | 'SUBSTITUTED' | 'UNCOVERED';
  unavailabilityReason: 'ABSENT' | 'ON_LEAVE' | null;
};

export type OperationsLectureCoverageResponse = {
  totals: OperationsCoverageTotals;
  lectures: OperationsLectureClassification[];
  uncoveredDetails: OperationsUncoveredLectureDetail[];
};

export type OperationsWorkloadClassification = 'OVERLOADED' | 'NORMAL' | 'LIGHT_LOAD' | 'NO_LECTURE';

export type OperationsTeacherWorkloadToday = {
  teacherId: string;
  teacherName: string;
  scheduledPeriods: number;
  substitutionPeriods: number;
  effectivePeriods: number;
  freePeriods: number;
  longestConsecutiveRun: number;
  maxDailyTeachingPeriods: number;
  maxConsecutiveTeachingPeriods: number;
  classification: OperationsWorkloadClassification;
  warnings: string[];
};

export type OperationsTeacherWorkloadSummary = {
  overloaded: number;
  normal: number;
  lightLoad: number;
  noLecture: number;
};

export type OperationsTeacherWorkloadResponse = {
  summary: OperationsTeacherWorkloadSummary;
  rows: OperationsTeacherWorkloadToday[];
};

export type OperationsActivityItem = {
  id: string;
  code: string;
  entityType: string;
  entityId: string | null;
  actorName: string | null;
  actorRole: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type OperationsActivityResponse = { data: OperationsActivityItem[]; pagination: OperationsPaginationMeta };

// GET/PATCH /api/schools/[schoolId]/leaves(/[leaveId]) — Operations Leave
// Management scope is TEACHER-type leave requests only (student leave is a
// separate, non-Operations concern). PATCH reuses the same
// SELF_LEAVE_APPROVAL_FORBIDDEN server-side check regardless of transport.
export type OperationsTeacherLeaveRequest = {
  id: string;
  type: 'TEACHER';
  reason: string;
  fromDate: string;
  toDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacherId: string;
  createdAt: string;
  teacher: { name: string; subject: string | null } | null;
  reviewedBy: { name: string } | null;
};

export type OperationsTeacherLeaveListResponse = { data: OperationsTeacherLeaveRequest[]; pagination: OperationsPaginationMeta };

// GET /api/teacher/me — raw Teacher row + school + mentorSection roster.
// Bearer-reachable since Task 6 (getTeacherAuth), not previously consumed by
// mobile. Used here as the source of the mentor-section student roster for
// student attendance marking (the attendance routes themselves only return
// existing Attendance rows, never the class roster).
export type TeacherProfile = {
  id: string;
  userId: string;
  schoolId: string;
  mentorSectionId: string | null;
  school: { id: string; name: string; slug: string };
  mentorSection: {
    id: string;
    name: string;
    class: { id: string; name: string };
    students: { id: string; name: string; rollNo: string }[];
  } | null;
};

// GET/POST /api/teacher/attendance — class/section STUDENT attendance (not
// self-attendance, see TeacherTodayAttendance). GET returns a bare array of
// existing Attendance rows for the requested date; the roster itself comes
// from TeacherProfile.mentorSection.students, cross-referenced client-side.
export type StudentAttendanceRecord = {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  studentId: string;
  sectionId: string;
  schoolId: string;
  type: 'STUDENT';
};

export type StudentAttendanceSubmitInput = {
  date: string;
  records: { id: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }[];
};

export type StudentAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export type StudentRosterRow = {
  studentId: string;
  name: string;
  rollNo: string;
  status: StudentAttendanceStatus | null;
};

// GET /api/teacher/homework/[id]/submissions
export type TeacherSubmission = {
  id: string;
  homeworkId: string;
  studentId: string;
  attachmentUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  submittedAt: string;
  status: 'SUBMITTED' | 'LATE' | 'REVIEWED' | 'REJECTED';
  submissionStatus: string;
  submissionMethod: 'NONE' | 'ONLINE' | 'PHYSICAL';
  score: number | null;
  maxScore: number | null;
  teacherRemark: string | null;
  reviewedAt: string | null;
  checkedAt: string | null;
  student: { id: string; name: string; rollNo: string; sectionId: string };
  guardian: { id: string; name: string; phone: string } | null;
};

export type TeacherSubmissionsResponse = {
  homework: TeacherHomeworkItem;
  submissions: TeacherSubmission[];
};

export type ScoreSubmissionInput = {
  status: 'REVIEWED' | 'REJECTED';
  score?: number | null;
  maxScore?: number | null;
  teacherRemark?: string | null;
};

export type BatchScoreEntry = {
  studentId: string;
  status: 'SUBMITTED' | 'NOT_SUBMITTED' | 'LATE' | 'CHECKED' | 'REJECTED';
  score?: number | null;
  maxScore?: number | null;
  submittedAt?: string | null;
  teacherRemark?: string | null;
  submissionMethod?: 'ONLINE' | 'PHYSICAL';
  parentVisible?: boolean;
};

export type CompletionEntry = { studentId: string; completed: boolean };

// GET /api/teacher/homework/class-dashboard
export type HomeworkDashboardStudent = {
  studentId: string;
  name: string;
  rollNo: string;
  completionPercentage: number | null;
};

export type HomeworkDashboardResponse = {
  students: HomeworkDashboardStudent[];
  history: {
    id: string;
    homeworkId: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    subject: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }[];
  summary: {
    totalHomeworkAssigned: number;
    averagePercentage: number | null;
    above90Count: number;
    below70Count: number;
    mostConsistent: { studentId: string; name: string; percentage: number | null }[];
    needsAttention: { studentId: string; name: string; percentage: number | null }[];
  };
};

// GET/POST /api/teacher/results — marks. examId/sectionId are always
// mandatory query/body params, never inferred (see unified-mobile-login-style
// "explicit context" rule applied to marks).
export type ExamResultRow = { studentId: string; marks: number };

export type SubmitMarksInput = {
  examId: string;
  sectionId: string;
  results: { studentId: string; marks: number }[];
};

// GET /api/teacher/exam-milestones — supporting context for Notebook
// Checking (this backend route is NOTEBOOK_CHECKING-gated, not a general
// exam-context source for Marks, which has no dedicated "list of exams"
// mobile route — see Mobile Integration Blockers in the completion report).
export type ExamMilestoneItem = { id: string; name: string; active: boolean };

// GET /api/teacher/exams — school-wide Exam list for the Marks entry picker
// (schoolsync src/app/api/teacher/exams/route.ts). Never marks any exam as
// current/active/default/selected — the teacher always taps one explicitly.
export type TeacherExamItem = { id: string; name: string; maxMarks: number; examSchemeId: string; examSchemeName: string };
export type TeacherExamListResponse = { exams: TeacherExamItem[] };

// GET/PATCH /api/teacher/notebook
export type NotebookRosterEntry = {
  studentId: string;
  name: string;
  rollNo: string;
  checked: boolean;
  checkedAt: string | null;
  remarks: string | null;
};

export type NotebookCheckInput = { studentId: string; checked: boolean; remarks?: string | null };

// GET/POST /api/teacher/report-cards*
export type TeacherReportCard = {
  id: string;
  status: 'DRAFT' | 'PUBLISHED';
  totalMarks: number;
  percentage: number;
  grade: string;
  publishedAt: string | null;
  student: { id: string; name: string; rollNo: string };
  examScheme: { id: string; name: string };
};

export type TeacherReportCardListResponse = {
  mentorSection: { id: string; name: string; class: { id: string; name: string } } | null;
  schemes: { id: string; name: string }[];
  reportCards: TeacherReportCard[];
};

export type ReportCardGenerateSyncResponse = { success: true; count: number; reportCards: TeacherReportCard[] };
export type ReportCardGenerateJobResponse = { mode: 'job'; jobId: string; status: string; totalItems: number; deduplicated: boolean };
export type ReportCardGenerateResponse = ReportCardGenerateSyncResponse | ReportCardGenerateJobResponse;

export function isJobResponse(res: ReportCardGenerateResponse): res is ReportCardGenerateJobResponse {
  return (res as ReportCardGenerateJobResponse).mode === 'job';
}

// GET /api/teacher/jobs/[jobId] — Teacher-scoped, REPORT_CARD_BATCH_GENERATION
// only, ownership-checked against payload.teacherId (schoolsync
// src/app/api/teacher/jobs/[jobId]/route.ts). Never includes claimToken,
// raw payload, or payloadFingerprint.
export type JobStatusValue = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type JobStatusResponse = {
  id?: string;
  type?: string;
  status: JobStatusValue;
  progress?: number;
  totalItems: number;
  processedItems?: number;
  failedItems?: number;
  resultMetadata?: unknown;
  errorSummary?: string | null;
};

export const DEFAULT_BRANDING: Branding = {
  schoolName: 'SchoolSync',
  logoUrl: null,
  primaryColor: '#1976D2',
  secondaryColor: '#0f172a',
  appName: 'SchoolSync',
  poweredBySchoolSync: false,
};

export const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

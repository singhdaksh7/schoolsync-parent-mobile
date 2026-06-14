import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ParentUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  schoolId?: string;
  schoolSlug?: string;
};

type LoginResponse = {
  token: string;
  user: ParentUser;
};

type Child = {
  id: string;
  name: string;
  rollNo: string;
  section?: {
    name?: string;
    class?: {
      name?: string;
    };
  };
};

type AttendanceItem = {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  type: string;
};

type MarkItem = {
  id: string;
  marks: number;
  exam: {
    name: string;
    maxMarks: number;
    scheme?: {
      name: string;
    };
  };
};

type ReportCardItem = {
  id: string;
  status: 'PUBLISHED';
  totalMarks: number;
  percentage: number;
  grade: string;
  publishedAt: string | null;
  student: {
    name: string;
    rollNo: string;
  };
  examScheme: {
    name: string;
  };
};

type TimetableItem = {
  id: string;
  dayOfWeek: number;
  period: number;
  subject?: string;
  teacher?: {
    name?: string;
  };
};

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  createdBy?: {
    name?: string;
    role?: string;
  };
};

type HomeworkItem = {
  id: string;
  homeworkId: string;
  studentId: string;
  title: string;
  subject: string;
  dueDate: string;
  deadlineAt: string;
  homeworkStatus: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  submissionStatus:
    | 'PENDING'
    | 'SUBMITTED'
    | 'LATE_SUBMITTED'
    | 'NOT_SUBMITTED'
    | 'CHECKED'
    | 'REJECTED';
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
  teacher?: {
    name?: string;
  };
};

type PendingFeeItem = {
  student: {
    id: string;
    name: string;
    rollNo: string;
    section?: {
      name?: string;
      class?: {
        name?: string;
      };
    };
  };
  feeStructure: {
    id: string;
    name: string;
    amount: number;
    frequency: string;
  };
};

const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
const API_CONFIG_ERROR = API_BASE_URL
  ? null
  : 'Backend API URL is not configured. Set EXPO_PUBLIC_API_URL before running the app.';

function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error(API_CONFIG_ERROR || 'Backend API URL is not configured.');
  }
  return API_BASE_URL;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ensureApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload as T;
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleDateString();
}

function formatDateTime(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? isoDate : date.toLocaleString();
}

export default function App() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ParentUser | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [marks, setMarks] = useState<MarkItem[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [pendingFees, setPendingFees] = useState<PendingFeeItem[]>([]);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attendanceSummary = useMemo(() => {
    return attendance.reduce(
      (acc, item) => {
        if (item.status === 'PRESENT') acc.present += 1;
        if (item.status === 'ABSENT') acc.absent += 1;
        if (item.status === 'LATE') acc.late += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );
  }, [attendance]);

  async function loadStudentData(authToken: string, studentId: string) {
    const query = `?studentId=${encodeURIComponent(studentId)}`;
    const [attendanceRes, marksRes, reportCardsRes, timetableRes, homeworkRes] = await Promise.all([
      apiRequest<{ attendance: AttendanceItem[] }>(
        `/api/parent/attendance${query}`,
        {},
        authToken
      ),
      apiRequest<{ marks: MarkItem[] }>(`/api/parent/marks${query}`, {}, authToken),
      apiRequest<{ reportCards: ReportCardItem[] }>(
        `/api/parent/report-cards${query}`,
        {},
        authToken
      ),
      apiRequest<{ timetable: TimetableItem[] }>(
        `/api/parent/timetable${query}`,
        {},
        authToken
      ),
      apiRequest<{ homework: HomeworkItem[] }>(
        `/api/parent/homework${query}`,
        {},
        authToken
      ),
    ]);

    setAttendance(attendanceRes.attendance || []);
    setMarks(marksRes.marks || []);
    setReportCards(reportCardsRes.reportCards || []);
    setTimetable(timetableRes.timetable || []);
    setHomework(homeworkRes.homework || []);
  }

  async function loadDashboard(authToken: string, preferredStudentId?: string | null) {
    setLoadingData(true);
    setError(null);
    try {
      const [childrenRes, announcementsRes, feesRes] = await Promise.all([
        apiRequest<{ children: Child[] }>('/api/parent/children', {}, authToken),
        apiRequest<{ announcements: AnnouncementItem[] }>(
          '/api/parent/announcements',
          {},
          authToken
        ),
        apiRequest<{ pendingFees: PendingFeeItem[] }>('/api/parent/fees', {}, authToken),
      ]);

      const nextChildren = childrenRes.children || [];
      const defaultStudentId =
        preferredStudentId && nextChildren.some((child) => child.id === preferredStudentId)
          ? preferredStudentId
          : (nextChildren[0]?.id ?? null);

      setChildren(nextChildren);
      setAnnouncements(announcementsRes.announcements || []);
      setPendingFees(feesRes.pendingFees || []);
      setSelectedStudentId(defaultStudentId);

      if (defaultStudentId) {
        await loadStudentData(authToken, defaultStudentId);
      } else {
        setAttendance([]);
        setMarks([]);
        setReportCards([]);
        setTimetable([]);
        setHomework([]);
      }
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      setError('Please enter phone and password.');
      return;
    }

    setLoadingLogin(true);
    setError(null);
    try {
      const loginRes = await apiRequest<LoginResponse>('/api/parent/login', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      setToken(loginRes.token);
      setUser(loginRes.user);
      await loadDashboard(loginRes.token, null);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setLoadingLogin(false);
    }
  }

  async function handleChildChange(studentId: string) {
    if (!token) return;
    setSelectedStudentId(studentId);
    setLoadingData(true);
    setError(null);
    try {
      await loadStudentData(token, studentId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load student data.');
    } finally {
      setLoadingData(false);
    }
  }

  async function handleRefresh() {
    if (!token) return;
    setRefreshing(true);
    await loadDashboard(token, selectedStudentId);
  }

  async function handleCreateFeeOrder(fee: PendingFeeItem) {
    if (!token) return;
    setError(null);
    try {
      await apiRequest(
        '/api/parent/fees/create-order',
        {
          method: 'POST',
          body: JSON.stringify({
            studentId: fee.student.id,
            feeStructureId: fee.feeStructure.id,
          }),
        },
        token
      );
      setError('Payment order created. Razorpay checkout needs the native mobile package to complete payment.');
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : 'Failed to create payment order.');
    }
  }

  async function handleSubmitHomework(item: HomeworkItem) {
    if (!token) return;
    const attachmentUrl = (submissionUrls[item.id] || '').trim();
    if (!attachmentUrl) {
      setError('Enter an attachment URL before submitting homework.');
      return;
    }

    setSubmittingHomeworkId(item.id);
    setError(null);
    try {
      await apiRequest(
        `/api/parent/homework/${item.homeworkId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            studentId: item.studentId,
            attachmentUrl,
          }),
        },
        token
      );
      setSubmissionUrls((prev) => ({ ...prev, [item.id]: '' }));
      if (selectedStudentId) {
        await loadStudentData(token, selectedStudentId);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit homework.');
    } finally {
      setSubmittingHomeworkId(null);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setChildren([]);
    setSelectedStudentId(null);
    setAttendance([]);
    setMarks([]);
    setReportCards([]);
    setTimetable([]);
    setHomework([]);
    setAnnouncements([]);
    setPendingFees([]);
    setPhone('');
    setPassword('');
    setError(null);
  }

  if (!token || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SchoolSync Parent</Text>
          <Text style={styles.subtitle}>Login to view your child information</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Guardian Phone</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="phone-pad"
            placeholder="+91 98765 43210"
            placeholderTextColor="#8a8a8a"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Enter guardian password"
            placeholderTextColor="#8a8a8a"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {API_CONFIG_ERROR ? <Text style={styles.errorText}>{API_CONFIG_ERROR}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.primaryButton, API_CONFIG_ERROR && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loadingLogin || Boolean(API_CONFIG_ERROR)}
          >
            {loadingLogin ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </Pressable>
          <Text style={styles.helperText}>
            Login with the guardian phone number and password shared by the school.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>SchoolSync Parent</Text>
        <Text style={styles.subtitle}>Welcome, {user.name}</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Children</Text>
        {children.length === 0 ? (
          <Text style={styles.emptyText}>No linked students found for this account.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {children.map((child) => {
              const isSelected = selectedStudentId === child.id;
              return (
                <Pressable
                  key={child.id}
                  style={[styles.childChip, isSelected && styles.childChipSelected]}
                  onPress={() => handleChildChange(child.id)}
                >
                  <Text style={[styles.childChipText, isSelected && styles.childChipTextSelected]}>
                    {child.name}
                  </Text>
                  <Text style={styles.childChipSubtext}>
                    Roll {child.rollNo}
                    {child.section?.class?.name && child.section?.name
                      ? ` • ${child.section.class.name}-${child.section.name}`
                      : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loadingData ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pending Fees</Text>
            {pendingFees.slice(0, 6).map((fee) => (
              <View key={`${fee.student.id}-${fee.feeStructure.id}`} style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <Text style={styles.listRowTitle}>{fee.feeStructure.name}</Text>
                  <Text style={styles.listRowSubtext}>
                    {fee.student.name}
                    {fee.student.section?.class?.name && fee.student.section?.name
                      ? ` • ${fee.student.section.class.name}-${fee.student.section.name}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.feeAction}>
                  <Text style={styles.listRowValue}>
                    ₹{fee.feeStructure.amount.toLocaleString('en-IN')}
                  </Text>
                  <Pressable style={styles.smallButton} onPress={() => handleCreateFeeOrder(fee)}>
                    <Text style={styles.smallButtonText}>Order</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {pendingFees.length === 0 ? <Text style={styles.emptyText}>No pending fees.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Homework</Text>
            {homework.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.homeworkRow}>
                <View style={styles.listRowLeft}>
                  <Text style={styles.listRowTitle}>{item.title}</Text>
                  <Text style={styles.listRowSubtext}>
                    {item.subject} • Deadline {formatDateTime(item.deadlineAt)}
                    {item.teacher?.name ? ` • ${item.teacher.name}` : ''}
                  </Text>
                  <Text style={styles.remarkText}>
                    Status: {item.submissionStatus.replace('_', ' ')} • Method: {item.submissionMethod}
                  </Text>
                  {item.teacherRemark ? (
                    <Text style={styles.remarkText}>Remark: {item.teacherRemark}</Text>
                  ) : null}
                  {item.submission?.attachmentUrl ? (
                    <Text style={styles.remarkText}>Attachment: {item.submission.attachmentUrl}</Text>
                  ) : null}
                  {item.submittedAt ? (
                    <Text style={styles.remarkText}>Submitted on {formatDateTime(item.submittedAt)}</Text>
                  ) : null}
                  {item.checkedAt ? (
                    <Text style={styles.remarkText}>Checked on {formatDateTime(item.checkedAt)}</Text>
                  ) : null}
                  {item.homeworkStatus === 'ACTIVE' ? (
                    <View style={styles.submitWrap}>
                      <TextInput
                        autoCapitalize="none"
                        placeholder="Paste attachment URL"
                        placeholderTextColor="#8a8a8a"
                        style={styles.submitInput}
                        value={submissionUrls[item.id] || ''}
                        onChangeText={(value) =>
                          setSubmissionUrls((prev) => ({ ...prev, [item.id]: value }))
                        }
                      />
                      <Pressable
                        style={styles.smallButton}
                        onPress={() => handleSubmitHomework(item)}
                        disabled={submittingHomeworkId === item.id}
                      >
                        {submittingHomeworkId === item.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.smallButtonText}>Submit</Text>
                        )}
                      </Pressable>
                    </View>
                  ) : null}
                </View>
                <View style={styles.homeworkMeta}>
                  <Text style={styles.statusPill}>{item.submissionStatus.replace('_', ' ')}</Text>
                  <Text style={styles.methodPill}>{item.submissionMethod}</Text>
                  {item.score !== null && item.maxScore !== null ? (
                    <Text style={styles.listRowValue}>
                      {item.score}/{item.maxScore}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
            {homework.length === 0 ? <Text style={styles.emptyText}>No homework assigned.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attendance (Last 30 days)</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Present: {attendanceSummary.present}</Text>
              <Text style={styles.summaryText}>Absent: {attendanceSummary.absent}</Text>
              <Text style={styles.summaryText}>Late: {attendanceSummary.late}</Text>
            </View>
            {attendance.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.listRow}>
                <Text style={styles.listRowTitle}>{formatDate(item.date)}</Text>
                <Text style={styles.listRowValue}>{item.status}</Text>
              </View>
            ))}
            {attendance.length === 0 ? <Text style={styles.emptyText}>No attendance records.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Marks</Text>
            {marks.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <Text style={styles.listRowTitle}>{item.exam.name}</Text>
                  <Text style={styles.listRowSubtext}>{item.exam.scheme?.name || 'Exam'}</Text>
                </View>
                <Text style={styles.listRowValue}>
                  {item.marks}/{item.exam.maxMarks}
                </Text>
              </View>
            ))}
            {marks.length === 0 ? <Text style={styles.emptyText}>No marks published yet.</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Published Report Cards</Text>
            {reportCards.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <Text style={styles.listRowTitle}>{item.examScheme.name}</Text>
                  <Text style={styles.listRowSubtext}>
                    {item.student.name} • Roll {item.student.rollNo}
                    {item.publishedAt ? ` • ${formatDate(item.publishedAt)}` : ''}
                  </Text>
                </View>
                <Text style={styles.listRowValue}>
                  {item.percentage}% • {item.grade}
                </Text>
              </View>
            ))}
            {reportCards.length === 0 ? (
              <Text style={styles.emptyText}>No published report cards yet.</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timetable</Text>
            {timetable.map((slot) => (
              <View key={slot.id} style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <Text style={styles.listRowTitle}>
                    {DAY_NAMES[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`} • P{slot.period}
                  </Text>
                  <Text style={styles.listRowSubtext}>{slot.teacher?.name || 'Teacher not assigned'}</Text>
                </View>
                <Text style={styles.listRowValue}>{slot.subject || 'Subject TBD'}</Text>
              </View>
            ))}
            {timetable.length === 0 ? <Text style={styles.emptyText}>No timetable available.</Text> : null}
          </View>

          <View style={[styles.card, styles.lastCard]}>
            <Text style={styles.sectionTitle}>Announcements</Text>
            {announcements.map((item) => (
              <View key={item.id} style={styles.announcementCard}>
                <Text style={styles.announcementTitle}>{item.title}</Text>
                <Text style={styles.announcementBody}>{item.body}</Text>
                <Text style={styles.announcementMeta}>
                  {formatDate(item.publishedAt)}
                  {item.createdBy?.name ? ` • ${item.createdBy.name}` : ''}
                </Text>
              </View>
            ))}
            {announcements.length === 0 ? (
              <Text style={styles.emptyText}>No announcements yet.</Text>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 14,
    marginTop: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  lastCard: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9bb8d8',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    marginTop: 10,
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 10,
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    color: '#b71c1c',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  logoutButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#125aa0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  childChip: {
    borderWidth: 1,
    borderColor: '#dbe8f6',
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    minWidth: 150,
  },
  childChipSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#e9f2ff',
  },
  childChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  childChipTextSelected: {
    color: '#0d47a1',
  },
  childChipSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#596779',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRowLeft: {
    flexShrink: 1,
    paddingRight: 10,
  },
  listRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  listRowSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  listRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  feeAction: {
    alignItems: 'flex-end',
    gap: 6,
  },
  homeworkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  homeworkMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusPill: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#e9f2ff',
    color: '#0d47a1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '700',
  },
  methodPill: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '700',
  },
  remarkText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 16,
    color: '#4b5563',
  },
  submitWrap: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  submitInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#222',
    backgroundColor: '#fff',
  },
  smallButton: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  announcementCard: {
    borderWidth: 1,
    borderColor: '#ededed',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fcfcfc',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  announcementBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#444',
  },
  announcementMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
  },
  loaderWrap: {
    paddingVertical: 40,
  },
});

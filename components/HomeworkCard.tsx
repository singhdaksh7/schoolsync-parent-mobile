import React from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { styles } from '@/lib/styles';
import { formatDateTime } from '@/lib/format';
import type { PickedFile } from '@/lib/managed-upload';
import type { HomeworkItem } from '@/lib/types';

export function HomeworkCard(props: {
  homework: HomeworkItem[];
  submittingHomeworkId: string | null;
  onSubmitHomework: (item: HomeworkItem, file: PickedFile) => void;
}) {
  async function pickAndSubmit(item: HomeworkItem) {
    const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    props.onSubmitHomework(item, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Homework</Text>
      {props.homework.slice(0, 8).map((item) => (
        <View key={item.id} style={styles.homeworkRow}>
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowTitle}>{item.title}</Text>
            <Text style={styles.listRowSubtext}>{item.subject} - Deadline {formatDateTime(item.deadlineAt)}</Text>
            <Text style={styles.remarkText}>
              Status: {item.submissionStatus.replace('_', ' ')} - Method: {item.submissionMethod}
            </Text>
            {item.teacherRemark ? <Text style={styles.remarkText}>Remark: {item.teacherRemark}</Text> : null}
            {item.homeworkStatus === 'ACTIVE' ? (
              <View style={styles.submitWrap}>
                <Pressable
                  style={styles.smallButton}
                  onPress={() => pickAndSubmit(item)}
                  disabled={props.submittingHomeworkId === item.id}
                >
                  {props.submittingHomeworkId === item.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.smallButtonText}>Attach & Submit</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
          <View style={styles.homeworkMeta}>
            <Text style={styles.statusPill}>{item.submissionStatus.replace('_', ' ')}</Text>
            <Text style={styles.methodPill}>{item.submissionMethod}</Text>
            {item.score !== null && item.maxScore !== null ? (
              <Text style={styles.listRowValue}>{item.score}/{item.maxScore}</Text>
            ) : null}
          </View>
        </View>
      ))}
      {props.homework.length === 0 ? <Text style={styles.emptyText}>No homework assigned.</Text> : null}
    </View>
  );
}

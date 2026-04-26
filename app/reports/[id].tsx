import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { getTemplateById } from '@/data/reportTemplates';
import { formatPhotoTimestamp } from '@/lib/dates';
import { addPhotoToReport, listReportPhotos } from '@/repositories/photoRepository';
import { deleteReport, getReport, updateReport } from '@/repositories/reportRepository';
import { addPhotoFromCamera, addPhotoFromLibrary } from '@/photos/photoService';
import type { ReportPhoto } from '@/types/photo';
import type { Report, ReportStatus } from '@/types/report';

export default function ReportEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [status, setStatus] = useState<ReportStatus>('draft');
  const [isSaving, setIsSaving] = useState(false);

  const loadReport = useCallback(async () => {
    if (!id) {
      return;
    }
    const [loadedReport, loadedPhotos] = await Promise.all([getReport(id), listReportPhotos(id)]);
    setReport(loadedReport);
    setPhotos(loadedPhotos);
    if (loadedReport) {
      setTitle(loadedReport.title);
      setClientName(loadedReport.clientName ?? '');
      setAddress(loadedReport.address ?? '');
      setGeneralNotes(loadedReport.generalNotes ?? '');
      setStatus(loadedReport.status);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadReport();
    }, [loadReport]),
  );

  async function handleSave() {
    if (!id || !title.trim()) {
      Alert.alert('Title required', 'Add a report title before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateReport(id, {
        title,
        clientName: clientName.trim() || null,
        address: address.trim() || null,
        generalNotes: generalNotes.trim() || null,
        status,
      });
      setReport(saved);
      Alert.alert('Saved', 'Report details were saved.');
    } catch {
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    if (!id) {
      return;
    }
    Alert.alert('Delete report?', 'This removes the report metadata from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteReport(id)
            .then(() => router.replace('/'))
            .catch(() => Alert.alert('Could not delete report', 'Please try again.'));
        },
      },
    ]);
  }

  async function handleAddPhoto(source: 'camera' | 'library') {
    if (!id) {
      return;
    }

    try {
      const stagedPhoto =
        source === 'camera' ? await addPhotoFromCamera(id) : await addPhotoFromLibrary(id);
      if (!stagedPhoto) {
        return;
      }
      await addPhotoToReport(id, {
        localUri: stagedPhoto.localUri,
        fileName: stagedPhoto.fileName,
        takenAt: stagedPhoto.takenAt,
      });
      await loadReport();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not add photo', message);
    }
  }

  if (!report) {
    return (
      <Screen>
        <Text style={styles.title}>Loading report…</Text>
      </Screen>
    );
  }

  const template = getTemplateById(report.templateId);

  return (
    <Screen>
      <Text style={styles.title}>Edit report</Text>
      <Text style={styles.body}>{template.name}</Text>

      <Card>
        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Report title" />

        <Text style={styles.label}>Client / job / property</Text>
        <TextInput
          value={clientName}
          onChangeText={setClientName}
          style={styles.input}
          placeholder="Client, job, or property name"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput value={address} onChangeText={setAddress} style={styles.input} placeholder="Optional address" />

        <Text style={styles.label}>General notes</Text>
        <TextInput
          value={generalNotes}
          onChangeText={setGeneralNotes}
          style={[styles.input, styles.multiline]}
          placeholder="Optional notes"
          multiline
        />

        <View style={styles.row}>
          <Button variant={status === 'draft' ? 'primary' : 'secondary'} onPress={() => setStatus('draft')}>
            Draft
          </Button>
          <Button
            variant={status === 'completed' ? 'primary' : 'secondary'}
            onPress={() => setStatus('completed')}
          >
            Completed
          </Button>
        </View>

        <Button disabled={isSaving} onPress={handleSave}>
          {isSaving ? 'Saving…' : 'Save report'}
        </Button>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Photos</Text>
        <View style={styles.row}>
          <Button variant="secondary" onPress={() => void handleAddPhoto('camera')}>
            Add from camera
          </Button>
          <Button variant="secondary" onPress={() => void handleAddPhoto('library')}>
            Add from library
          </Button>
        </View>
        {photos.length === 0 ? (
          <Text style={styles.body}>No photos yet. Add from camera or library to start documenting.</Text>
        ) : (
          photos.map((photo) => (
            <View key={photo.id} style={styles.photoRow}>
              <Image source={{ uri: photo.localUri }} style={styles.thumbnail} />
              <View style={styles.photoText}>
                <Text style={styles.photoTitle}>{photo.caption || 'Untitled photo'}</Text>
                <Text style={styles.body}>
                  {photo.sectionLabel || 'No section'} • {formatPhotoTimestamp(photo.takenAt)}
                </Text>
              </View>
              <Button variant="ghost" onPress={() => router.push(`/photos/${photo.id}`)}>
                Edit
              </Button>
            </View>
          ))
        )}
      </Card>

      <View style={styles.row}>
        <Button variant="secondary" onPress={() => router.push(`/pdf/${id}`)}>
          Preview PDF
        </Button>
        <Button variant="danger" onPress={handleDelete}>
          Delete
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
  },
  placeholder: {
    gap: 12,
    paddingVertical: 24,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    marginBottom: 14,
    padding: 12,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  photoRow: {
    alignItems: 'center',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  photoTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  photoText: {
    flex: 1,
  },
  thumbnail: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    height: 64,
    width: 64,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
});

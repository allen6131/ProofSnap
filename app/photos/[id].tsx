import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { formatPhotoTimestamp } from '@/lib/dates';
import { formatLocationLine } from '@/lib/format';
import { deleteReportPhoto, getReportPhoto, updateReportPhoto } from '@/repositories/photoRepository';
import type { ReportPhoto } from '@/types/photo';

export default function PhotoNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [photo, setPhoto] = useState<ReportPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [sectionLabel, setSectionLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    getReportPhoto(id).then((loadedPhoto) => {
      setPhoto(loadedPhoto);
      setCaption(loadedPhoto?.caption ?? '');
      setSectionLabel(loadedPhoto?.sectionLabel ?? '');
    });
  }, [id]);

  async function handleSave() {
    if (!photo) {
      return;
    }
    setIsSaving(true);
    const updated = await updateReportPhoto(photo.id, {
      caption: caption.trim() || null,
      sectionLabel: sectionLabel.trim() || null,
    });
    setIsSaving(false);
    setPhoto(updated);
    router.back();
  }

  function handleDelete() {
    if (!photo) {
      return;
    }
    Alert.alert('Delete photo?', 'This removes the photo from the report.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReportPhoto(photo.id);
          router.back();
        },
      },
    ]);
  }

  if (!photo) {
    return (
      <Screen>
        <Text>Loading photo…</Text>
      </Screen>
    );
  }

  const locationLine = formatLocationLine(photo.latitude, photo.longitude);

  return (
    <Screen>
      <Card>
        <Image source={{ uri: photo.localUri }} style={styles.image} />
        <Text style={styles.meta}>{formatPhotoTimestamp(photo.takenAt)}</Text>
        {locationLine ? <Text style={styles.meta}>Location: {locationLine}</Text> : null}
      </Card>

      <Text style={styles.label}>Section label</Text>
      <TextInput
        accessibilityLabel="Section label"
        onChangeText={setSectionLabel}
        placeholder="Before, Kitchen, Final walkthrough..."
        style={styles.input}
        value={sectionLabel}
      />

      <Text style={styles.label}>Caption / note</Text>
      <TextInput
        accessibilityLabel="Photo caption"
        multiline
        onChangeText={setCaption}
        placeholder="Add client-ready context for this photo"
        style={[styles.input, styles.textArea]}
        value={caption}
      />

      <View style={styles.actions}>
        <Button disabled={isSaving} onPress={handleSave} title={isSaving ? 'Saving…' : 'Save photo note'} />
        <Button onPress={handleDelete} title="Delete photo" variant="danger" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
  },
  image: {
    aspectRatio: 4 / 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    marginBottom: 14,
    padding: 14,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  meta: {
    color: '#64748b',
    marginTop: 8,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});

import * as ImagePicker from 'expo-image-picker';

import { nowIso } from '@/lib/dates';

import { copyPhotoIntoReport } from './photoStorage';

export interface StagedPhoto {
  localUri: string;
  fileName: string;
  takenAt: string;
}

async function stagePickedAsset(reportId: string, asset: ImagePicker.ImagePickerAsset): Promise<StagedPhoto> {
  const stored = await copyPhotoIntoReport(reportId, asset.uri);
  return {
    localUri: stored.localUri,
    fileName: stored.fileName,
    takenAt: asset.exif?.DateTimeOriginal ? String(asset.exif.DateTimeOriginal) : nowIso(),
  };
}

export async function addPhotoFromCamera(reportId: string): Promise<StagedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is needed to take report photos. You can enable it in system settings.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    exif: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return stagePickedAsset(reportId, result.assets[0]);
}

export async function addPhotoFromLibrary(reportId: string): Promise<StagedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is needed to import job photos. You can enable it in system settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: false,
    exif: true,
    mediaTypes: ['images'],
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  return stagePickedAsset(reportId, result.assets[0]);
}

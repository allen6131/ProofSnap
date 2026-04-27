import * as ImagePicker from 'expo-image-picker';

import { nowIso } from '@/lib/dates';

import { getLocationStampIfEnabled } from './locationStamping';
import { copyPhotoIntoReport } from './photoStorage';

export const LOCATION_STAMPING_SETTING_KEY = 'location.stamping.enabled';

export interface StagedPhoto {
  localUri: string;
  fileName: string;
  takenAt: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
}

async function stagePickedAsset(reportId: string, asset: ImagePicker.ImagePickerAsset): Promise<StagedPhoto> {
  const stored = await copyPhotoIntoReport(reportId, asset.uri);
  const location = await getLocationStampIfEnabled();
  return {
    localUri: stored.localUri,
    fileName: stored.fileName,
    takenAt: asset.exif?.DateTimeOriginal ? String(asset.exif.DateTimeOriginal) : nowIso(),
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    locationAccuracy: location?.locationAccuracy ?? null,
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

export async function pickPhotoFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is needed to choose an image. You can enable it in system settings.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: false,
    mediaTypes: ['images'],
    quality: 0.9,
  });

  return result.canceled ? null : (result.assets[0] ?? null);
}

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { nowIso } from '@/lib/dates';
import { getAppSetting } from '@/repositories/appSettingsRepository';

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
  const location = await getOptionalLocationStamp();
  return {
    localUri: stored.localUri,
    fileName: stored.fileName,
    takenAt: asset.exif?.DateTimeOriginal ? String(asset.exif.DateTimeOriginal) : nowIso(),
    latitude: location?.coords.latitude ?? null,
    longitude: location?.coords.longitude ?? null,
    locationAccuracy: location?.coords.accuracy ?? null,
  };
}

async function getOptionalLocationStamp(): Promise<Location.LocationObject | null> {
  const enabled = (await getAppSetting(LOCATION_STAMPING_SETTING_KEY)) === 'true';
  if (!enabled) {
    return null;
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      'Location stamping is enabled, but location permission was denied. Turn it off in Settings or enable location access in system settings.',
    );
  }

  return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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

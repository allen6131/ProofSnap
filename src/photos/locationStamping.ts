import * as Location from 'expo-location';

import type { LocationStamp } from '@/lib/permissions';
import { getOptionalLocationStamp as requestOptionalLocationStamp } from '@/lib/permissions';
import { getAppSetting, setAppSetting } from '@/repositories/appSettingsRepository';

export const LOCATION_STAMPING_SETTING_KEY = 'location.stamping.enabled';

export async function isLocationStampingEnabled(): Promise<boolean> {
  return (await getAppSetting(LOCATION_STAMPING_SETTING_KEY)) === 'true';
}

export async function setLocationStampingEnabled(enabled: boolean): Promise<void> {
  await setAppSetting(LOCATION_STAMPING_SETTING_KEY, enabled ? 'true' : 'false');
}

export async function getLocationStampIfEnabled(): Promise<LocationStamp | null> {
  return requestOptionalLocationStamp(await isLocationStampingEnabled());
}

export async function getLocationPermissionStatus(): Promise<Location.PermissionStatus | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  return permission.status;
}

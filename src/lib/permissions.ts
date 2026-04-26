import * as Location from 'expo-location';

export interface LocationStamp {
  latitude: number;
  longitude: number;
  locationAccuracy?: number | null;
}

export async function getOptionalLocationStamp(enabled: boolean): Promise<LocationStamp | null> {
  if (!enabled) {
    return null;
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      'Location permission is optional, but it is needed when location stamping is enabled. You can disable stamping or enable location in system settings.',
    );
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    locationAccuracy: location.coords.accuracy,
  };
}

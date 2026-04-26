export const APP_NAME = 'ProofSnap';

export function compactJoin(values: (string | null | undefined)[], separator = ' • '): string {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(separator);
}

export function formatLocationLine(latitude?: number | null, longitude?: number | null): string | null {
  if (latitude == null || longitude == null) {
    return null;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

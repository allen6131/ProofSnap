export type LaunchColor = 'green' | 'yellow' | 'red' | 'gray';

export interface Ramp {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  confidence_score: number;
  source: string;
}

export interface LaunchWindow {
  starts_at: string;
  ends_at: string;
  color: LaunchColor;
  score: number;
  confidence_score: number;
  reasons: Array<{ severity: string; code: string; message: string; source: string }>;
  source_summary: Record<string, unknown>;
  thresholds: Record<string, unknown>;
}

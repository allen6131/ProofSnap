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

export interface ChatRecommendationRequest {
  message: string;
  intent?: 'boating' | 'fishing' | 'both';
  region?: string;
  near_lat?: number;
  near_lon?: number;
  date?: string;
  candidate_limit?: number;
}

export interface ChatSourceCard {
  name: string;
  provider: string;
  url?: string | null;
  observed_at?: string | null;
  updated_at?: string | null;
  freshness_minutes?: number | null;
  status: 'ok' | 'stale' | 'missing' | 'error' | 'supplemental';
  notes: string[];
}

export interface ChatBestWindow {
  starts_at?: string | null;
  ends_at?: string | null;
  color: LaunchColor;
  score: number;
  confidence_score: number;
}

export interface ChatSpotRecommendation {
  ramp_id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
  rank: number;
  fit_score: number;
  launch_color: LaunchColor;
  confidence_score: number;
  best_window?: ChatBestWindow | null;
  top_reasons: Array<{ severity?: string; code?: string; message?: string; source?: string }>;
  boating_notes: string[];
  fishing_notes: string[];
  source_cards: ChatSourceCard[];
  missing_data: string[];
}

export interface ChatRecommendationResponse {
  assistant_message: string;
  intent: 'boating' | 'fishing' | 'both';
  recommendations: ChatSpotRecommendation[];
  warnings: string[];
  disclaimer: string;
  sources: ChatSourceCard[];
  suggested_followups: string[];
  used_openai: boolean;
}

export interface Ramp {
  id: string;
  name: string;
  source: string;
  status: string;
  confidence_score: number;
  manually_verified_at: string | null;
  region_id: string | null;
}

export interface Station {
  id: string;
  name: string;
  provider: string;
  station_type: string;
}

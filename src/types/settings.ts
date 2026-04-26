export interface BrandingSettings {
  companyName?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUri?: string | null;
  footerText?: string | null;
  updatedAt?: string | null;
}

export interface AppSetting {
  key: string;
  value: string;
}

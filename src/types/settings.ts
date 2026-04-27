export interface BrandingSettings {
  id: string;
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

export type BrandingSettingsPatch = Partial<
  Pick<
    BrandingSettings,
    'companyName' | 'contactName' | 'email' | 'phone' | 'website' | 'logoUri' | 'footerText'
  >
>;

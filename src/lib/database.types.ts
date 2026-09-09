// Types de la base de données (étape 1). Regénérables plus tard avec `npm run db:types`.
export type MemberRole = 'candidate' | 'professional' | 'accompanied' | 'founder'
export type MemberStatus =
  'invited' | 'pending' | 'active' | 'paused' | 'suspended' | 'left' | 'refused'

export type SettingAudience = 'public' | 'members' | 'professionals' | 'founders'

export interface Profile {
  id: string
  role: MemberRole
  status: MemberStatus
  first_name: string
  last_name: string
  is_hidden: boolean
  visible_to_accompanied: boolean
  public_directory_consent: boolean
  onboarding_done: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
  /* Fiche « Mon Univers » */
  headline: string
  activity: string
  approach: string
  skills: string[]
  contribution_topics: string[]
  audience: string
  location: string
  presence: 'presentiel' | 'distance' | 'les-deux'
  current_project: string
  website: string
  /** Identifiant Instagram principal, sans arobase. Un seul compte. */
  instagram: string
}

export interface SocialLinkRow {
  id: string
  profile_id: string
  network: 'threads' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'other'
  label: string
  url: string
  position: number
  created_at: string
}

export interface AppSetting {
  key: string
  value: unknown
  label: string
  description: string
  audience: SettingAudience
  needs_validation: boolean
  updated_at: string
  updated_by: string | null
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
        Relationships: []
      }
      app_settings: {
        Row: AppSetting
        Insert: Partial<AppSetting> & { key: string; label: string }
        Update: Partial<AppSetting>
        Relationships: []
      }
      founders: {
        Row: { user_id: string; designated_at: string }
        Insert: { user_id: string; designated_at?: string }
        Update: { user_id?: string; designated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      ensure_own_profile: { Args: Record<string, never>; Returns: Profile }
      is_founder: { Args: Record<string, never>; Returns: boolean }
      is_active_member: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: { member_role: MemberRole; member_status: MemberStatus }
    CompositeTypes: Record<string, never>
  }
}

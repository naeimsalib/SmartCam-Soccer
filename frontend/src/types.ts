export interface UserSettings {
  intro_video_path: string | null;
  logo_path: string | null;
  sponsor_logo1_path: string | null;
  sponsor_logo2_path: string | null;
  sponsor_logo3_path: string | null;
}

export interface SystemStatus {
  id: string;
  user_id: string;
  is_recording: boolean;
  is_streaming: boolean;
  pi_active: boolean;
  last_heartbeat: string;
  storage_used: number;
  last_backup: string | null;
  created_at: string;
  updated_at: string;
} 
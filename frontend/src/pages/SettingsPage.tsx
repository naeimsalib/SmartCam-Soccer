import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import Navigation from "../components/Navigation";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { shallowEqual } from '../utils/objectUtils';
import type { SystemStatus, UserSettings } from '../types';

interface StatusRow {
  camera_on: boolean;
  is_recording: boolean;
}

interface CameraRow {
  id: string;
  name: string;
  location?: string;
  camera_on: boolean;
  is_recording: boolean;
  last_seen: string;
  ip_address?: string;
  error?: string | null;
}

function isCameraOnline(lastSeen: string, thresholdSec = 6) {
  return (Date.now() - new Date(lastSeen).getTime()) / 1000 < thresholdSec;
}

// Add buildPreviewUrlMap function
const buildPreviewUrlMap = async (settings: UserSettings): Promise<Record<string, string>> => {
  const newPreviewUrls: Record<string, string> = {};

  if (settings?.intro_video_path) {
    const { data: introData } = await supabase.storage
      .from("usermedia")
      .createSignedUrl(settings.intro_video_path, 3600);
    if (introData?.signedUrl) {
      newPreviewUrls.intro = introData.signedUrl;
    }
  }

  if (settings?.logo_path) {
    const { data: logoData } = await supabase.storage
      .from("usermedia")
      .createSignedUrl(settings.logo_path, 3600);
    if (logoData?.signedUrl) {
      newPreviewUrls.logo = logoData.signedUrl;
    }
  }

  for (const key of [
    "sponsor_logo1_path",
    "sponsor_logo2_path",
    "sponsor_logo3_path",
  ] as const) {
    if (settings?.[key]) {
      const { data: signedData } = await supabase.storage
        .from("usermedia")
        .createSignedUrl(settings[key], 3600);
      if (signedData?.signedUrl) {
        newPreviewUrls[key.replace("_path", "")] = signedData.signedUrl;
      }
    }
  }

  return newPreviewUrls;
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [previewUrl, setPreviewUrl] = useState<Record<string, string>>({});

  type MediaType = 'intro_video_path' | 'logo_path' | 'sponsor_logo1_path' | 'sponsor_logo2_path' | 'sponsor_logo3_path';

  const mediaCards: {
    label: string;
    type: MediaType;
    previewKey: keyof typeof previewUrl;
    accept: string;
    isVideo: boolean;
  }[] = [
    {
      label: 'Intro Video',
      type: 'intro_video_path',
      previewKey: 'intro',
      accept: 'video/*',
      isVideo: true,
    },
    {
      label: 'Logo',
      type: 'logo_path',
      previewKey: 'logo',
      accept: 'image/*',
      isVideo: false,
    },
    {
      label: 'Sponsor Logo 1',
      type: 'sponsor_logo1_path',
      previewKey: 'sponsor_logo1',
      accept: 'image/*',
      isVideo: false,
    },
    {
      label: 'Sponsor Logo 2',
      type: 'sponsor_logo2_path',
      previewKey: 'sponsor_logo2',
      accept: 'image/*',
      isVideo: false,
    },
    {
      label: 'Sponsor Logo 3',
      type: 'sponsor_logo3_path',
      previewKey: 'sponsor_logo3',
      accept: 'image/*',
      isVideo: false,
    },
  ];

  // Memoize all handlers
  const handleSystemStatusUpdate = useCallback((updatedStatus: SystemStatus) => {
    setSystemStatus(prev => {
      if (shallowEqual(prev, updatedStatus)) return prev;
      return updatedStatus;
    });
  }, []);

  const handleSettingsUpdate = useCallback((updatedSettings: UserSettings) => {
    setSettings(prev => {
      if (shallowEqual(prev, updatedSettings)) return prev;
      return updatedSettings;
    });
  }, []);

  const handleCameraInsert = useCallback((newCamera: CameraRow) => {
    setCameras(prev => [...prev, newCamera]);
  }, []);

  const handleCameraUpdate = useCallback((updatedCamera: CameraRow) => {
    setCameras(prev => prev.map(cam => 
      cam.id === updatedCamera.id ? updatedCamera : cam
    ));
  }, []);

  const handleCameraDelete = useCallback((deletedCamera: CameraRow) => {
    setCameras(prev => prev.filter(cam => cam.id !== deletedCamera.id));
  }, []);

  const handleSettingsInsert = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
  }, []);

  const handleSettingsDelete = useCallback((deletedSettings: UserSettings) => {
    setSettings(null);
  }, []);

  // System status subscription
  const { channel: systemStatusChannel, error: systemStatusError, isConnected: systemStatusConnected } = useRealtimeSubscription<SystemStatus>({
    table: "system_status",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onUpdate: handleSystemStatusUpdate,
    onInsert: handleSystemStatusUpdate,
  });

  // Settings subscription
  const { channel: settingsChannel, error: settingsError, isConnected: settingsConnected } = useRealtimeSubscription<UserSettings>({
    table: "user_settings",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onUpdate: handleSettingsUpdate,
    onInsert: handleSettingsInsert,
    onDelete: handleSettingsDelete,
  });

  // Cameras subscription
  const { channel: camerasChannel, error: camerasError, isConnected: camerasConnected } = useRealtimeSubscription<CameraRow>({
    table: "cameras",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onInsert: handleCameraInsert,
    onUpdate: handleCameraUpdate,
    onDelete: handleCameraDelete,
  });

  // Log subscription errors and connection status
  useEffect(() => {
    if (systemStatusError || settingsError || camerasError) {
      setError('Connection error. Please refresh the page.');
    }
  }, [systemStatusError, settingsError, camerasError]);

  // Cleanup subscriptions when component unmounts
  useEffect(() => {
    return () => {
      if (systemStatusChannel) {
        supabase.removeChannel(systemStatusChannel);
      }
      if (settingsChannel) {
        supabase.removeChannel(settingsChannel);
      }
      if (camerasChannel) {
        supabase.removeChannel(camerasChannel);
      }
    };
  }, [systemStatusChannel, settingsChannel, camerasChannel]);

  // Memoize the fetch system status function
  const fetchSystemStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_status")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // If no status exists, create one
        const { data: newStatus, error: insertError } = await supabase
          .from("system_status")
          .insert({
            user_id: userId,
            is_recording: false,
            is_streaming: false,
            storage_used: 0,
            last_backup: null
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSystemStatus(newStatus);
      } else {
        setSystemStatus(prev => {
          if (shallowEqual(prev, data)) return prev;
          return data;
        });
      }
    } catch (err) {
      setError("Failed to fetch system status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Memoize the updatePreviewUrls function
  const updatePreviewUrls = useCallback(async (newSettings: UserSettings | null) => {
    if (!newSettings) return;
    const newUrls = await buildPreviewUrlMap(newSettings);
    setPreviewUrl(prev => {
      if (shallowEqual(prev, newUrls)) return prev;
      return newUrls;
    });
  }, []);

  // Single useEffect for initial data fetching
  useEffect(() => {
    if (!userId) return;
    fetchSystemStatus();
  }, [userId, fetchSystemStatus]);

  // Update preview URLs when settings change
  useEffect(() => {
    updatePreviewUrls(settings);
  }, [settings, updatePreviewUrls]);

  const fetchSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setSettings(data);
      if (data) {
        await updatePreviewUrls(data);
      }
    } catch (err) {
      setError("Failed to fetch settings");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Initial fetch of cameras
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("cameras")
      .select("*")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) setCameras(data as CameraRow[]);
      });
  }, [userId]);

  // Real-time subscription for cameras
  useRealtimeSubscription<CameraRow>({
    table: "cameras",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onInsert: (newCamera) => {
      setCameras((prev) => [...prev, newCamera]);
    },
    onUpdate: (updatedCamera) => {
      setCameras((prev) =>
        prev.map((cam) => (cam.id === updatedCamera.id ? updatedCamera : cam))
      );
    },
    onDelete: (deletedCamera) => {
      setCameras((prev) => prev.filter((cam) => cam.id !== deletedCamera.id));
    },
  });

  // Real-time subscription for user settings
  useRealtimeSubscription<UserSettings>({
    table: "user_settings",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onInsert: (newSettings) => {
      setSettings(newSettings);
      updatePreviewUrls(newSettings);
    },
    onUpdate: (updatedSettings) => {
      setSettings(updatedSettings);
      updatePreviewUrls(updatedSettings);
    },
    onDelete: () => {
      setSettings(null);
      setPreviewUrl({});
    },
  });

  const handleFileUpload = async (
    file: File,
    type: MediaType
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("usermedia")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: existing, error: existingError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingError && existingError.code !== "PGRST116")
        throw existingError;

      const { error: updateError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          [type]: filePath,
        });

      if (updateError) throw updateError;

      setSuccess("File uploaded successfully");
      await fetchSettings();
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async (type: MediaType) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error: updateError } = await supabase
        .from("user_settings")
        .update({ [type]: null })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setSuccess("File removed successfully");
      await fetchSettings();
    } catch (err) {
      console.error("Error removing file:", err);
      setError("Failed to remove file");
    } finally {
      setLoading(false);
    }
  };

  const renderUploader = (
    label: string,
    type: keyof UserSettings & string,
    preview?: string
  ) => (
    <Card
      sx={{
        background: "#1a1a1a",
        color: "#fff",
        borderRadius: 3,
        mb: 3,
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
          {label}
        </Typography>
        {preview && (
          <Box
            sx={{
              width: "100%",
              height: 200,
              background: "#2a2a2a",
              borderRadius: 2,
              mb: 2,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={preview}
              alt={label}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        )}
        <Stack direction="row" spacing={2}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
            sx={{
              backgroundColor: "#F44336",
              "&:hover": {
                backgroundColor: "#D32F2F",
              },
            }}
          >
            Upload
            <input
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, type);
              }}
            />
          </Button>
          {preview && (
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => handleRemoveFile(type)}
              disabled={loading}
              sx={{
                color: "#F44336",
                borderColor: "#F44336",
                "&:hover": {
                  borderColor: "#D32F2F",
                  backgroundColor: "rgba(244, 67, 54, 0.04)",
                },
              }}
            >
              Remove
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.functions.invoke("create-backup", {
        body: { userId },
      });

      if (error) throw error;

      setSuccess("Backup created successfully");
      setBackupDialogOpen(false);
      await fetchSystemStatus();
    } catch (err) {
      console.error("Error creating backup:", err);
      setError("Failed to create backup");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase.functions.invoke("delete-all-data", {
        body: { userId },
      });

      if (error) throw error;

      setSuccess("All data deleted successfully");
      await fetchSettings();
      await fetchSystemStatus();
    } catch (err) {
      console.error("Error deleting data:", err);
      setError("Failed to delete data");
    } finally {
      setLoading(false);
    }
  };

  const formatStorage = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
      }}
    >
      <Navigation />
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            color: "#fff",
            mb: 6,
            fontFamily: "Montserrat, sans-serif",
            textAlign: "center",
          }}
        >
          Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography
                    variant="h5"
                    sx={{ color: "#fff", fontWeight: 600 }}
                  >
                    System Status
                  </Typography>
                  <IconButton 
                    onClick={fetchSystemStatus} 
                    sx={{ color: "#fff" }}
                    disabled={loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Box>
                {loading ? (
                  <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress sx={{ color: "#F44336" }} />
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        Recording Status
                      </Typography>
                      <Box display="flex" alignItems="center">
                        {systemStatus?.is_recording ? (
                          <FiberManualRecordIcon sx={{ color: "#F44336", mr: 1 }} />
                        ) : (
                          <CancelIcon sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 1 }} />
                        )}
                        <Typography sx={{ color: "#fff" }}>
                          {systemStatus?.is_recording ? "Recording" : "Not Recording"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        Streaming Status
                      </Typography>
                      <Box display="flex" alignItems="center">
                        {systemStatus?.is_streaming ? (
                          <WifiIcon sx={{ color: "#4CAF50", mr: 1 }} />
                        ) : (
                          <WifiOffIcon sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 1 }} />
                        )}
                        <Typography sx={{ color: "#fff" }}>
                          {systemStatus?.is_streaming ? "Streaming" : "Not Streaming"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        Storage Used
                      </Typography>
                      <Typography sx={{ color: "#fff" }}>
                        {formatStorage(systemStatus?.storage_used || 0)}
                      </Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        Last Backup
                      </Typography>
                      <Typography sx={{ color: "#fff" }}>
                        {systemStatus?.last_backup
                          ? new Date(systemStatus.last_backup).toLocaleString()
                          : "Never"}
                      </Typography>
                    </Box>
                  </Stack>
                )}
                <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
                  System Status
                </Typography>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                      Recording Status
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {systemStatus?.is_recording ? (
                        <CheckCircleIcon sx={{ color: "#4CAF50" }} />
                      ) : (
                        <CancelIcon sx={{ color: "#F44336" }} />
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                      Streaming Status
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {systemStatus?.is_streaming ? (
                        <CheckCircleIcon sx={{ color: "#4CAF50" }} />
                      ) : (
                        <CancelIcon sx={{ color: "#F44336" }} />
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                      Storage Used
                    </Typography>
                    <Typography sx={{ color: "#fff" }}>
                      {formatStorage(systemStatus?.storage_used || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                      Last Backup
                    </Typography>
                    <Typography sx={{ color: "#fff" }}>
                      {systemStatus?.last_backup
                        ? new Date(systemStatus.last_backup).toLocaleString()
                        : "Never"}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
                  Data Management
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setBackupDialogOpen(true)}
                    disabled={loading || backupLoading}
                    sx={{
                      backgroundColor: "#F44336",
                      "&:hover": {
                        backgroundColor: "#D32F2F",
                      },
                    }}
                  >
                    Create Backup
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteAllData}
                    disabled={loading}
                    sx={{
                      color: "#F44336",
                      borderColor: "#F44336",
                      "&:hover": {
                        borderColor: "#D32F2F",
                        backgroundColor: "rgba(244, 67, 54, 0.04)",
                      },
                    }}
                  >
                    Delete All Data
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {renderUploader(
              "Intro Video",
              "intro_video_path",
              previewUrl.intro
            )}
            {renderUploader("Logo", "logo_path", previewUrl.logo)}
            {renderUploader(
              "Sponsor Logo 1",
              "sponsor_logo1_path",
              previewUrl.sponsor_logo1
            )}
            {renderUploader(
              "Sponsor Logo 2",
              "sponsor_logo2_path",
              previewUrl.sponsor_logo2
            )}
            {renderUploader(
              "Sponsor Logo 3",
              "sponsor_logo3_path",
              previewUrl.sponsor_logo3
            )}
          </Grid>
        </Grid>

        <Dialog
          open={backupDialogOpen}
          onClose={() => setBackupDialogOpen(false)}
          PaperProps={{
            sx: {
              background: "#1a1a1a",
              color: "#fff",
            },
          }}
        >
          <DialogTitle>Create Backup</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
              Are you sure you want to create a backup of all your data? This
              may take a few minutes.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setBackupDialogOpen(false)}
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBackup}
              variant="contained"
              disabled={backupLoading}
              sx={{
                backgroundColor: "#F44336",
                "&:hover": {
                  backgroundColor: "#D32F2F",
                },
              }}
            >
              {backupLoading ? "Creating..." : "Create Backup"}
            </Button>
          </DialogActions>
        </Dialog>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {mediaCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.type}>
              <Card
                sx={{
                  background: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 3,
                  minHeight: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: '#fff', mb: 2, textAlign: 'center' }}
                >
                  {card.label}
                </Typography>
                <Box
                  sx={{
                    mb: 2,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 120,
                    justifyContent: 'center',
                  }}
                >
                  {previewUrl[card.previewKey] ? (
                    <CardMedia
                      component={card.isVideo ? 'video' : 'img'}
                      controls={card.isVideo}
                      src={previewUrl[card.previewKey]}
                      sx={{
                        height: 120,
                        width: '100%',
                        maxWidth: 240,
                        objectFit: 'contain',
                        borderRadius: 2,
                        mb: 2,
                        background: '#2a2a2a',
                      }}
                      onError={() =>
                        console.error(`❌ Failed to load preview for: ${card.type}`, previewUrl[card.previewKey])
                      }
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 120,
                        width: '100%',
                        maxWidth: 240,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#222',
                        borderRadius: 2,
                        mb: 2,
                        color: '#888',
                        fontSize: 18,
                      }}
                    >
                      {card.label}
                    </Box>
                  )}
                </Box>
                <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    disabled={loading}
                    sx={{
                      background: '#F44336',
                      color: '#fff',
                      fontWeight: 700,
                      flex: 1,
                      '&:hover': { background: '#d32f2f' },
                    }}
                  >
                    Upload
                    <input
                      type="file"
                      accept={card.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, card.type as MediaType);
                      }}
                      style={{ display: 'none' }}
                    />
                  </Button>
                  {previewUrl[card.previewKey] && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveFile(card.type as MediaType)}
                      disabled={loading}
                      sx={{ flex: 1, color: '#fff', borderColor: '#F44336', '&:hover': { borderColor: '#d32f2f', background: 'rgba(244,67,54,0.08)' } }}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default SettingsPage;

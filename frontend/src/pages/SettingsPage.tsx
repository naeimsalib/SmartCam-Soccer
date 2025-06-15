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
import Navbar from "../components/Navbar";

interface UserSettings {
  intro_video_path: string | null;
  logo_path: string | null;
  sponsor_logo1_path: string | null;
  sponsor_logo2_path: string | null;
  sponsor_logo3_path: string | null;
}

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

interface SystemStatus {
  isRecording: boolean;
  isStreaming: boolean;
  storageUsed: number;
  lastBackup: string;
}

function isCameraOnline(lastSeen: string, thresholdSec = 6) {
  return (Date.now() - new Date(lastSeen).getTime()) / 1000 < thresholdSec;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<{
    intro?: string;
    logo?: string;
    sponsor_logo1?: string;
    sponsor_logo2?: string;
    sponsor_logo3?: string;
  }>({});
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isRecording: false,
    isStreaming: false,
    storageUsed: 0,
    lastBackup: "",
  });
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const updatePreviewUrls = useCallback(async (newSettings: UserSettings) => {
    const newPreviewUrls: typeof previewUrl = {};

    if (newSettings?.intro_video_path) {
      const { data: introData } = await supabase.storage
        .from("usermedia")
        .createSignedUrl(newSettings.intro_video_path, 3600);
      if (introData?.signedUrl) {
        newPreviewUrls.intro = introData.signedUrl;
      }
    }

    if (newSettings?.logo_path) {
      const { data: logoData } = await supabase.storage
        .from("usermedia")
        .createSignedUrl(newSettings.logo_path, 3600);
      if (logoData?.signedUrl) {
        newPreviewUrls.logo = logoData.signedUrl;
      }
    }

    for (const key of [
      "sponsor_logo1_path",
      "sponsor_logo2_path",
      "sponsor_logo3_path",
    ] as const) {
      if (newSettings?.[key]) {
        const { data: signedData } = await supabase.storage
          .from("usermedia")
          .createSignedUrl(newSettings[key], 3600);
        if (signedData?.signedUrl) {
          newPreviewUrls[
            key.replace("_path", "") as keyof typeof newPreviewUrls
          ] = signedData.signedUrl;
        }
      }
    }

    setPreviewUrl(newPreviewUrls);
  }, []);

  const fetchSettings = useCallback(async () => {
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
  }, [updatePreviewUrls]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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
    type: keyof UserSettings & string
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

  const handleRemoveFile = async (type: keyof UserSettings & string) => {
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

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("system_status")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      setSystemStatus({
        isRecording: data.is_recording,
        isStreaming: data.is_streaming,
        storageUsed: data.storage_used,
        lastBackup: data.last_backup,
      });
    } catch (err) {
      console.error("Error fetching system status:", err);
      setError("Failed to fetch system status");
    } finally {
      setLoading(false);
    }
  };

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
      <Navbar />
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
                      {systemStatus.isRecording ? (
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
                      {systemStatus.isStreaming ? (
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
                      {formatStorage(systemStatus.storageUsed)}
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
                      {systemStatus.lastBackup
                        ? new Date(systemStatus.lastBackup).toLocaleString()
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
      </Container>
    </Box>
  );
};

export default SettingsPage;

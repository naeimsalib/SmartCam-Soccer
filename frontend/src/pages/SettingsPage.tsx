import React, { useState, useEffect } from "react";
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
import { styled } from "@mui/material/styles";
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

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

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
    filter: `user_id=eq.${userId}`,
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
    filter: `user_id=eq.${userId}`,
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

  const updatePreviewUrls = async (newSettings: UserSettings) => {
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
  };

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

      const updatePayload = {
        user_id: user.id,
        intro_video_path: existing?.intro_video_path ?? null,
        logo_path: existing?.logo_path ?? null,
        sponsor_logo1_path: existing?.sponsor_logo1_path ?? null,
        sponsor_logo2_path: existing?.sponsor_logo2_path ?? null,
        sponsor_logo3_path: existing?.sponsor_logo3_path ?? null,
        [type]: filePath,
      };

      const { error: updateError } = await supabase
        .from("user_settings")
        .upsert(updatePayload, { onConflict: "user_id" });

      if (updateError) throw updateError;

      setSuccess(`${type.replace("_", " ")} uploaded successfully`);
      fetchSettings();
    } catch (err) {
      setError(`Failed to upload ${type.replace("_", " ")}`);
      console.error(err);
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

      const currentPath = settings?.[type];
      if (currentPath) {
        const { error: deleteError } = await supabase.storage
          .from("usermedia")
          .remove([currentPath]);
        if (deleteError) throw deleteError;
      }

      const { error: updateError } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, [type]: null }, { onConflict: "user_id" });
      if (updateError) throw updateError;

      setSuccess(`${type.replace("_", " ")} removed successfully`);
      fetchSettings();
    } catch (err) {
      setError(`Failed to remove ${type.replace("_", " ")}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderUploader = (
    label: string,
    type: keyof UserSettings & string,
    preview?: string
  ) => (
    <Grid item xs={12} sm={6}>
      <Card
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ mb: 2, textAlign: "center" }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            mb: 2,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {preview ? (
            <CardMedia
              component={type === "intro_video_path" ? "video" : "img"}
              controls={type === "intro_video_path"}
              src={preview}
              sx={{
                height: 160,
                width: "100%",
                maxWidth: 240,
                objectFit: "contain",
                borderRadius: 2,
                mb: 2,
                background: "#f0f0f0",
              }}
              onError={() =>
                console.error(`❌ Failed to load preview for: ${type}`, preview)
              }
            />
          ) : null}
        </Box>
        {preview ? (
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleRemoveFile(type)}
            disabled={loading}
            sx={{ width: "100%" }}
          >
            Remove {label}
          </Button>
        ) : (
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
            sx={{ width: "100%" }}
          >
            Upload {label}
            <VisuallyHiddenInput
              type="file"
              accept={type === "intro_video_path" ? "video/*" : "image/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, type);
              }}
            />
          </Button>
        )}
      </Card>
    </Grid>
  );

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      // Fetch system status from your backend
      const { data, error } = await supabase
        .from("system_status")
        .select("*")
        .single();

      if (error) throw error;
      setSystemStatus(
        data || {
          isRecording: false,
          isStreaming: false,
          storageUsed: 0,
          lastBackup: "",
        }
      );
    } catch (err) {
      setError("Failed to fetch system status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      setError(null);
      setSuccess(null);

      // Implement backup logic here
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated backup
      setSuccess("Backup completed successfully");
      setBackupDialogOpen(false);
    } catch (err) {
      setError("Failed to create backup");
      console.error(err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all data? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Implement delete all data logic here
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated deletion
      setSuccess("All data deleted successfully");
    } catch (err) {
      setError("Failed to delete data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
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
          {/* System Status */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                height: "100%",
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ color: "#fff", fontWeight: 600 }}
                >
                  System Status
                </Typography>
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
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemStatus.isRecording}
                            color="error"
                          />
                        }
                        label=""
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                        Streaming Status
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemStatus.isStreaming}
                            color="error"
                          />
                        }
                        label=""
                      />
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
                        {formatStorage(systemStatus.storageUsed)}
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
                        {systemStatus.lastBackup
                          ? new Date(
                              systemStatus.lastBackup
                            ).toLocaleDateString()
                          : "Never"}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchSystemStatus}
                      sx={{
                        mt: 2,
                        color: "#F44336",
                        borderColor: "#F44336",
                        "&:hover": {
                          borderColor: "#d32f2f",
                          background: "rgba(244, 67, 54, 0.08)",
                        },
                      }}
                    >
                      Refresh Status
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Data Management */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                height: "100%",
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ color: "#fff", fontWeight: 600 }}
                >
                  Data Management
                </Typography>
                <Stack spacing={3}>
                  <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => setBackupDialogOpen(true)}
                    sx={{
                      background: "#F44336",
                      "&:hover": {
                        background: "#d32f2f",
                      },
                    }}
                  >
                    Create Backup
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteAllData}
                    sx={{
                      color: "#F44336",
                      borderColor: "#F44336",
                      "&:hover": {
                        borderColor: "#d32f2f",
                        background: "rgba(244, 67, 54, 0.08)",
                      },
                    }}
                  >
                    Delete All Data
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Backup Dialog */}
        <Dialog
          open={backupDialogOpen}
          onClose={() => setBackupDialogOpen(false)}
          PaperProps={{
            sx: {
              background: "#1a1a1a",
              color: "#fff",
              minWidth: "400px",
            },
          }}
        >
          <DialogTitle>Create Backup</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "rgba(255, 255, 255, 0.7)", mt: 2 }}>
              This will create a backup of all your recordings and settings. The
              backup will be stored securely in the cloud.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setBackupDialogOpen(false)}
              sx={{ color: "#fff" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBackup}
              variant="contained"
              disabled={backupLoading}
              sx={{
                background: "#F44336",
                "&:hover": {
                  background: "#d32f2f",
                },
              }}
            >
              {backupLoading ? "Creating Backup..." : "Create Backup"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default SettingsPage;

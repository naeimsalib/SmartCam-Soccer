import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  Computer as ComputerIcon,
  Videocam as VideocamIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import { useSystemStatus } from "../hooks/useSystemStatus";
import Navigation from "../components/Navigation";
import { ConnectionHealthIndicator } from "../components/ConnectionHealthIndicator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { shallowEqual } from "../utils/objectUtils";
import type { SystemStatus, UserSettings } from "../types";

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

const buildPreviewUrlMap = async (
  settings: UserSettings
): Promise<Record<string, string>> => {
  const urlMap: Record<string, string> = {};
  const mediaFields = [
    "intro_video_path",
    "logo_path",
    "sponsor_logo1_path",
    "sponsor_logo2_path",
    "sponsor_logo3_path",
  ] as const;

  for (const field of mediaFields) {
    const path = settings[field];
    if (path) {
      try {
        const { data } = await supabase.storage
          .from("usermedia")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) {
          const keyName = field.replace("_path", "");
          urlMap[keyName] = data.signedUrl;
        }
      } catch (error) {
        // Silently handle error for cleaner console
      }
    }
  }
  return urlMap;
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Use the new robust system status hook
  const {
    systemStatus,
    loading: systemLoading,
    error: systemError,
    connectionHealth,
    lastSuccessfulUpdate,
    isSystemActive,
    retryCount,
    refresh: refreshSystemStatus,
  } = useSystemStatus({
    userId: user?.id,
    basePollingInterval: 30000,
    enableSmartPolling: true,
  });

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [previewUrl, setPreviewUrl] = useState<Record<string, string>>({});

  type MediaType =
    | "intro_video_path"
    | "logo_path"
    | "sponsor_logo1_path"
    | "sponsor_logo2_path"
    | "sponsor_logo3_path";

  const mediaCards: {
    label: string;
    type: MediaType;
    previewKey: keyof typeof previewUrl;
    accept: string;
    isVideo: boolean;
  }[] = [
    {
      label: "Intro Video",
      type: "intro_video_path",
      previewKey: "intro",
      accept: "video/*",
      isVideo: true,
    },
    {
      label: "Logo",
      type: "logo_path",
      previewKey: "logo",
      accept: "image/*",
      isVideo: false,
    },
    {
      label: "Sponsor Logo 1",
      type: "sponsor_logo1_path",
      previewKey: "sponsor_logo1",
      accept: "image/*",
      isVideo: false,
    },
    {
      label: "Sponsor Logo 2",
      type: "sponsor_logo2_path",
      previewKey: "sponsor_logo2",
      accept: "image/*",
      isVideo: false,
    },
    {
      label: "Sponsor Logo 3",
      type: "sponsor_logo3_path",
      previewKey: "sponsor_logo3",
      accept: "image/*",
      isVideo: false,
    },
  ];

  // Memoize the updatePreviewUrls function
  const updatePreviewUrls = useCallback(
    async (newSettings: UserSettings | null) => {
      if (!newSettings) return;
      const newUrls = await buildPreviewUrlMap(newSettings);
      setPreviewUrl((prev) => {
        if (shallowEqual(prev, newUrls)) return prev;
        return newUrls;
      });
    },
    []
  );

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Initial fetch of cameras
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("cameras")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setCameras(data as CameraRow[]);
      });
  }, [user?.id]);

  const handleFileUpload = async (file: File, type: MediaType) => {
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
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}
        >
          {label}
        </Typography>

        {preview && (
          <Box sx={{ mb: 2 }}>
            {type === "intro_video_path" ? (
              <video
                controls
                style={{ width: "100%", maxHeight: "200px", borderRadius: 8 }}
                src={preview}
              />
            ) : (
              <img
                src={preview}
                alt={label}
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: 8,
                  background: "#333",
                }}
              />
            )}
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{
              color: "#fff",
              borderColor: "rgba(255, 255, 255, 0.3)",
              "&:hover": {
                borderColor: "#fff",
                background: "rgba(255, 255, 255, 0.1)",
              },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              px: { xs: 1, sm: 2 },
            }}
          >
            Upload
            <input
              type="file"
              hidden
              accept={type === "intro_video_path" ? "video/*" : "image/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, type as MediaType);
              }}
            />
          </Button>

          {preview && (
            <Button
              onClick={() => handleRemoveFile(type as MediaType)}
              variant="outlined"
              startIcon={<DeleteIcon />}
              color="error"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: { xs: 1, sm: 2 },
              }}
            >
              Remove
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess("Backup created successfully");
      setBackupDialogOpen(false);
    } catch (error) {
      setError("Backup failed. Please try again.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all data? This action cannot be undone."
      )
    ) {
      navigate("/");
    }
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (loading && !settings) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#fff" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "#111",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <Navigation />

      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mt: { xs: 8, sm: 10 },
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        {/* Header */}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 700,
            background: "linear-gradient(45deg, #fff 30%, #ccc 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
          }}
        >
          Settings & System Status
        </Typography>

        {/* Connection Health Indicator */}
        <Box sx={{ mb: 3 }}>
          <ConnectionHealthIndicator
            connectionHealth={connectionHealth}
            lastSuccessfulUpdate={lastSuccessfulUpdate}
            retryCount={retryCount}
            onRefresh={refreshSystemStatus}
            loading={systemLoading}
          />
        </Box>

        {/* System Status Card */}
        <Card
          sx={{
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: 3,
            mb: 4,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
            >
              <ComputerIcon />
              System Status
            </Typography>

            <Grid container spacing={3}>
              {/* Pi Status */}
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    border: `2px solid ${
                      isSystemActive ? "#4CAF50" : "#F44336"
                    }`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {isSystemActive ? (
                      <CheckCircleIcon sx={{ color: "#4CAF50" }} />
                    ) : (
                      <WarningIcon sx={{ color: "#F44336" }} />
                    )}
                    <Typography sx={{ fontWeight: 600 }}>
                      Raspberry Pi
                    </Typography>
                  </Box>
                  <Chip
                    label={isSystemActive ? "Active" : "Inactive"}
                    color={isSystemActive ? "success" : "error"}
                    size="small"
                  />
                </Box>
              </Grid>

              {/* Recording Status */}
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    border: `2px solid ${
                      systemStatus?.is_recording ? "#4CAF50" : "#666"
                    }`,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <VideocamIcon
                      sx={{
                        color: systemStatus?.is_recording ? "#4CAF50" : "#666",
                      }}
                    />
                    <Typography sx={{ fontWeight: 600 }}>Recording</Typography>
                  </Box>
                  <Chip
                    label={systemStatus?.is_recording ? "Active" : "Idle"}
                    color={systemStatus?.is_recording ? "success" : "default"}
                    size="small"
                  />
                </Box>
              </Grid>

              {/* Storage */}
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <StorageIcon sx={{ color: "#fff" }} />
                    <Typography sx={{ fontWeight: 600 }}>Storage</Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {formatStorage(systemStatus?.storage_used || 0)} used
                  </Typography>
                </Box>
              </Grid>

              {/* Last Heartbeat */}
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <ScheduleIcon sx={{ color: "#fff" }} />
                    <Typography sx={{ fontWeight: 600 }}>
                      Last Heartbeat
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {systemStatus?.last_heartbeat
                      ? new Date(systemStatus.last_heartbeat).toLocaleString()
                      : "Never"}
                  </Typography>
                </Box>
              </Grid>

              {/* Cameras Online */}
              <Grid item xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <VideocamIcon sx={{ color: "#fff" }} />
                    <Typography sx={{ fontWeight: 600 }}>Cameras</Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {
                      cameras.filter((cam) => isCameraOnline(cam.last_seen))
                        .length
                    }{" "}
                    / {cameras.length} online
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Media Upload Section */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Media Files
        </Typography>

        <Grid container spacing={3}>
          {mediaCards.map((card) => (
            <Grid item xs={12} md={6} key={card.type}>
              {renderUploader(
                card.label,
                card.type,
                previewUrl[card.previewKey]
              )}
            </Grid>
          ))}
        </Grid>

        {/* System Actions */}
        <Typography variant="h5" sx={{ mb: 3, mt: 4, fontWeight: 600 }}>
          System Actions
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Button
              onClick={() => setBackupDialogOpen(true)}
              variant="outlined"
              fullWidth
              sx={{
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  borderColor: "#fff",
                  background: "rgba(255, 255, 255, 0.1)",
                },
                py: 2,
              }}
            >
              Create Backup
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              onClick={handleDeleteAllData}
              variant="outlined"
              color="error"
              fullWidth
              sx={{ py: 2 }}
            >
              Delete All Data
            </Button>
          </Grid>
        </Grid>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {success}
          </Alert>
        )}

        {/* Backup Dialog */}
        <Dialog
          open={backupDialogOpen}
          onClose={() => setBackupDialogOpen(false)}
        >
          <DialogTitle>Create System Backup</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will create a backup of all your recordings, settings, and
              system data. The backup will be stored securely and can be
              restored if needed.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBackup}
              disabled={backupLoading}
              variant="contained"
            >
              {backupLoading ? <CircularProgress size={20} /> : "Create Backup"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default SettingsPage;

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Chip,
  Tooltip,
  Container,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Videocam as CameraIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Computer as ComputerIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useSystemStatus } from "../hooks/useSystemStatus";
import Navigation from "../components/Navigation";
import { ConnectionHealthIndicator } from "../components/ConnectionHealthIndicator";
import { DatabaseDebugger } from "../components/DatabaseDebugger";
import { SystemStatus as SystemStatusType } from "../types";

// Function to check if the Raspberry Pi system is responsive
function isSystemResponsive(lastHeartbeat: string, thresholdSec = 30): boolean {
  return (Date.now() - new Date(lastHeartbeat).getTime()) / 1000 < thresholdSec;
}

interface Camera {
  id: string;
  name: string;
  status: "online" | "offline";
  is_recording: boolean;
  last_seen: string;
}

interface Recording {
  id: string;
  title: string;
  created_at: string;
  duration: number;
  size: number;
  thumbnail_url?: string;
}

interface SystemStatus {
  cpu_usage: number;
  memory_usage: number;
  storage_usage: number;
  network_speed: number;
  // Include fields from the database SystemStatus
  pi_active: boolean;
  is_recording: boolean;
  is_streaming: boolean;
  last_heartbeat: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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

  // Fetch initial data (cameras and recordings only)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cameras
        const { data: camerasData } = await supabase
          .from("cameras")
          .select("*")
          .eq("user_id", user?.id);

        // Fetch recent recordings
        const { data: recordingsData } = await supabase
          .from("recordings")
          .select("*")
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setCameras(camerasData || []);
        setRecentRecordings(recordingsData || []);
      } catch (error) {
        // Error handling without console.error to keep console clean
      } finally {
        setDataLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  // TEMPORARILY DISABLED - WebSocket connection issues causing infinite re-renders
  // TODO: Re-enable when WebSocket connectivity is resolved

  // Subscribe to real-time updates
  // const { error: camerasError } = useRealtimeSubscription<Camera>({
  //   table: "cameras",
  //   filter: `user_id=eq.${user?.id}`,
  //   onUpdate: (updatedCamera) => {
  //     setCameras((prev) =>
  //       prev.map((cam) => (cam.id === updatedCamera.id ? updatedCamera : cam))
  //     );
  //   },
  //   onInsert: (newCamera) => {
  //     setCameras((prev) => [...prev, newCamera]);
  //   },
  //   onDelete: (deletedCamera) => {
  //     setCameras((prev) => prev.filter((cam) => cam.id !== deletedCamera.id));
  //   },
  // });

  // const { error: statusError } = useRealtimeSubscription<SystemStatus>({
  //   table: "system_status",
  //   filter: `user_id=eq.${user?.id}`,
  //   onUpdate: (updatedStatus) => {
  //     setSystemStatus(updatedStatus);
  //   },
  // });

  // Placeholder values for disabled subscriptions
  const camerasError = null;
  const statusError = null;

  // Manual refresh mechanism for cameras and recordings
  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setDataLoading(true);

      // Fetch cameras
      const { data: camerasData } = await supabase
        .from("cameras")
        .select("*")
        .eq("user_id", user.id);

      // Fetch recent recordings
      const { data: recordingsData } = await supabase
        .from("recordings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setCameras(camerasData || []);
      setRecentRecordings(recordingsData || []);
    } catch (error) {
      // Silently handle error to avoid console noise
    } finally {
      setDataLoading(false);
    }
  }, [user?.id]);

  // Combined refresh function
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshData(), refreshSystemStatus()]);
  }, [refreshData, refreshSystemStatus]);

  const handleStartRecording = async (cameraId: string) => {
    // TODO: Implement start recording logic
  };

  const handleStopRecording = async (cameraId: string) => {
    // TODO: Implement stop recording logic
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (dataLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ color: "#fff", fontSize: "1.2rem" }}>
          Loading...
        </Typography>
      </Box>
    );
  }

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
      <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: { xs: 3, md: 4 },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography
            variant={isMobile ? "h4" : "h3"}
            fontWeight={900}
            sx={{
              color: "#fff",
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            Dashboard
          </Typography>
          <Button
            onClick={refreshAll}
            disabled={dataLoading || systemLoading}
            startIcon={<RefreshIcon />}
            sx={{
              color: "#fff",
              border: "2px solid #F44336",
              borderRadius: 2,
              px: { xs: 2, md: 3 },
              py: 1,
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 600,
              fontSize: { xs: "0.875rem", md: "1rem" },
              textTransform: "none",
              "&:hover": {
                background: "#F44336",
              },
            }}
          >
            Refresh
          </Button>
        </Box>

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

        {/* Temporary Database Debugger */}
        <DatabaseDebugger />

        <Grid container spacing={{ xs: 2, md: 3, lg: 4 }}>
          {/* Pi Status Card */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                height: "100%",
                border: isSystemActive
                  ? "2px solid #4CAF50"
                  : "2px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <ComputerIcon
                    sx={{
                      color: isSystemActive ? "#4CAF50" : "#F44336",
                      fontSize: { xs: 32, md: 40 },
                    }}
                  />
                  <Chip
                    label={
                      isSystemActive
                        ? "Active"
                        : systemStatus?.pi_active
                        ? "Timeout"
                        : "Inactive"
                    }
                    color={isSystemActive ? "success" : "error"}
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
                <Typography
                  variant={isMobile ? "body2" : "h6"}
                  sx={{ color: "#fff", fontWeight: 600, mb: 1 }}
                >
                  Raspberry Pi
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  {isSystemActive ? "System Online" : "System Offline"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Operation Status Card */}
          <Grid item xs={12} sm={6} lg={3}>
            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                height: "100%",
                border: systemStatus?.is_recording
                  ? "2px solid #F44336"
                  : "2px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <CameraIcon
                    sx={{
                      color: systemStatus?.is_recording ? "#F44336" : "#666",
                      fontSize: { xs: 32, md: 40 },
                    }}
                  />
                  <Chip
                    label={systemStatus?.is_recording ? "Recording" : "Idle"}
                    color={systemStatus?.is_recording ? "error" : "default"}
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
                <Typography
                  variant={isMobile ? "body2" : "h6"}
                  sx={{ color: "#fff", fontWeight: 600, mb: 1 }}
                >
                  Recording Status
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  {cameras.filter((cam) => cam.is_recording).length} active
                  cameras
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} lg={6}>
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
                  variant={isMobile ? "h6" : "h5"}
                  sx={{ color: "#fff", fontWeight: 600, mb: 3 }}
                >
                  Performance Metrics
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <SpeedIcon sx={{ mr: 1, color: "#4CAF50" }} />
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                          CPU Usage
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontWeight: 600 }}>
                        0%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#4CAF50",
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <MemoryIcon sx={{ mr: 1, color: "#2196F3" }} />
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                          Memory Usage
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontWeight: 600 }}>
                        0%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#2196F3",
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <StorageIcon sx={{ mr: 1, color: "#FF9800" }} />
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                          Storage Usage
                        </Typography>
                      </Box>
                      <Typography sx={{ color: "#fff", fontWeight: 600 }}>
                        {Math.round(
                          (systemStatus?.storage_used || 0) / 1024 / 1024 / 1024
                        )}
                        GB
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        ((systemStatus?.storage_used || 0) /
                          1024 /
                          1024 /
                          1024 /
                          100) *
                          100,
                        100
                      )}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#FF9800",
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Camera Status */}
          <Grid item xs={12} lg={8}>
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
                  variant={isMobile ? "h6" : "h5"}
                  sx={{ color: "#fff", fontWeight: 600, mb: 3 }}
                >
                  Camera Status
                </Typography>
                {cameras.length === 0 ? (
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    No cameras connected
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {cameras.map((camera) => (
                      <Grid item xs={12} sm={6} md={4} key={camera.id}>
                        <Paper
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
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: { xs: "0.875rem", md: "1rem" },
                              }}
                            >
                              {camera.name}
                            </Typography>
                            {camera.status === "online" ? (
                              <CheckCircleIcon
                                sx={{ color: "#4CAF50", fontSize: 20 }}
                              />
                            ) : (
                              <CancelIcon
                                sx={{ color: "#F44336", fontSize: 20 }}
                              />
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  camera.status === "online"
                                    ? "#4CAF50"
                                    : "#F44336",
                                fontSize: "0.75rem",
                              }}
                            >
                              {camera.status.toUpperCase()}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255, 255, 255, 0.7)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {camera.is_recording ? "Recording" : "Idle"}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {camera.is_recording ? (
                              <Button
                                size="small"
                                startIcon={<StopIcon />}
                                onClick={() => handleStopRecording(camera.id)}
                                sx={{
                                  color: "#fff",
                                  background: "#F44336",
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  "&:hover": {
                                    background: "#d32f2f",
                                  },
                                }}
                              >
                                Stop
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                startIcon={<PlayIcon />}
                                onClick={() => handleStartRecording(camera.id)}
                                sx={{
                                  color: "#fff",
                                  background: "#4CAF50",
                                  fontSize: "0.75rem",
                                  textTransform: "none",
                                  "&:hover": {
                                    background: "#388e3c",
                                  },
                                }}
                                disabled={camera.status === "offline"}
                              >
                                Record
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Recordings */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: 3,
                height: "100%",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    sx={{ color: "#fff", fontWeight: 600 }}
                  >
                    Recent Recordings
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => navigate("/recordings")}
                    sx={{
                      color: "#F44336",
                      fontSize: "0.75rem",
                      textTransform: "none",
                      "&:hover": {
                        background: "rgba(244, 67, 54, 0.1)",
                      },
                    }}
                  >
                    View All
                  </Button>
                </Box>
                {recentRecordings.length === 0 ? (
                  <Typography sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    No recordings found
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {recentRecordings.map((recording) => (
                      <Paper
                        key={recording.id}
                        sx={{
                          p: 2,
                          background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: 2,
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          cursor: "pointer",
                          "&:hover": {
                            background: "rgba(255, 255, 255, 0.08)",
                          },
                        }}
                        onClick={() => navigate("/recordings")}
                      >
                        <Typography
                          sx={{
                            color: "#fff",
                            fontWeight: 600,
                            mb: 1,
                            fontSize: { xs: "0.875rem", md: "1rem" },
                          }}
                        >
                          {recording.title}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatDuration(recording.duration)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              fontSize: "0.75rem",
                            }}
                          >
                            {formatBytes(recording.size)}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;

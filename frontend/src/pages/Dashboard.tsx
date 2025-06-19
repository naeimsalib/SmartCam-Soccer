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
import Navigation from "../components/Navigation";
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
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
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

        // Fetch system status
        const { data: statusData } = await supabase
          .from("system_status")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        setCameras(camerasData || []);
        setRecentRecordings(recordingsData || []);
        setSystemStatus(statusData);
      } catch (error) {
        // Error handling without console.error to keep console clean
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Compute actual system active status (combines database flag + heartbeat check)
  const isSystemActive =
    systemStatus?.pi_active &&
    systemStatus?.last_heartbeat &&
    isSystemResponsive(systemStatus.last_heartbeat);

  // Auto-update database when system becomes unresponsive
  useEffect(() => {
    const updateSystemStatus = async () => {
      if (
        systemStatus?.pi_active &&
        systemStatus?.last_heartbeat &&
        !isSystemResponsive(systemStatus.last_heartbeat)
      ) {
        try {
          await supabase
            .from("system_status")
            .update({ pi_active: false })
            .eq("user_id", user?.id);
        } catch (error) {
          // Silently handle error to avoid console noise
        }
      }
    };

    updateSystemStatus();
  }, [systemStatus?.pi_active, systemStatus?.last_heartbeat, user?.id]);

  // Manual refresh mechanism (since realtime is disabled)
  const refreshData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

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

      // Fetch system status
      const { data: statusData } = await supabase
        .from("system_status")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setCameras(camerasData || []);
      setRecentRecordings(recordingsData || []);
      setSystemStatus(statusData);
    } catch (error) {
      // Silently handle error to avoid console noise
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Auto-refresh every 30 seconds (since realtime is disabled)
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, refreshData]);

  const handleStartRecording = async (cameraId: string) => {
    try {
      await supabase
        .from("cameras")
        .update({ is_recording: true })
        .eq("id", cameraId);
    } catch (error) {
      // Error handling without console output
    }
  };

  const handleStopRecording = async (cameraId: string) => {
    try {
      await supabase
        .from("cameras")
        .update({ is_recording: false })
        .eq("id", cameraId);
    } catch (error) {
      // Error handling without console output
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 900,
            mb: 6,
            color: "text.primary",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          Dashboard
        </Typography>

        {/* System Status */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          System Status
        </Typography>
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                bgcolor: isSystemActive ? "#1b5e20" : "#d32f2f",
                color: "white",
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mb: 2 }}
                >
                  <ComputerIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Raspberry Pi
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      System Status
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {isSystemActive ? (
                    <CheckCircleIcon sx={{ color: "#4caf50" }} />
                  ) : (
                    <CancelIcon sx={{ color: "#f44336" }} />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {isSystemActive ? "Active & Running" : "Inactive"}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  {isSystemActive
                    ? "System is online and operational"
                    : systemStatus?.pi_active
                    ? "System unresponsive (timeout)"
                    : "System is offline or not responding"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Operation Status
                </Typography>
                <Stack spacing={2}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Recording Status
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {systemStatus?.is_recording ? (
                        <CheckCircleIcon
                          sx={{ color: "#4caf50", fontSize: 20 }}
                        />
                      ) : (
                        <CancelIcon sx={{ color: "#f44336", fontSize: 20 }} />
                      )}
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {systemStatus?.is_recording
                          ? "Recording"
                          : "Not Recording"}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Streaming Status
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {systemStatus?.is_streaming ? (
                        <CheckCircleIcon
                          sx={{ color: "#4caf50", fontSize: 20 }}
                        />
                      ) : (
                        <CancelIcon sx={{ color: "#f44336", fontSize: 20 }} />
                      )}
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {systemStatus?.is_streaming
                          ? "Streaming"
                          : "Not Streaming"}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Connected Cameras
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {cameras.filter((cam) => cam.status === "online").length}{" "}
                      of {cameras.length} online
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Performance Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <SpeedIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          CPU Usage
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={systemStatus?.cpu_usage || 0}
                        sx={{ height: 6, borderRadius: 3, mb: 1 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {systemStatus?.cpu_usage || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <MemoryIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Memory Usage
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={systemStatus?.memory_usage || 0}
                        sx={{ height: 6, borderRadius: 3, mb: 1 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {systemStatus?.memory_usage || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <StorageIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Storage Usage
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={systemStatus?.storage_usage || 0}
                        sx={{ height: 6, borderRadius: 3, mb: 1 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {systemStatus?.storage_usage
                          ? `${(systemStatus.storage_usage * 100).toFixed(0)}%`
                          : "0%"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <SpeedIcon color="primary" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          Network Speed
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={systemStatus?.network_speed || 0}
                        sx={{ height: 6, borderRadius: 3, mb: 1 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {systemStatus?.network_speed
                          ? `${systemStatus.network_speed.toFixed(2)} Mbps`
                          : "0 Mbps"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Cameras */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Cameras
        </Typography>
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {loading ? (
            <Grid item xs={12}>
              <Typography>Loading cameras...</Typography>
            </Grid>
          ) : cameras.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No cameras found.</Typography>
            </Grid>
          ) : (
            cameras.map((camera) => (
              <Grid item key={camera.id} xs={12} md={4}>
                <Card sx={{ bgcolor: "background.paper" }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="h6">{camera.name}</Typography>
                      <Chip
                        label={
                          camera.status === "online" ? "Online" : "Offline"
                        }
                        color={camera.status === "online" ? "success" : "error"}
                        size="small"
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Last Seen: {new Date(camera.last_seen).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color={camera.is_recording ? "error" : "primary"}
                        startIcon={
                          camera.is_recording ? <StopIcon /> : <PlayIcon />
                        }
                        onClick={() =>
                          camera.is_recording
                            ? handleStopRecording(camera.id)
                            : handleStartRecording(camera.id)
                        }
                        size="small"
                      >
                        {camera.is_recording
                          ? "Stop Recording"
                          : "Start Recording"}
                      </Button>
                      <IconButton size="small">
                        <RefreshIcon />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Recent Recordings */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Recent Recordings
        </Typography>
        <Grid container spacing={4}>
          {loading ? (
            <Grid item xs={12}>
              <Typography>Loading recordings...</Typography>
            </Grid>
          ) : recentRecordings.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No recent recordings found.</Typography>
            </Grid>
          ) : (
            recentRecordings.map((recording) => (
              <Grid item key={recording.id} xs={12} md={4}>
                <Card sx={{ bgcolor: "background.paper" }}>
                  <CardContent>
                    <Typography variant="h6">{recording.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recorded:{" "}
                      {new Date(recording.created_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {formatDuration(recording.duration)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {formatBytes(recording.size)}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      sx={{ mt: 2 }}
                      size="small"
                    >
                      Download
                    </Button>
                    <IconButton size="small" color="error" sx={{ mt: 2 }}>
                      <DeleteIcon />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;

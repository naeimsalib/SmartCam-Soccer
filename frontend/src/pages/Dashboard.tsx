<<<<<<< HEAD
import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import Navigation from "../components/Navigation";

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
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Subscribe to real-time updates
  const { error: camerasError } = useRealtimeSubscription<Camera>({
    table: "cameras",
    filter: `user_id=eq.${user?.id}`,
    onUpdate: (updatedCamera) => {
      setCameras(prev =>
        prev.map(cam => cam.id === updatedCamera.id ? updatedCamera : cam)
      );
    },
    onInsert: (newCamera) => {
      setCameras(prev => [...prev, newCamera]);
    },
    onDelete: (deletedCamera) => {
      setCameras(prev => prev.filter(cam => cam.id !== deletedCamera.id));
    },
  });

  const { error: statusError } = useRealtimeSubscription<SystemStatus>({
    table: "system_status",
    filter: `user_id=eq.${user?.id}`,
    onUpdate: (updatedStatus) => {
      setSystemStatus(updatedStatus);
    },
  });

  const handleStartRecording = async (cameraId: string) => {
    try {
      await supabase
        .from("cameras")
        .update({ is_recording: true })
        .eq("id", cameraId);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const handleStopRecording = async (cameraId: string) => {
    try {
      await supabase
        .from("cameras")
        .update({ is_recording: false })
        .eq("id", cameraId);
    } catch (error) {
      console.error("Error stopping recording:", error);
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
=======
import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import Navbar from "../components/Navbar";
import TestComponent from "../components/TestComponent";
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0

  return (
<<<<<<< HEAD
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
=======
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
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
          }}
        >
          Dashboard
        </Typography>

<<<<<<< HEAD
        {/* System Status */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <SpeedIcon color="primary" />
                  <Typography variant="h6">CPU Usage</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={systemStatus?.cpu_usage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {systemStatus?.cpu_usage || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <MemoryIcon color="primary" />
                  <Typography variant="h6">Memory Usage</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={systemStatus?.memory_usage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {systemStatus?.memory_usage || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <StorageIcon color="primary" />
                  <Typography variant="h6">Storage Usage</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={systemStatus?.storage_usage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {systemStatus?.storage_usage || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <SpeedIcon color="primary" />
                  <Typography variant="h6">Network Speed</Typography>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {systemStatus?.network_speed || 0} Mbps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Cameras */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Cameras
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {cameras.map((camera) => (
            <Grid item xs={12} md={4} key={camera.id}>
              <Card sx={{ bgcolor: "background.paper" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <CameraIcon color="primary" />
                    <Typography variant="h6">{camera.name}</Typography>
                    <Chip
                      label={camera.status}
                      color={camera.status === "online" ? "success" : "error"}
                      size="small"
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color={camera.is_recording ? "error" : "primary"}
                      startIcon={camera.is_recording ? <StopIcon /> : <PlayIcon />}
                      onClick={() =>
                        camera.is_recording
                          ? handleStopRecording(camera.id)
                          : handleStartRecording(camera.id)
                      }
                      fullWidth
                    >
                      {camera.is_recording ? "Stop Recording" : "Start Recording"}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Recordings */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Recent Recordings
        </Typography>
        <Grid container spacing={3}>
          {recentRecordings.map((recording) => (
            <Grid item xs={12} md={4} key={recording.id}>
              <Card sx={{ bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {recording.title}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration: {formatDuration(recording.duration)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {formatBytes(recording.size)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => navigate(`/recordings/${recording.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
=======
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <TestComponent />
          </Grid>
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;

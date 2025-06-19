import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Grid, Card, CardContent, Button, IconButton, LinearProgress, Stack, Chip, Container, } from "@mui/material";
import { PlayArrow as PlayIcon, Stop as StopIcon, Refresh as RefreshIcon, CloudDownload as DownloadIcon, Delete as DeleteIcon, Storage as StorageIcon, Speed as SpeedIcon, Memory as MemoryIcon, Computer as ComputerIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import Navigation from "../components/Navigation";
// Function to check if the Raspberry Pi system is responsive
function isSystemResponsive(lastHeartbeat, thresholdSec = 30) {
    return (Date.now() - new Date(lastHeartbeat).getTime()) / 1000 < thresholdSec;
}
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cameras, setCameras] = useState([]);
    const [recentRecordings, setRecentRecordings] = useState([]);
    const [systemStatus, setSystemStatus] = useState(null);
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
            }
            catch (error) {
                // Error handling without console.error to keep console clean
            }
            finally {
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
    const isSystemActive = systemStatus?.pi_active &&
        systemStatus?.last_heartbeat &&
        isSystemResponsive(systemStatus.last_heartbeat);
    // Auto-update database when system becomes unresponsive
    useEffect(() => {
        const updateSystemStatus = async () => {
            if (systemStatus?.pi_active &&
                systemStatus?.last_heartbeat &&
                !isSystemResponsive(systemStatus.last_heartbeat)) {
                try {
                    await supabase
                        .from("system_status")
                        .update({ pi_active: false })
                        .eq("user_id", user?.id);
                }
                catch (error) {
                    // Silently handle error to avoid console noise
                }
            }
        };
        updateSystemStatus();
    }, [systemStatus?.pi_active, systemStatus?.last_heartbeat, user?.id]);
    // Manual refresh mechanism (since realtime is disabled)
    const refreshData = useCallback(async () => {
        if (!user?.id)
            return;
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
        }
        catch (error) {
            // Silently handle error to avoid console noise
        }
        finally {
            setLoading(false);
        }
    }, [user?.id]);
    // Auto-refresh every 30 seconds (since realtime is disabled)
    useEffect(() => {
        if (!user?.id)
            return;
        const interval = setInterval(() => {
            refreshData();
        }, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [user?.id, refreshData]);
    const handleStartRecording = async (cameraId) => {
        try {
            await supabase
                .from("cameras")
                .update({ is_recording: true })
                .eq("id", cameraId);
        }
        catch (error) {
            // Error handling without console output
        }
    };
    const handleStopRecording = async (cameraId) => {
        try {
            await supabase
                .from("cameras")
                .update({ is_recording: false })
                .eq("id", cameraId);
        }
        catch (error) {
            // Error handling without console output
        }
    };
    const formatBytes = (bytes) => {
        if (bytes === 0)
            return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    };
    return (_jsxs(Box, { sx: { minHeight: "100vh", bgcolor: "background.default" }, children: [_jsx(Navigation, {}), _jsxs(Container, { maxWidth: "lg", sx: { pt: 12, pb: 8 }, children: [_jsx(Typography, { variant: "h2", component: "h1", sx: {
                            fontWeight: 900,
                            mb: 6,
                            color: "text.primary",
                            fontFamily: "Montserrat, sans-serif",
                        }, children: "Dashboard" }), _jsx(Typography, { variant: "h5", sx: { mb: 3, fontWeight: 700 }, children: "System Status" }), _jsxs(Grid, { container: true, spacing: 4, sx: { mb: 4 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: {
                                        bgcolor: isSystemActive ? "#1b5e20" : "#d32f2f",
                                        color: "white",
                                    }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, sx: { mb: 2 }, children: [_jsx(ComputerIcon, { sx: { fontSize: 40 } }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: "Raspberry Pi" }), _jsx(Typography, { variant: "body2", sx: { opacity: 0.8 }, children: "System Status" })] })] }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [isSystemActive ? (_jsx(CheckCircleIcon, { sx: { color: "#4caf50" } })) : (_jsx(CancelIcon, { sx: { color: "#f44336" } })), _jsx(Typography, { variant: "h6", sx: { fontWeight: 600 }, children: isSystemActive ? "Active & Running" : "Inactive" })] }), _jsx(Typography, { variant: "body2", sx: { mt: 1, opacity: 0.8 }, children: isSystemActive
                                                    ? "System is online and operational"
                                                    : systemStatus?.pi_active
                                                        ? "System unresponsive (timeout)"
                                                        : "System is offline or not responding" })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 2, fontWeight: 600 }, children: "Operation Status" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Recording Status" }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [systemStatus?.is_recording ? (_jsx(CheckCircleIcon, { sx: { color: "#4caf50", fontSize: 20 } })) : (_jsx(CancelIcon, { sx: { color: "#f44336", fontSize: 20 } })), _jsx(Typography, { variant: "body1", sx: { fontWeight: 500 }, children: systemStatus?.is_recording
                                                                            ? "Recording"
                                                                            : "Not Recording" })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Streaming Status" }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [systemStatus?.is_streaming ? (_jsx(CheckCircleIcon, { sx: { color: "#4caf50", fontSize: 20 } })) : (_jsx(CancelIcon, { sx: { color: "#f44336", fontSize: 20 } })), _jsx(Typography, { variant: "body1", sx: { fontWeight: 500 }, children: systemStatus?.is_streaming
                                                                            ? "Streaming"
                                                                            : "Not Streaming" })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Connected Cameras" }), _jsxs(Typography, { variant: "body1", sx: { fontWeight: 500 }, children: [cameras.filter((cam) => cam.status === "online").length, " ", "of ", cameras.length, " online"] })] })] })] }) }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 3, fontWeight: 600 }, children: "Performance Metrics" }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 6, md: 3, children: _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(SpeedIcon, { color: "primary", fontSize: "small" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "CPU Usage" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.cpu_usage || 0, sx: { height: 6, borderRadius: 3, mb: 1 } }), _jsxs(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: [systemStatus?.cpu_usage || 0, "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, md: 3, children: _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(MemoryIcon, { color: "primary", fontSize: "small" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Memory Usage" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.memory_usage || 0, sx: { height: 6, borderRadius: 3, mb: 1 } }), _jsxs(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: [systemStatus?.memory_usage || 0, "%"] })] }) }), _jsx(Grid, { item: true, xs: 6, md: 3, children: _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(StorageIcon, { color: "primary", fontSize: "small" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Storage Usage" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.storage_usage || 0, sx: { height: 6, borderRadius: 3, mb: 1 } }), _jsx(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: systemStatus?.storage_usage
                                                                        ? `${(systemStatus.storage_usage * 100).toFixed(0)}%`
                                                                        : "0%" })] }) }), _jsx(Grid, { item: true, xs: 6, md: 3, children: _jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(SpeedIcon, { color: "primary", fontSize: "small" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Network Speed" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.network_speed || 0, sx: { height: 6, borderRadius: 3, mb: 1 } }), _jsx(Typography, { variant: "body2", sx: { fontWeight: 500 }, children: systemStatus?.network_speed
                                                                        ? `${systemStatus.network_speed.toFixed(2)} Mbps`
                                                                        : "0 Mbps" })] }) })] })] }) }) })] }), _jsx(Typography, { variant: "h5", sx: { mb: 3, fontWeight: 700 }, children: "Cameras" }), _jsx(Grid, { container: true, spacing: 4, sx: { mb: 4 }, children: loading ? (_jsx(Grid, { item: true, xs: 12, children: _jsx(Typography, { children: "Loading cameras..." }) })) : cameras.length === 0 ? (_jsx(Grid, { item: true, xs: 12, children: _jsx(Typography, { children: "No cameras found." }) })) : (cameras.map((camera) => (_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", children: [_jsx(Typography, { variant: "h6", children: camera.name }), _jsx(Chip, { label: camera.status === "online" ? "Online" : "Offline", color: camera.status === "online" ? "success" : "error", size: "small" })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: ["Last Seen: ", new Date(camera.last_seen).toLocaleString()] }), _jsxs(Stack, { direction: "row", spacing: 1, sx: { mt: 2 }, children: [_jsx(Button, { variant: "contained", color: camera.is_recording ? "error" : "primary", startIcon: camera.is_recording ? _jsx(StopIcon, {}) : _jsx(PlayIcon, {}), onClick: () => camera.is_recording
                                                        ? handleStopRecording(camera.id)
                                                        : handleStartRecording(camera.id), size: "small", children: camera.is_recording
                                                        ? "Stop Recording"
                                                        : "Start Recording" }), _jsx(IconButton, { size: "small", children: _jsx(RefreshIcon, {}) })] })] }) }) }, camera.id)))) }), _jsx(Typography, { variant: "h5", sx: { mb: 3, fontWeight: 700 }, children: "Recent Recordings" }), _jsx(Grid, { container: true, spacing: 4, children: loading ? (_jsx(Grid, { item: true, xs: 12, children: _jsx(Typography, { children: "Loading recordings..." }) })) : recentRecordings.length === 0 ? (_jsx(Grid, { item: true, xs: 12, children: _jsx(Typography, { children: "No recent recordings found." }) })) : (recentRecordings.map((recording) => (_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", children: recording.title }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Recorded:", " ", new Date(recording.created_at).toLocaleString()] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Duration: ", formatDuration(recording.duration)] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Size: ", formatBytes(recording.size)] }), _jsx(Button, { variant: "outlined", startIcon: _jsx(DownloadIcon, {}), sx: { mt: 2 }, size: "small", children: "Download" }), _jsx(IconButton, { size: "small", color: "error", sx: { mt: 2 }, children: _jsx(DeleteIcon, {}) })] }) }) }, recording.id)))) })] })] }));
};
export default Dashboard;

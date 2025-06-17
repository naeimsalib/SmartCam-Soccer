import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
<<<<<<< HEAD
import { useState, useEffect } from "react";
import { Box, Typography, Grid, Card, CardContent, Button, LinearProgress, Stack, Chip, Container, } from "@mui/material";
import { PlayArrow as PlayIcon, Stop as StopIcon, CloudDownload as DownloadIcon, Delete as DeleteIcon, Videocam as CameraIcon, Storage as StorageIcon, Speed as SpeedIcon, Memory as MemoryIcon, } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import Navigation from "../components/Navigation";
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
                console.error("Error fetching dashboard data:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);
    // Subscribe to real-time updates
    const { error: camerasError } = useRealtimeSubscription({
        table: "cameras",
        filter: `user_id=eq.${user?.id}`,
        onUpdate: (updatedCamera) => {
            setCameras(prev => prev.map(cam => cam.id === updatedCamera.id ? updatedCamera : cam));
        },
        onInsert: (newCamera) => {
            setCameras(prev => [...prev, newCamera]);
        },
        onDelete: (deletedCamera) => {
            setCameras(prev => prev.filter(cam => cam.id !== deletedCamera.id));
        },
    });
    const { error: statusError } = useRealtimeSubscription({
        table: "system_status",
        filter: `user_id=eq.${user?.id}`,
        onUpdate: (updatedStatus) => {
            setSystemStatus(updatedStatus);
        },
    });
    const handleStartRecording = async (cameraId) => {
        try {
            await supabase
                .from("cameras")
                .update({ is_recording: true })
                .eq("id", cameraId);
        }
        catch (error) {
            console.error("Error starting recording:", error);
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
            console.error("Error stopping recording:", error);
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
                        }, children: "Dashboard" }), _jsxs(Grid, { container: true, spacing: 4, sx: { mb: 4 }, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 2 }, children: [_jsx(SpeedIcon, { color: "primary" }), _jsx(Typography, { variant: "h6", children: "CPU Usage" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.cpu_usage || 0, sx: { height: 8, borderRadius: 4 } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: [systemStatus?.cpu_usage || 0, "%"] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 2 }, children: [_jsx(MemoryIcon, { color: "primary" }), _jsx(Typography, { variant: "h6", children: "Memory Usage" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.memory_usage || 0, sx: { height: 8, borderRadius: 4 } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: [systemStatus?.memory_usage || 0, "%"] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 2 }, children: [_jsx(StorageIcon, { color: "primary" }), _jsx(Typography, { variant: "h6", children: "Storage Usage" })] }), _jsx(LinearProgress, { variant: "determinate", value: systemStatus?.storage_usage || 0, sx: { height: 8, borderRadius: 4 } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 1 }, children: [systemStatus?.storage_usage || 0, "%"] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 2 }, children: [_jsx(SpeedIcon, { color: "primary" }), _jsx(Typography, { variant: "h6", children: "Network Speed" })] }), _jsxs(Typography, { variant: "h4", sx: { fontWeight: 700 }, children: [systemStatus?.network_speed || 0, " Mbps"] })] }) }) })] }), _jsx(Typography, { variant: "h5", sx: { mb: 3, fontWeight: 700 }, children: "Cameras" }), _jsx(Grid, { container: true, spacing: 3, sx: { mb: 6 }, children: cameras.map((camera) => (_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 2 }, children: [_jsx(CameraIcon, { color: "primary" }), _jsx(Typography, { variant: "h6", children: camera.name }), _jsx(Chip, { label: camera.status, color: camera.status === "online" ? "success" : "error", size: "small" })] }), _jsx(Stack, { direction: "row", spacing: 1, children: _jsx(Button, { variant: "contained", color: camera.is_recording ? "error" : "primary", startIcon: camera.is_recording ? _jsx(StopIcon, {}) : _jsx(PlayIcon, {}), onClick: () => camera.is_recording
                                                    ? handleStopRecording(camera.id)
                                                    : handleStartRecording(camera.id), fullWidth: true, children: camera.is_recording ? "Stop Recording" : "Start Recording" }) })] }) }) }, camera.id))) }), _jsx(Typography, { variant: "h5", sx: { mb: 3, fontWeight: 700 }, children: "Recent Recordings" }), _jsx(Grid, { container: true, spacing: 3, children: recentRecordings.map((recording) => (_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { sx: { bgcolor: "background.paper" }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", sx: { mb: 1 }, children: recording.title }), _jsxs(Stack, { direction: "row", spacing: 2, sx: { mb: 2 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Duration: ", formatDuration(recording.duration)] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Size: ", formatBytes(recording.size)] })] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(DownloadIcon, {}), onClick: () => navigate(`/recordings/${recording.id}`), children: "View" }), _jsx(Button, { variant: "outlined", color: "error", startIcon: _jsx(DeleteIcon, {}), children: "Delete" })] })] }) }) }, recording.id))) })] })] }));
=======
import { Box, Typography, Container, Grid, } from "@mui/material";
import Navbar from "../components/Navbar";
import TestComponent from "../components/TestComponent";
const Dashboard = () => {
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
        }, children: [_jsx(Navbar, {}), _jsxs(Container, { maxWidth: "lg", sx: { mt: 10 }, children: [_jsx(Typography, { variant: "h3", fontWeight: 900, sx: {
                            color: "#fff",
                            mb: 6,
                            fontFamily: "Montserrat, sans-serif",
                            textAlign: "center",
                        }, children: "Dashboard" }), _jsx(Grid, { container: true, spacing: 4, children: _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TestComponent, {}) }) })] })] }));
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
};
export default Dashboard;

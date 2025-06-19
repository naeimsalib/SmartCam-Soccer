import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Paper, Grid, Card, CardContent, Button, LinearProgress, Stack, Chip, Container, useTheme, useMediaQuery, } from "@mui/material";
import { PlayArrow as PlayIcon, Stop as StopIcon, Refresh as RefreshIcon, Videocam as CameraIcon, Storage as StorageIcon, Speed as SpeedIcon, Memory as MemoryIcon, Computer as ComputerIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useSystemStatus } from "../hooks/useSystemStatus";
import Navigation from "../components/Navigation";
import { ConnectionHealthIndicator } from "../components/ConnectionHealthIndicator";
import { DatabaseDebugger } from "../components/DatabaseDebugger";
// Function to check if the Raspberry Pi system is responsive
function isSystemResponsive(lastHeartbeat, thresholdSec = 30) {
    return (Date.now() - new Date(lastHeartbeat).getTime()) / 1000 < thresholdSec;
}
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
    const [cameras, setCameras] = useState([]);
    const [recentRecordings, setRecentRecordings] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    // Use the new robust system status hook
    const { systemStatus, loading: systemLoading, error: systemError, connectionHealth, lastSuccessfulUpdate, isSystemActive, retryCount, refresh: refreshSystemStatus, } = useSystemStatus({
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
            }
            catch (error) {
                // Error handling without console.error to keep console clean
            }
            finally {
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
        if (!user?.id)
            return;
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
        }
        catch (error) {
            // Silently handle error to avoid console noise
        }
        finally {
            setDataLoading(false);
        }
    }, [user?.id]);
    // Combined refresh function
    const refreshAll = useCallback(async () => {
        await Promise.all([refreshData(), refreshSystemStatus()]);
    }, [refreshData, refreshSystemStatus]);
    const handleStartRecording = async (cameraId) => {
        // TODO: Implement start recording logic
    };
    const handleStopRecording = async (cameraId) => {
        // TODO: Implement stop recording logic
    };
    const formatBytes = (bytes) => {
        if (bytes === 0)
            return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, "0")}:${mins
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };
    if (dataLoading) {
        return (_jsx(Box, { sx: {
                minHeight: "100vh",
                width: "100vw",
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: _jsx(Typography, { sx: { color: "#fff", fontSize: "1.2rem" }, children: "Loading..." }) }));
    }
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
        }, children: [_jsx(Navigation, {}), _jsxs(Container, { maxWidth: "xl", sx: { mt: 4, px: { xs: 2, sm: 3 } }, children: [_jsxs(Box, { sx: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: { xs: 3, md: 4 },
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 2, sm: 0 },
                        }, children: [_jsx(Typography, { variant: isMobile ? "h4" : "h3", fontWeight: 900, sx: {
                                    color: "#fff",
                                    fontFamily: "Montserrat, sans-serif",
                                }, children: "Dashboard" }), _jsx(Button, { onClick: refreshAll, disabled: dataLoading || systemLoading, startIcon: _jsx(RefreshIcon, {}), sx: {
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
                                }, children: "Refresh" })] }), _jsx(Box, { sx: { mb: 3 }, children: _jsx(ConnectionHealthIndicator, { connectionHealth: connectionHealth, lastSuccessfulUpdate: lastSuccessfulUpdate, retryCount: retryCount, onRefresh: refreshSystemStatus, loading: systemLoading }) }), _jsx(DatabaseDebugger, {}), _jsxs(Grid, { container: true, spacing: { xs: 2, md: 3, lg: 4 }, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, lg: 3, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                        border: isSystemActive
                                            ? "2px solid #4CAF50"
                                            : "2px solid rgba(255, 255, 255, 0.1)",
                                    }, children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    mb: 2,
                                                }, children: [_jsx(ComputerIcon, { sx: {
                                                            color: isSystemActive ? "#4CAF50" : "#F44336",
                                                            fontSize: { xs: 32, md: 40 },
                                                        } }), _jsx(Chip, { label: isSystemActive
                                                            ? "Active"
                                                            : systemStatus?.pi_active
                                                                ? "Timeout"
                                                                : "Inactive", color: isSystemActive ? "success" : "error", size: isMobile ? "small" : "medium" })] }), _jsx(Typography, { variant: isMobile ? "body2" : "h6", sx: { color: "#fff", fontWeight: 600, mb: 1 }, children: "Raspberry Pi" }), _jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: isSystemActive ? "System Online" : "System Offline" })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, lg: 3, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                        border: systemStatus?.is_recording
                                            ? "2px solid #F44336"
                                            : "2px solid rgba(255, 255, 255, 0.1)",
                                    }, children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    mb: 2,
                                                }, children: [_jsx(CameraIcon, { sx: {
                                                            color: systemStatus?.is_recording ? "#F44336" : "#666",
                                                            fontSize: { xs: 32, md: 40 },
                                                        } }), _jsx(Chip, { label: systemStatus?.is_recording ? "Recording" : "Idle", color: systemStatus?.is_recording ? "error" : "default", size: isMobile ? "small" : "medium" })] }), _jsx(Typography, { variant: isMobile ? "body2" : "h6", sx: { color: "#fff", fontWeight: 600, mb: 1 }, children: "Recording Status" }), _jsxs(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: [cameras.filter((cam) => cam.is_recording).length, " active cameras"] })] }) }) }), _jsx(Grid, { item: true, xs: 12, lg: 6, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                    }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: isMobile ? "h6" : "h5", sx: { color: "#fff", fontWeight: 600, mb: 3 }, children: "Performance Metrics" }), _jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsxs(Box, { sx: {
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    mb: 1,
                                                                }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [_jsx(SpeedIcon, { sx: { mr: 1, color: "#4CAF50" } }), _jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "CPU Usage" })] }), _jsx(Typography, { sx: { color: "#fff", fontWeight: 600 }, children: "0%" })] }), _jsx(LinearProgress, { variant: "determinate", value: 0, sx: {
                                                                    height: 8,
                                                                    borderRadius: 4,
                                                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                                    "& .MuiLinearProgress-bar": {
                                                                        backgroundColor: "#4CAF50",
                                                                    },
                                                                } })] }), _jsxs(Box, { children: [_jsxs(Box, { sx: {
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    mb: 1,
                                                                }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [_jsx(MemoryIcon, { sx: { mr: 1, color: "#2196F3" } }), _jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Memory Usage" })] }), _jsx(Typography, { sx: { color: "#fff", fontWeight: 600 }, children: "0%" })] }), _jsx(LinearProgress, { variant: "determinate", value: 0, sx: {
                                                                    height: 8,
                                                                    borderRadius: 4,
                                                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                                    "& .MuiLinearProgress-bar": {
                                                                        backgroundColor: "#2196F3",
                                                                    },
                                                                } })] }), _jsxs(Box, { children: [_jsxs(Box, { sx: {
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    mb: 1,
                                                                }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [_jsx(StorageIcon, { sx: { mr: 1, color: "#FF9800" } }), _jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Storage Usage" })] }), _jsxs(Typography, { sx: { color: "#fff", fontWeight: 600 }, children: [Math.round((systemStatus?.storage_used || 0) / 1024 / 1024 / 1024), "GB"] })] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(((systemStatus?.storage_used || 0) /
                                                                    1024 /
                                                                    1024 /
                                                                    1024 /
                                                                    100) *
                                                                    100, 100), sx: {
                                                                    height: 8,
                                                                    borderRadius: 4,
                                                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                                    "& .MuiLinearProgress-bar": {
                                                                        backgroundColor: "#FF9800",
                                                                    },
                                                                } })] })] })] }) }) }), _jsx(Grid, { item: true, xs: 12, lg: 8, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                    }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: isMobile ? "h6" : "h5", sx: { color: "#fff", fontWeight: 600, mb: 3 }, children: "Camera Status" }), cameras.length === 0 ? (_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "No cameras connected" })) : (_jsx(Grid, { container: true, spacing: 2, children: cameras.map((camera) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Paper, { sx: {
                                                            p: 2,
                                                            background: "rgba(255, 255, 255, 0.05)",
                                                            borderRadius: 2,
                                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                                        }, children: [_jsxs(Box, { sx: {
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    mb: 1,
                                                                }, children: [_jsx(Typography, { sx: {
                                                                            color: "#fff",
                                                                            fontWeight: 600,
                                                                            fontSize: { xs: "0.875rem", md: "1rem" },
                                                                        }, children: camera.name }), camera.status === "online" ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50", fontSize: 20 } })) : (_jsx(CancelIcon, { sx: { color: "#F44336", fontSize: 20 } }))] }), _jsxs(Box, { sx: {
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    mb: 2,
                                                                }, children: [_jsx(Typography, { variant: "body2", sx: {
                                                                            color: camera.status === "online"
                                                                                ? "#4CAF50"
                                                                                : "#F44336",
                                                                            fontSize: "0.75rem",
                                                                        }, children: camera.status.toUpperCase() }), _jsx(Typography, { variant: "body2", sx: {
                                                                            color: "rgba(255, 255, 255, 0.7)",
                                                                            fontSize: "0.75rem",
                                                                        }, children: camera.is_recording ? "Recording" : "Idle" })] }), _jsx(Box, { sx: { display: "flex", gap: 1 }, children: camera.is_recording ? (_jsx(Button, { size: "small", startIcon: _jsx(StopIcon, {}), onClick: () => handleStopRecording(camera.id), sx: {
                                                                        color: "#fff",
                                                                        background: "#F44336",
                                                                        fontSize: "0.75rem",
                                                                        textTransform: "none",
                                                                        "&:hover": {
                                                                            background: "#d32f2f",
                                                                        },
                                                                    }, children: "Stop" })) : (_jsx(Button, { size: "small", startIcon: _jsx(PlayIcon, {}), onClick: () => handleStartRecording(camera.id), sx: {
                                                                        color: "#fff",
                                                                        background: "#4CAF50",
                                                                        fontSize: "0.75rem",
                                                                        textTransform: "none",
                                                                        "&:hover": {
                                                                            background: "#388e3c",
                                                                        },
                                                                    }, disabled: camera.status === "offline", children: "Record" })) })] }) }, camera.id))) }))] }) }) }), _jsx(Grid, { item: true, xs: 12, lg: 4, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                    }, children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: {
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    mb: 3,
                                                }, children: [_jsx(Typography, { variant: isMobile ? "h6" : "h5", sx: { color: "#fff", fontWeight: 600 }, children: "Recent Recordings" }), _jsx(Button, { size: "small", onClick: () => navigate("/recordings"), sx: {
                                                            color: "#F44336",
                                                            fontSize: "0.75rem",
                                                            textTransform: "none",
                                                            "&:hover": {
                                                                background: "rgba(244, 67, 54, 0.1)",
                                                            },
                                                        }, children: "View All" })] }), recentRecordings.length === 0 ? (_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "No recordings found" })) : (_jsx(Stack, { spacing: 2, children: recentRecordings.map((recording) => (_jsxs(Paper, { sx: {
                                                        p: 2,
                                                        background: "rgba(255, 255, 255, 0.05)",
                                                        borderRadius: 2,
                                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            background: "rgba(255, 255, 255, 0.08)",
                                                        },
                                                    }, onClick: () => navigate("/recordings"), children: [_jsx(Typography, { sx: {
                                                                color: "#fff",
                                                                fontWeight: 600,
                                                                mb: 1,
                                                                fontSize: { xs: "0.875rem", md: "1rem" },
                                                            }, children: recording.title }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                alignItems: "center",
                                                            }, children: [_jsx(Typography, { variant: "body2", sx: {
                                                                        color: "rgba(255, 255, 255, 0.7)",
                                                                        fontSize: "0.75rem",
                                                                    }, children: formatDuration(recording.duration) }), _jsx(Typography, { variant: "body2", sx: {
                                                                        color: "rgba(255, 255, 255, 0.7)",
                                                                        fontSize: "0.75rem",
                                                                    }, children: formatBytes(recording.size) })] })] }, recording.id))) }))] }) }) })] })] })] }));
};
export default Dashboard;

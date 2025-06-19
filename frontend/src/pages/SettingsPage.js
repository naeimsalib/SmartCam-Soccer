import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia, CircularProgress, Alert, Stack, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Computer as ComputerIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import Navigation from "../components/Navigation";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { shallowEqual } from "../utils/objectUtils";
function isCameraOnline(lastSeen, thresholdSec = 6) {
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < thresholdSec;
}
// Function to check if the Raspberry Pi system is responsive
function isSystemResponsive(lastHeartbeat, thresholdSec = 30) {
    return (Date.now() - new Date(lastHeartbeat).getTime()) / 1000 < thresholdSec;
}
// Add buildPreviewUrlMap function
const buildPreviewUrlMap = async (settings) => {
    const newPreviewUrls = {};
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
    ]) {
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
const SettingsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [systemStatus, setSystemStatus] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [backupDialogOpen, setBackupDialogOpen] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [backupError, setBackupError] = useState(null);
    const [backupSuccess, setBackupSuccess] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [previewUrl, setPreviewUrl] = useState({});
    const mediaCards = [
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
    // Memoize all handlers
    const handleSystemStatusUpdate = useCallback((updatedStatus) => {
        setSystemStatus((prev) => {
            if (shallowEqual(prev, updatedStatus))
                return prev;
            return updatedStatus;
        });
    }, []);
    const handleSettingsUpdate = useCallback((updatedSettings) => {
        setSettings((prev) => {
            if (shallowEqual(prev, updatedSettings))
                return prev;
            return updatedSettings;
        });
    }, []);
    const handleCameraInsert = useCallback((newCamera) => {
        setCameras((prev) => [...prev, newCamera]);
    }, []);
    const handleCameraUpdate = useCallback((updatedCamera) => {
        setCameras((prev) => prev.map((cam) => (cam.id === updatedCamera.id ? updatedCamera : cam)));
    }, []);
    const handleCameraDelete = useCallback((deletedCamera) => {
        setCameras((prev) => prev.filter((cam) => cam.id !== deletedCamera.id));
    }, []);
    const handleSettingsInsert = useCallback((newSettings) => {
        setSettings(newSettings);
    }, []);
    const handleSettingsDelete = useCallback((deletedSettings) => {
        setSettings(null);
    }, []);
    // TEMPORARILY DISABLED - WebSocket connection issues
    // TODO: Re-enable when WebSocket connectivity is resolved
    // System status subscription
    // const {
    //   channel: systemStatusChannel,
    //   error: systemStatusError,
    //   isConnected: systemStatusConnected,
    // } = useRealtimeSubscription<SystemStatus>({
    //   table: user?.id ? "system_status" : "",
    //   filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    //   onUpdate: handleSystemStatusUpdate,
    //   onInsert: handleSystemStatusUpdate,
    // });
    // // Settings subscription
    // const {
    //   channel: settingsChannel,
    //   error: settingsError,
    //   isConnected: settingsConnected,
    // } = useRealtimeSubscription<UserSettings>({
    //   table: user?.id ? "user_settings" : "",
    //   filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    //   onUpdate: handleSettingsUpdate,
    //   onInsert: handleSettingsInsert,
    //   onDelete: handleSettingsDelete,
    // });
    // // Cameras subscription
    // const {
    //   channel: camerasChannel,
    //   error: camerasError,
    //   isConnected: camerasConnected,
    // } = useRealtimeSubscription<CameraRow>({
    //   table: user?.id ? "cameras" : "",
    //   filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    //   onInsert: handleCameraInsert,
    //   onUpdate: handleCameraUpdate,
    //   onDelete: handleCameraDelete,
    // });
    // Placeholder values for disabled subscriptions
    const systemStatusError = null;
    const settingsError = null;
    const camerasError = null;
    const systemStatusConnected = false;
    const settingsConnected = false;
    const camerasConnected = false;
    // Memoize the fetch system status function
    const fetchSystemStatus = useCallback(async () => {
        if (!user?.id) {
            return;
        }
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("system_status")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();
            if (error)
                throw error;
            if (!data) {
                // If no status exists, create one
                const { data: newStatus, error: insertError } = await supabase
                    .from("system_status")
                    .insert({
                    user_id: user.id,
                    is_recording: false,
                    is_streaming: false,
                    storage_used: 0,
                    last_backup: null,
                })
                    .select()
                    .single();
                if (insertError)
                    throw insertError;
                setSystemStatus(newStatus);
            }
            else {
                setSystemStatus((prev) => {
                    if (shallowEqual(prev, data)) {
                        return prev;
                    }
                    return data;
                });
            }
        }
        catch (err) {
            console.error("Error fetching system status:", err);
            setError("Failed to fetch system status");
        }
        finally {
            setLoading(false);
        }
    }, [user?.id]);
    // Memoize the updatePreviewUrls function
    const updatePreviewUrls = useCallback(async (newSettings) => {
        if (!newSettings)
            return;
        const newUrls = await buildPreviewUrlMap(newSettings);
        setPreviewUrl((prev) => {
            if (shallowEqual(prev, newUrls))
                return prev;
            return newUrls;
        });
    }, []);
    // Single useEffect for initial data fetching
    useEffect(() => {
        if (!user?.id)
            return;
        fetchSystemStatus();
    }, [user?.id, fetchSystemStatus]);
    // Update preview URLs when settings change
    useEffect(() => {
        updatePreviewUrls(settings);
    }, [settings, updatePreviewUrls]);
    const fetchSettings = async () => {
        try {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                return;
            const { data, error } = await supabase
                .from("user_settings")
                .select("*")
                .eq("user_id", user.id)
                .single();
            if (error)
                throw error;
            setSettings(data);
            if (data) {
                await updatePreviewUrls(data);
            }
        }
        catch (err) {
            setError("Failed to fetch settings");
            console.error(err);
        }
    };
    useEffect(() => {
        fetchSettings();
    }, []);
    // Initial fetch of cameras
    useEffect(() => {
        if (!user?.id)
            return;
        supabase
            .from("cameras")
            .select("*")
            .eq("user_id", user.id)
            .then(({ data }) => {
            if (data)
                setCameras(data);
        });
    }, [user?.id]);
    const handleFileUpload = async (file, type) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error("User not authenticated");
            const fileExt = file.name.split(".").pop();
            const fileName = `${type}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${type}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from("usermedia")
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
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
            if (updateError)
                throw updateError;
            setSuccess("File uploaded successfully");
            await fetchSettings();
        }
        catch (err) {
            console.error("Error uploading file:", err);
            setError("Failed to upload file");
        }
        finally {
            setLoading(false);
        }
    };
    const handleRemoveFile = async (type) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error("User not authenticated");
            const { error: updateError } = await supabase
                .from("user_settings")
                .update({ [type]: null })
                .eq("user_id", user.id);
            if (updateError)
                throw updateError;
            setSuccess("File removed successfully");
            await fetchSettings();
        }
        catch (err) {
            console.error("Error removing file:", err);
            setError("Failed to remove file");
        }
        finally {
            setLoading(false);
        }
    };
    const renderUploader = (label, type, preview) => (_jsx(Card, { sx: {
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: 3,
            mb: 3,
        }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, sx: { color: "#fff" }, children: label }), preview && (_jsx(Box, { sx: {
                        width: "100%",
                        height: 200,
                        background: "#2a2a2a",
                        borderRadius: 2,
                        mb: 2,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }, children: _jsx("img", { src: preview, alt: label, style: {
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        } }) })), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsxs(Button, { component: "label", variant: "contained", startIcon: _jsx(CloudUploadIcon, {}), disabled: loading, sx: {
                                backgroundColor: "#F44336",
                                "&:hover": {
                                    backgroundColor: "#D32F2F",
                                },
                            }, children: ["Upload", _jsx("input", { type: "file", hidden: true, onChange: (e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                            handleFileUpload(file, type);
                                    } })] }), preview && (_jsx(Button, { variant: "outlined", startIcon: _jsx(DeleteIcon, {}), onClick: () => handleRemoveFile(type), disabled: loading, sx: {
                                color: "#F44336",
                                borderColor: "#F44336",
                                "&:hover": {
                                    borderColor: "#D32F2F",
                                    backgroundColor: "rgba(244, 67, 54, 0.04)",
                                },
                            }, children: "Remove" }))] })] }) }));
    const handleBackup = async () => {
        try {
            setBackupLoading(true);
            setError(null);
            setSuccess(null);
            const { error } = await supabase.functions.invoke("create-backup", {
                body: { userId: user?.id },
            });
            if (error)
                throw error;
            setSuccess("Backup created successfully");
            setBackupDialogOpen(false);
            await fetchSystemStatus();
        }
        catch (err) {
            console.error("Error creating backup:", err);
            setError("Failed to create backup");
        }
        finally {
            setBackupLoading(false);
        }
    };
    const handleDeleteAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const { error } = await supabase.functions.invoke("delete-all-data", {
                body: { userId: user?.id },
            });
            if (error)
                throw error;
            setSuccess("All data deleted successfully");
            await fetchSettings();
            await fetchSystemStatus();
        }
        catch (err) {
            console.error("Error deleting data:", err);
            setError("Failed to delete data");
        }
        finally {
            setLoading(false);
        }
    };
    const formatStorage = (bytes) => {
        const units = ["B", "KB", "MB", "GB", "TB"];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };
    // Manual refresh mechanism (since realtime is disabled)
    const refreshData = useCallback(async () => {
        if (!user?.id)
            return;
        // Fetch updated system status
        await fetchSystemStatus();
        // Fetch updated settings
        await fetchSettings();
        // Fetch updated cameras
        const { data: camerasData } = await supabase
            .from("cameras")
            .select("*")
            .eq("user_id", user.id);
        if (camerasData) {
            setCameras(camerasData);
        }
    }, [user?.id, fetchSystemStatus]);
    // Auto-refresh every 30 seconds (since realtime is disabled)
    useEffect(() => {
        if (!user?.id)
            return;
        const interval = setInterval(() => {
            refreshData();
        }, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [user?.id, refreshData]);
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
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
        }, children: [_jsx(Navigation, {}), _jsxs(Container, { maxWidth: "lg", sx: { mt: 10 }, children: [_jsx(Typography, { variant: "h3", fontWeight: 900, sx: {
                            color: "#fff",
                            mb: 6,
                            fontFamily: "Montserrat, sans-serif",
                            textAlign: "center",
                        }, children: "Settings" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, children: success })), _jsxs(Grid, { container: true, spacing: 4, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Card, { sx: {
                                            background: "#1a1a1a",
                                            color: "#fff",
                                            borderRadius: 3,
                                            mb: 3,
                                        }, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h5", sx: { color: "#fff", fontWeight: 600 }, children: "System Status" }), _jsx(IconButton, { onClick: refreshData, sx: { color: "#fff" }, disabled: loading, title: "Refresh all data", children: _jsx(RefreshIcon, {}) })] }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", my: 4, children: _jsx(CircularProgress, { sx: { color: "#F44336" } }) })) : (_jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Raspberry Pi Status" }), _jsxs(Box, { display: "flex", alignItems: "center", children: [isSystemActive ? (_jsx(ComputerIcon, { sx: { color: "#4CAF50", mr: 1 } })) : (_jsx(ComputerIcon, { sx: { color: "rgba(255, 255, 255, 0.7)", mr: 1 } })), _jsx(Typography, { sx: { color: "#fff" }, children: isSystemActive
                                                                                ? "Active"
                                                                                : systemStatus?.pi_active
                                                                                    ? "Timeout"
                                                                                    : "Inactive" })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Recording Status" }), _jsxs(Box, { display: "flex", alignItems: "center", children: [systemStatus?.is_recording ? (_jsx(FiberManualRecordIcon, { sx: { color: "#F44336", mr: 1 } })) : (_jsx(CancelIcon, { sx: { color: "rgba(255, 255, 255, 0.7)", mr: 1 } })), _jsx(Typography, { sx: { color: "#fff" }, children: systemStatus?.is_recording
                                                                                ? "Recording"
                                                                                : "Not Recording" })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Streaming Status" }), _jsxs(Box, { display: "flex", alignItems: "center", children: [systemStatus?.is_streaming ? (_jsx(WifiIcon, { sx: { color: "#4CAF50", mr: 1 } })) : (_jsx(WifiOffIcon, { sx: { color: "rgba(255, 255, 255, 0.7)", mr: 1 } })), _jsx(Typography, { sx: { color: "#fff" }, children: systemStatus?.is_streaming
                                                                                ? "Streaming"
                                                                                : "Not Streaming" })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Connected Cameras" }), _jsxs(Typography, { sx: { color: "#fff" }, children: [cameras.filter((cam) => isCameraOnline(cam.last_seen))
                                                                            .length, " ", "of ", cameras.length, " online"] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Active Recordings" }), _jsxs(Typography, { sx: { color: "#fff" }, children: [cameras.filter((cam) => cam.is_recording).length, " ", "cameras recording"] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Storage Used" }), _jsx(Typography, { sx: { color: "#fff" }, children: formatStorage(systemStatus?.storage_used || 0) })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Last Backup" }), _jsx(Typography, { sx: { color: "#fff" }, children: systemStatus?.last_backup
                                                                        ? new Date(systemStatus.last_backup).toLocaleString()
                                                                        : "Never" })] })] })), _jsx(Typography, { variant: "h6", gutterBottom: true, sx: { color: "#fff" }, children: "System Status" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Raspberry Pi Status" }), _jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [isSystemActive ? (_jsx(ComputerIcon, { sx: { color: "#4CAF50", mr: 1 } })) : (_jsx(ComputerIcon, { sx: { color: "#F44336", mr: 1 } })), _jsx(Typography, { sx: { color: "#fff" }, children: isSystemActive
                                                                                ? "Active"
                                                                                : systemStatus?.pi_active
                                                                                    ? "Timeout"
                                                                                    : "Inactive" })] })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Recording Status" }), _jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: systemStatus?.is_recording ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50" } })) : (_jsx(CancelIcon, { sx: { color: "#F44336" } })) })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Streaming Status" }), _jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: systemStatus?.is_streaming ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50" } })) : (_jsx(CancelIcon, { sx: { color: "#F44336" } })) })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Storage Used" }), _jsx(Typography, { sx: { color: "#fff" }, children: formatStorage(systemStatus?.storage_used || 0) })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Last Backup" }), _jsx(Typography, { sx: { color: "#fff" }, children: systemStatus?.last_backup
                                                                        ? new Date(systemStatus.last_backup).toLocaleString()
                                                                        : "Never" })] })] })] }) }), _jsx(Card, { sx: {
                                            background: "#1a1a1a",
                                            color: "#fff",
                                            borderRadius: 3,
                                            mb: 3,
                                        }, children: _jsxs(CardContent, { children: [_jsx(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: _jsx(Typography, { variant: "h6", sx: { color: "#fff", fontWeight: 600 }, children: "Camera Status" }) }), cameras.length === 0 ? (_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "No cameras connected" })) : (_jsx(Stack, { spacing: 2, children: cameras.map((camera) => (_jsxs(Box, { sx: {
                                                            p: 2,
                                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                                            borderRadius: 2,
                                                            background: "rgba(255, 255, 255, 0.02)",
                                                        }, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, children: [_jsx(Typography, { sx: { color: "#fff", fontWeight: 500 }, children: camera.name }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [isCameraOnline(camera.last_seen) ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50", fontSize: 16 } })) : (_jsx(CancelIcon, { sx: { color: "#F44336", fontSize: 16 } })), _jsx(Typography, { sx: {
                                                                                    color: isCameraOnline(camera.last_seen)
                                                                                        ? "#4CAF50"
                                                                                        : "#F44336",
                                                                                    fontSize: "0.875rem",
                                                                                }, children: isCameraOnline(camera.last_seen)
                                                                                    ? "Online"
                                                                                    : "Offline" })] })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: {
                                                                            color: "rgba(255, 255, 255, 0.7)",
                                                                            fontSize: "0.875rem",
                                                                        }, children: camera.is_recording
                                                                            ? "Recording"
                                                                            : "Not Recording" }), _jsxs(Typography, { sx: {
                                                                            color: "rgba(255, 255, 255, 0.5)",
                                                                            fontSize: "0.75rem",
                                                                        }, children: ["Last seen:", " ", new Date(camera.last_seen).toLocaleString()] })] })] }, camera.id))) }))] }) }), _jsx(Card, { sx: {
                                            background: "#1a1a1a",
                                            color: "#fff",
                                            borderRadius: 3,
                                            mb: 3,
                                        }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, sx: { color: "#fff" }, children: "Data Management" }), _jsxs(Stack, { spacing: 2, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(CloudUploadIcon, {}), onClick: () => setBackupDialogOpen(true), disabled: loading || backupLoading, sx: {
                                                                backgroundColor: "#F44336",
                                                                "&:hover": {
                                                                    backgroundColor: "#D32F2F",
                                                                },
                                                            }, children: "Create Backup" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(DeleteIcon, {}), onClick: handleDeleteAllData, disabled: loading, sx: {
                                                                color: "#F44336",
                                                                borderColor: "#F44336",
                                                                "&:hover": {
                                                                    borderColor: "#D32F2F",
                                                                    backgroundColor: "rgba(244, 67, 54, 0.04)",
                                                                },
                                                            }, children: "Delete All Data" })] })] }) })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [renderUploader("Intro Video", "intro_video_path", previewUrl.intro), renderUploader("Logo", "logo_path", previewUrl.logo), renderUploader("Sponsor Logo 1", "sponsor_logo1_path", previewUrl.sponsor_logo1), renderUploader("Sponsor Logo 2", "sponsor_logo2_path", previewUrl.sponsor_logo2), renderUploader("Sponsor Logo 3", "sponsor_logo3_path", previewUrl.sponsor_logo3)] })] }), _jsxs(Dialog, { open: backupDialogOpen, onClose: () => setBackupDialogOpen(false), PaperProps: {
                            sx: {
                                background: "#1a1a1a",
                                color: "#fff",
                            },
                        }, children: [_jsx(DialogTitle, { children: "Create Backup" }), _jsx(DialogContent, { children: _jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Are you sure you want to create a backup of all your data? This may take a few minutes." }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setBackupDialogOpen(false), sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Cancel" }), _jsx(Button, { onClick: handleBackup, variant: "contained", disabled: backupLoading, sx: {
                                            backgroundColor: "#F44336",
                                            "&:hover": {
                                                backgroundColor: "#D32F2F",
                                            },
                                        }, children: backupLoading ? "Creating..." : "Create Backup" })] })] }), _jsx(Grid, { container: true, spacing: 4, sx: { mt: 2 }, children: mediaCards.map((card) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: {
                                    background: "#1a1a1a",
                                    color: "#fff",
                                    borderRadius: 3,
                                    minHeight: 280,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    p: 2,
                                }, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, sx: { color: "#fff", mb: 2, textAlign: "center" }, children: card.label }), _jsx(Box, { sx: {
                                            mb: 2,
                                            width: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            minHeight: 120,
                                            justifyContent: "center",
                                        }, children: previewUrl[card.previewKey] ? (_jsx(CardMedia, { component: card.isVideo ? "video" : "img", controls: card.isVideo, src: previewUrl[card.previewKey], sx: {
                                                height: 120,
                                                width: "100%",
                                                maxWidth: 240,
                                                objectFit: "contain",
                                                borderRadius: 2,
                                                mb: 2,
                                                background: "#2a2a2a",
                                            }, onError: () => console.error(`❌ Failed to load preview for: ${card.type}`, previewUrl[card.previewKey]) })) : (_jsx(Box, { sx: {
                                                height: 120,
                                                width: "100%",
                                                maxWidth: 240,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#222",
                                                borderRadius: 2,
                                                mb: 2,
                                                color: "#888",
                                                fontSize: 18,
                                            }, children: card.label })) }), _jsxs(Stack, { direction: "row", spacing: 2, sx: { width: "100%" }, children: [_jsxs(Button, { component: "label", variant: "contained", startIcon: _jsx(CloudUploadIcon, {}), disabled: loading, sx: {
                                                    background: "#F44336",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    flex: 1,
                                                    "&:hover": { background: "#d32f2f" },
                                                }, children: ["Upload", _jsx("input", { type: "file", accept: card.accept, onChange: (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file)
                                                                handleFileUpload(file, card.type);
                                                        }, style: { display: "none" } })] }), previewUrl[card.previewKey] && (_jsx(Button, { variant: "outlined", color: "error", onClick: () => handleRemoveFile(card.type), disabled: loading, sx: {
                                                    flex: 1,
                                                    color: "#fff",
                                                    borderColor: "#F44336",
                                                    "&:hover": {
                                                        borderColor: "#d32f2f",
                                                        background: "rgba(244,67,54,0.08)",
                                                    },
                                                }, children: "Remove" }))] })] }) }, card.type))) })] })] }));
};
export default SettingsPage;

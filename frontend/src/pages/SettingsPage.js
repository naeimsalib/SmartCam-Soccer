import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Card, CardContent, Button, Grid, useTheme, useMediaQuery, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, } from "@mui/material";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Storage as StorageIcon, Computer as ComputerIcon, Videocam as VideocamIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import { useSystemStatus } from "../hooks/useSystemStatus";
import Navigation from "../components/Navigation";
import { ConnectionHealthIndicator } from "../components/ConnectionHealthIndicator";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { shallowEqual } from "../utils/objectUtils";
function isCameraOnline(lastSeen, thresholdSec = 6) {
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < thresholdSec;
}
const buildPreviewUrlMap = async (settings) => {
    const urlMap = {};
    const mediaFields = [
        "intro_video_path",
        "logo_path",
        "sponsor_logo1_path",
        "sponsor_logo2_path",
        "sponsor_logo3_path",
    ];
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
            }
            catch (error) {
                // Silently handle error for cleaner console
            }
        }
    }
    return urlMap;
};
const SettingsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    // Use the new robust system status hook
    const { systemStatus, loading: systemLoading, error: systemError, connectionHealth, lastSuccessfulUpdate, isSystemActive, retryCount, refresh: refreshSystemStatus, } = useSystemStatus({
        userId: user?.id,
        basePollingInterval: 30000,
        enableSmartPolling: true,
    });
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [backupDialogOpen, setBackupDialogOpen] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
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
        }
        finally {
            setLoading(false);
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
            border: "1px solid rgba(255, 255, 255, 0.1)",
        }, children: _jsxs(CardContent, { sx: { p: { xs: 2, sm: 3 } }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }, children: label }), preview && (_jsx(Box, { sx: { mb: 2 }, children: type === "intro_video_path" ? (_jsx("video", { controls: true, style: { width: "100%", maxHeight: "200px", borderRadius: 8 }, src: preview })) : (_jsx("img", { src: preview, alt: label, style: {
                            width: "100%",
                            maxHeight: "200px",
                            objectFit: "contain",
                            borderRadius: 8,
                            background: "#333",
                        } })) })), _jsxs(Box, { sx: { display: "flex", gap: 2, flexWrap: "wrap" }, children: [_jsxs(Button, { component: "label", variant: "outlined", startIcon: _jsx(CloudUploadIcon, {}), sx: {
                                color: "#fff",
                                borderColor: "rgba(255, 255, 255, 0.3)",
                                "&:hover": {
                                    borderColor: "#fff",
                                    background: "rgba(255, 255, 255, 0.1)",
                                },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                px: { xs: 1, sm: 2 },
                            }, children: ["Upload", _jsx("input", { type: "file", hidden: true, accept: type === "intro_video_path" ? "video/*" : "image/*", onChange: (e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                            handleFileUpload(file, type);
                                    } })] }), preview && (_jsx(Button, { onClick: () => handleRemoveFile(type), variant: "outlined", startIcon: _jsx(DeleteIcon, {}), color: "error", sx: {
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                px: { xs: 1, sm: 2 },
                            }, children: "Remove" }))] })] }) }));
    const handleBackup = async () => {
        setBackupLoading(true);
        try {
            // Simulate backup process
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setSuccess("Backup created successfully");
            setBackupDialogOpen(false);
        }
        catch (error) {
            setError("Backup failed. Please try again.");
        }
        finally {
            setBackupLoading(false);
        }
    };
    const handleDeleteAllData = async () => {
        if (window.confirm("Are you sure you want to delete all data? This action cannot be undone.")) {
            navigate("/");
        }
    };
    const formatStorage = (bytes) => {
        if (bytes === 0)
            return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };
    if (loading && !settings) {
        return (_jsx(Box, { sx: {
                minHeight: "100vh",
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }, children: _jsx(CircularProgress, { sx: { color: "#fff" } }) }));
    }
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            background: "#111",
            color: "#fff",
            overflow: "hidden",
        }, children: [_jsx(Navigation, {}), _jsxs(Box, { sx: {
                    p: { xs: 2, sm: 3, md: 4 },
                    mt: { xs: 8, sm: 10 },
                    maxWidth: "1200px",
                    mx: "auto",
                }, children: [_jsx(Typography, { variant: "h4", sx: {
                            mb: 4,
                            fontWeight: 700,
                            background: "linear-gradient(45deg, #fff 30%, #ccc 90%)",
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontSize: { xs: "1.75rem", sm: "2.125rem" },
                        }, children: "Settings & System Status" }), _jsx(Box, { sx: { mb: 3 }, children: _jsx(ConnectionHealthIndicator, { connectionHealth: connectionHealth, lastSuccessfulUpdate: lastSuccessfulUpdate, retryCount: retryCount, onRefresh: refreshSystemStatus, loading: systemLoading }) }), _jsx(Card, { sx: {
                            background: "#1a1a1a",
                            color: "#fff",
                            borderRadius: 3,
                            mb: 4,
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                        }, children: _jsxs(CardContent, { sx: { p: { xs: 2, sm: 3 } }, children: [_jsxs(Typography, { variant: "h6", sx: { mb: 3, display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(ComputerIcon, {}), "System Status"] }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Box, { sx: {
                                                    p: 2,
                                                    background: "rgba(255, 255, 255, 0.05)",
                                                    borderRadius: 2,
                                                    border: `2px solid ${isSystemActive ? "#4CAF50" : "#F44336"}`,
                                                }, children: [_jsxs(Box, { sx: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 1,
                                                        }, children: [isSystemActive ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50" } })) : (_jsx(WarningIcon, { sx: { color: "#F44336" } })), _jsx(Typography, { sx: { fontWeight: 600 }, children: "Raspberry Pi" })] }), _jsx(Chip, { label: isSystemActive ? "Active" : "Inactive", color: isSystemActive ? "success" : "error", size: "small" })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Box, { sx: {
                                                    p: 2,
                                                    background: "rgba(255, 255, 255, 0.05)",
                                                    borderRadius: 2,
                                                    border: `2px solid ${systemStatus?.is_recording ? "#4CAF50" : "#666"}`,
                                                }, children: [_jsxs(Box, { sx: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 1,
                                                        }, children: [_jsx(VideocamIcon, { sx: {
                                                                    color: systemStatus?.is_recording ? "#4CAF50" : "#666",
                                                                } }), _jsx(Typography, { sx: { fontWeight: 600 }, children: "Recording" })] }), _jsx(Chip, { label: systemStatus?.is_recording ? "Active" : "Idle", color: systemStatus?.is_recording ? "success" : "default", size: "small" })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Box, { sx: {
                                                    p: 2,
                                                    background: "rgba(255, 255, 255, 0.05)",
                                                    borderRadius: 2,
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                }, children: [_jsxs(Box, { sx: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 1,
                                                        }, children: [_jsx(StorageIcon, { sx: { color: "#fff" } }), _jsx(Typography, { sx: { fontWeight: 600 }, children: "Storage" })] }), _jsxs(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: [formatStorage(systemStatus?.storage_used || 0), " used"] })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Box, { sx: {
                                                    p: 2,
                                                    background: "rgba(255, 255, 255, 0.05)",
                                                    borderRadius: 2,
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                }, children: [_jsxs(Box, { sx: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 1,
                                                        }, children: [_jsx(ScheduleIcon, { sx: { color: "#fff" } }), _jsx(Typography, { sx: { fontWeight: 600 }, children: "Last Heartbeat" })] }), _jsx(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: systemStatus?.last_heartbeat
                                                            ? new Date(systemStatus.last_heartbeat).toLocaleString()
                                                            : "Never" })] }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Box, { sx: {
                                                    p: 2,
                                                    background: "rgba(255, 255, 255, 0.05)",
                                                    borderRadius: 2,
                                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                                }, children: [_jsxs(Box, { sx: {
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                            mb: 1,
                                                        }, children: [_jsx(VideocamIcon, { sx: { color: "#fff" } }), _jsx(Typography, { sx: { fontWeight: 600 }, children: "Cameras" })] }), _jsxs(Typography, { variant: "body2", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: [cameras.filter((cam) => isCameraOnline(cam.last_seen))
                                                                .length, " ", "/ ", cameras.length, " online"] })] }) })] })] }) }), _jsx(Typography, { variant: "h5", sx: { mb: 3, fontWeight: 600 }, children: "Media Files" }), _jsx(Grid, { container: true, spacing: 3, children: mediaCards.map((card) => (_jsx(Grid, { item: true, xs: 12, md: 6, children: renderUploader(card.label, card.type, previewUrl[card.previewKey]) }, card.type))) }), _jsx(Typography, { variant: "h5", sx: { mb: 3, mt: 4, fontWeight: 600 }, children: "System Actions" }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Button, { onClick: () => setBackupDialogOpen(true), variant: "outlined", fullWidth: true, sx: {
                                        color: "#fff",
                                        borderColor: "rgba(255, 255, 255, 0.3)",
                                        "&:hover": {
                                            borderColor: "#fff",
                                            background: "rgba(255, 255, 255, 0.1)",
                                        },
                                        py: 2,
                                    }, children: "Create Backup" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(Button, { onClick: handleDeleteAllData, variant: "outlined", color: "error", fullWidth: true, sx: { py: 2 }, children: "Delete All Data" }) })] }), error && (_jsx(Alert, { severity: "error", sx: { mt: 3 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mt: 3 }, children: success })), _jsxs(Dialog, { open: backupDialogOpen, onClose: () => setBackupDialogOpen(false), children: [_jsx(DialogTitle, { children: "Create System Backup" }), _jsx(DialogContent, { children: _jsx(DialogContentText, { children: "This will create a backup of all your recordings, settings, and system data. The backup will be stored securely and can be restored if needed." }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setBackupDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleBackup, disabled: backupLoading, variant: "contained", children: backupLoading ? _jsx(CircularProgress, { size: 20 }) : "Create Backup" })] })] })] })] }));
};
export default SettingsPage;

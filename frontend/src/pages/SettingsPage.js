import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Container, Typography, Button, Grid, Card, CardContent, Alert, Stack, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import Navbar from "../components/Navbar";
function isCameraOnline(lastSeen, thresholdSec = 6) {
    return (Date.now() - new Date(lastSeen).getTime()) / 1000 < thresholdSec;
}
const SettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [previewUrl, setPreviewUrl] = useState({});
    const [cameras, setCameras] = useState([]);
    const [userId, setUserId] = useState(null);
    const [systemStatus, setSystemStatus] = useState({
        isRecording: false,
        isStreaming: false,
        storageUsed: 0,
        lastBackup: "",
    });
    const [backupDialogOpen, setBackupDialogOpen] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const updatePreviewUrls = useCallback(async (newSettings) => {
        const newPreviewUrls = {};
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
        ]) {
            if (newSettings?.[key]) {
                const { data: signedData } = await supabase.storage
                    .from("usermedia")
                    .createSignedUrl(newSettings[key], 3600);
                if (signedData?.signedUrl) {
                    newPreviewUrls[key.replace("_path", "")] = signedData.signedUrl;
                }
            }
        }
        setPreviewUrl(newPreviewUrls);
    }, []);
    const fetchSettings = useCallback(async () => {
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
    }, [updatePreviewUrls]);
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id || null);
        });
    }, []);
    // Initial fetch of cameras
    useEffect(() => {
        if (!userId)
            return;
        supabase
            .from("cameras")
            .select("*")
            .eq("user_id", userId)
            .then(({ data }) => {
            if (data)
                setCameras(data);
        });
    }, [userId]);
    // Real-time subscription for cameras
    useRealtimeSubscription({
        table: "cameras",
        filter: userId ? `user_id=eq.${userId}` : undefined,
        onInsert: (newCamera) => {
            setCameras((prev) => [...prev, newCamera]);
        },
        onUpdate: (updatedCamera) => {
            setCameras((prev) => prev.map((cam) => (cam.id === updatedCamera.id ? updatedCamera : cam)));
        },
        onDelete: (deletedCamera) => {
            setCameras((prev) => prev.filter((cam) => cam.id !== deletedCamera.id));
        },
    });
    // Real-time subscription for user settings
    useRealtimeSubscription({
        table: "user_settings",
        filter: userId ? `user_id=eq.${userId}` : undefined,
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
    const fetchSystemStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from("system_status")
                .select("*")
                .eq("user_id", userId)
                .single();
            if (error)
                throw error;
            setSystemStatus({
                isRecording: data.is_recording,
                isStreaming: data.is_streaming,
                storageUsed: data.storage_used,
                lastBackup: data.last_backup,
            });
        }
        catch (err) {
            console.error("Error fetching system status:", err);
            setError("Failed to fetch system status");
        }
        finally {
            setLoading(false);
        }
    };
    const handleBackup = async () => {
        try {
            setBackupLoading(true);
            setError(null);
            setSuccess(null);
            const { error } = await supabase.functions.invoke("create-backup", {
                body: { userId },
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
                body: { userId },
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
                        }, children: "Settings" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, children: success })), _jsxs(Grid, { container: true, spacing: 4, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Card, { sx: {
                                            background: "#1a1a1a",
                                            color: "#fff",
                                            borderRadius: 3,
                                            mb: 3,
                                        }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, sx: { color: "#fff" }, children: "System Status" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Recording Status" }), _jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: systemStatus.isRecording ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50" } })) : (_jsx(CancelIcon, { sx: { color: "#F44336" } })) })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Streaming Status" }), _jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: systemStatus.isStreaming ? (_jsx(CheckCircleIcon, { sx: { color: "#4CAF50" } })) : (_jsx(CancelIcon, { sx: { color: "#F44336" } })) })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Storage Used" }), _jsx(Typography, { sx: { color: "#fff" }, children: formatStorage(systemStatus.storageUsed) })] }), _jsxs(Box, { sx: {
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }, children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Last Backup" }), _jsx(Typography, { sx: { color: "#fff" }, children: systemStatus.lastBackup
                                                                        ? new Date(systemStatus.lastBackup).toLocaleString()
                                                                        : "Never" })] })] })] }) }), _jsx(Card, { sx: {
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
                                        }, children: backupLoading ? "Creating..." : "Create Backup" })] })] })] })] }));
};
export default SettingsPage;

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia, CircularProgress, Alert, Stack, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Refresh as RefreshIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import Navbar from "../components/Navbar";
const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});
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
        filter: `user_id=eq.${userId}`,
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
        filter: `user_id=eq.${userId}`,
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
    const updatePreviewUrls = async (newSettings) => {
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
    };
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
            const updatePayload = {
                user_id: user.id,
                intro_video_path: existing?.intro_video_path ?? null,
                logo_path: existing?.logo_path ?? null,
                sponsor_logo1_path: existing?.sponsor_logo1_path ?? null,
                sponsor_logo2_path: existing?.sponsor_logo2_path ?? null,
                sponsor_logo3_path: existing?.sponsor_logo3_path ?? null,
                [type]: filePath,
            };
            const { error: updateError } = await supabase
                .from("user_settings")
                .upsert(updatePayload, { onConflict: "user_id" });
            if (updateError)
                throw updateError;
            setSuccess(`${type.replace("_", " ")} uploaded successfully`);
            fetchSettings();
        }
        catch (err) {
            setError(`Failed to upload ${type.replace("_", " ")}`);
            console.error(err);
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
            const currentPath = settings?.[type];
            if (currentPath) {
                const { error: deleteError } = await supabase.storage
                    .from("usermedia")
                    .remove([currentPath]);
                if (deleteError)
                    throw deleteError;
            }
            const { error: updateError } = await supabase
                .from("user_settings")
                .upsert({ user_id: user.id, [type]: null }, { onConflict: "user_id" });
            if (updateError)
                throw updateError;
            setSuccess(`${type.replace("_", " ")} removed successfully`);
            fetchSettings();
        }
        catch (err) {
            setError(`Failed to remove ${type.replace("_", " ")}`);
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const renderUploader = (label, type, preview) => (_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsxs(Card, { sx: {
                p: 2,
                borderRadius: 3,
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 2, textAlign: "center" }, children: label }), _jsx(Box, { sx: {
                        mb: 2,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }, children: preview ? (_jsx(CardMedia, { component: type === "intro_video_path" ? "video" : "img", controls: type === "intro_video_path", src: preview, sx: {
                            height: 160,
                            width: "100%",
                            maxWidth: 240,
                            objectFit: "contain",
                            borderRadius: 2,
                            mb: 2,
                            background: "#f0f0f0",
                        }, onError: () => console.error(`❌ Failed to load preview for: ${type}`, preview) })) : null }), preview ? (_jsxs(Button, { variant: "outlined", color: "error", onClick: () => handleRemoveFile(type), disabled: loading, sx: { width: "100%" }, children: ["Remove ", label] })) : (_jsxs(Button, { component: "label", variant: "contained", startIcon: _jsx(CloudUploadIcon, {}), disabled: loading, sx: { width: "100%" }, children: ["Upload ", label, _jsx(VisuallyHiddenInput, { type: "file", accept: type === "intro_video_path" ? "video/*" : "image/*", onChange: (e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                    handleFileUpload(file, type);
                            } })] }))] }) }));
    const fetchSystemStatus = async () => {
        try {
            setLoading(true);
            // Fetch system status from your backend
            const { data, error } = await supabase
                .from("system_status")
                .select("*")
                .single();
            if (error)
                throw error;
            setSystemStatus(data || {
                isRecording: false,
                isStreaming: false,
                storageUsed: 0,
                lastBackup: "",
            });
        }
        catch (err) {
            setError("Failed to fetch system status");
            console.error(err);
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
            // Implement backup logic here
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated backup
            setSuccess("Backup completed successfully");
            setBackupDialogOpen(false);
        }
        catch (err) {
            setError("Failed to create backup");
            console.error(err);
        }
        finally {
            setBackupLoading(false);
        }
    };
    const handleDeleteAllData = async () => {
        if (!window.confirm("Are you sure you want to delete all data? This action cannot be undone.")) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            // Implement delete all data logic here
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated deletion
            setSuccess("All data deleted successfully");
        }
        catch (err) {
            setError("Failed to delete data");
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const formatStorage = (bytes) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return `${gb.toFixed(2)} GB`;
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
                        }, children: "Settings" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, children: success })), _jsxs(Grid, { container: true, spacing: 4, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                    }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", gutterBottom: true, sx: { color: "#fff", fontWeight: 600 }, children: "System Status" }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", my: 4, children: _jsx(CircularProgress, { sx: { color: "#F44336" } }) })) : (_jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Recording Status" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: systemStatus.isRecording, color: "error" }), label: "" })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Streaming Status" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: systemStatus.isStreaming, color: "error" }), label: "" })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Storage Used" }), _jsx(Typography, { sx: { color: "#fff" }, children: formatStorage(systemStatus.storageUsed) })] }), _jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [_jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Last Backup" }), _jsx(Typography, { sx: { color: "#fff" }, children: systemStatus.lastBackup
                                                                    ? new Date(systemStatus.lastBackup).toLocaleDateString()
                                                                    : "Never" })] }), _jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: fetchSystemStatus, sx: {
                                                            mt: 2,
                                                            color: "#F44336",
                                                            borderColor: "#F44336",
                                                            "&:hover": {
                                                                borderColor: "#d32f2f",
                                                                background: "rgba(244, 67, 54, 0.08)",
                                                            },
                                                        }, children: "Refresh Status" })] }))] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { sx: {
                                        background: "#1a1a1a",
                                        color: "#fff",
                                        borderRadius: 3,
                                        height: "100%",
                                    }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", gutterBottom: true, sx: { color: "#fff", fontWeight: 600 }, children: "Data Management" }), _jsxs(Stack, { spacing: 3, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(CloudUploadIcon, {}), onClick: () => setBackupDialogOpen(true), sx: {
                                                            background: "#F44336",
                                                            "&:hover": {
                                                                background: "#d32f2f",
                                                            },
                                                        }, children: "Create Backup" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(DeleteIcon, {}), onClick: handleDeleteAllData, sx: {
                                                            color: "#F44336",
                                                            borderColor: "#F44336",
                                                            "&:hover": {
                                                                borderColor: "#d32f2f",
                                                                background: "rgba(244, 67, 54, 0.08)",
                                                            },
                                                        }, children: "Delete All Data" })] })] }) }) })] }), _jsxs(Dialog, { open: backupDialogOpen, onClose: () => setBackupDialogOpen(false), PaperProps: {
                            sx: {
                                background: "#1a1a1a",
                                color: "#fff",
                                minWidth: "400px",
                            },
                        }, children: [_jsx(DialogTitle, { children: "Create Backup" }), _jsx(DialogContent, { children: _jsx(Typography, { sx: { color: "rgba(255, 255, 255, 0.7)", mt: 2 }, children: "This will create a backup of all your recordings and settings. The backup will be stored securely in the cloud." }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setBackupDialogOpen(false), sx: { color: "#fff" }, children: "Cancel" }), _jsx(Button, { onClick: handleBackup, variant: "contained", disabled: backupLoading, sx: {
                                            background: "#F44336",
                                            "&:hover": {
                                                background: "#d32f2f",
                                            },
                                        }, children: backupLoading ? "Creating Backup..." : "Create Backup" })] })] })] })] }));
};
export default SettingsPage;

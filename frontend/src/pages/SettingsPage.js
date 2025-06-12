import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Container, Typography, Button, Grid, Card, CardMedia, CircularProgress, Alert, } from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { supabase } from "../supabaseClient";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
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
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            py: 4,
        }, children: [_jsx(Navbar, {}), _jsxs(Container, { maxWidth: "lg", sx: { mt: 10 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, align: "center", fontWeight: 600, children: "Video Settings" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2, maxWidth: 500, mx: "auto" }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mb: 2, maxWidth: 500, mx: "auto" }, children: success })), _jsxs(Grid, { container: true, spacing: 4, alignItems: "flex-start", children: [_jsx(Grid, { item: true, xs: 12, md: 7, children: _jsxs(Card, { sx: {
                                        p: { xs: 2, sm: 4 },
                                        borderRadius: 4,
                                        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.07)",
                                        background: "#f7fafc",
                                        maxWidth: 900,
                                        mx: "auto",
                                        mt: 0,
                                    }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 3, fontWeight: 500, textAlign: "center" }, children: "Upload and Manage Your Branding" }), _jsxs(Grid, { container: true, spacing: 3, children: [renderUploader("Intro Video", "intro_video_path", previewUrl.intro), renderUploader("Main Logo", "logo_path", previewUrl.logo), renderUploader("Sponsor Logo 1", "sponsor_logo1_path", previewUrl.sponsor_logo1), renderUploader("Sponsor Logo 2", "sponsor_logo2_path", previewUrl.sponsor_logo2), renderUploader("Sponsor Logo 3", "sponsor_logo3_path", previewUrl.sponsor_logo3)] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 5, children: _jsxs(Card, { sx: {
                                        p: 4,
                                        borderRadius: 4,
                                        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
                                        background: "#fff",
                                        minHeight: 320,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }, children: [_jsx(Typography, { variant: "h6", sx: { mb: 2, fontWeight: 600, textAlign: "center" }, children: "System Status" }), cameras.length > 0 ? (cameras
                                            .filter((camera) => typeof camera === "object" &&
                                            camera !== null &&
                                            typeof camera.id === "string")
                                            .map((camera) => {
                                            const online = isCameraOnline(camera.last_seen);
                                            const hasInternet = online && !!camera.ip_address;
                                            return (_jsxs(Box, { sx: { mb: 3, width: "100%" }, children: [_jsxs(Typography, { variant: "subtitle1", fontWeight: 700, sx: { mb: 1 }, children: [camera.name, " ", camera.location ? `- ${camera.location}` : ""] }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", mb: 1 }, children: [_jsx(FiberManualRecordIcon, { sx: {
                                                                    color: online ? "#43a047" : "#e53935",
                                                                    mr: 1,
                                                                } }), _jsxs(Typography, { variant: "subtitle1", fontWeight: 500, children: ["Camera: ", online ? "Online" : "Offline"] })] }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", mb: 1 }, children: [hasInternet ? (_jsx(WifiIcon, { sx: { color: "#43a047", mr: 1 } })) : (_jsx(WifiOffIcon, { sx: { color: "#e53935", mr: 1 } })), _jsxs(Typography, { variant: "subtitle1", fontWeight: 500, children: ["Internet:", " ", hasInternet ? "Connected" : "Disconnected"] })] }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", mb: 1 }, children: [_jsx(FiberManualRecordIcon, { sx: {
                                                                    color: camera.is_recording
                                                                        ? "#43a047"
                                                                        : "#757575",
                                                                    mr: 1,
                                                                } }), _jsxs(Typography, { variant: "subtitle1", fontWeight: 500, children: ["Recording:", " ", camera.is_recording ? "In Progress" : "Idle"] })] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { mt: 1 }, children: ["Last seen:", " ", new Date(camera.last_seen).toLocaleString()] })] }, camera.id));
                                        })) : (_jsx(Typography, { color: "text.secondary", children: "No camera data found." }))] }) })] }), loading && (_jsx(Box, { sx: { display: "flex", justifyContent: "center", mt: 2 }, children: _jsx(CircularProgress, {}) }))] })] }));
};
export default SettingsPage;

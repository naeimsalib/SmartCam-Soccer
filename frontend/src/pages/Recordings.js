import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CardActions, Button, IconButton, Grid, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { supabase } from "../supabaseClient";
import Tooltip from "@mui/material/Tooltip";
const Recordings = () => {
    const [videos, setVideos] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playUrl, setPlayUrl] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    useEffect(() => {
        const fetchUserIdAndVideos = async () => {
            setLoading(true);
            const { data: { session }, } = await supabase.auth.getSession();
            const uid = session?.user?.id;
            console.log("Current user ID:", uid);
            setUserId(uid);
            if (uid) {
                console.log("Fetching videos for user:", uid);
                const { data, error } = await supabase.storage
                    .from("videos")
                    .list(uid + "/", { limit: 100 });
                console.log("Storage response:", { data, error });
                if (error) {
                    console.error("Error fetching videos:", error);
                }
                let mp4Files = [];
                if (data) {
                    for (const item of data) {
                        if (item.name.endsWith(".mp4")) {
                            mp4Files.push({
                                name: item.name,
                                fullPath: uid + "/" + item.name,
                            });
                        }
                        else if (item.metadata && item.metadata.type === "folder") {
                            const { data: subData, error: subError } = await supabase.storage
                                .from("videos")
                                .list(uid + "/" + item.name + "/", { limit: 100 });
                            if (subError) {
                                console.error("Error fetching subfolder videos:", subError);
                            }
                            if (subData) {
                                mp4Files = mp4Files.concat(subData
                                    .filter((file) => file.name.endsWith(".mp4"))
                                    .map((file) => ({
                                    name: file.name,
                                    fullPath: uid + "/" + item.name + "/" + file.name,
                                })));
                            }
                        }
                    }
                }
                console.log("MP4 files found:", mp4Files);
                setVideos(mp4Files);
            }
            setLoading(false);
        };
        fetchUserIdAndVideos();
    }, []);
    const getSignedVideoUrl = async (fullPath) => {
        if (!userId)
            return null;
        const { data, error } = await supabase.storage
            .from("videos")
            .createSignedUrl(fullPath, 60 * 60); // 1 hour expiry
        if (error) {
            console.error("Error creating signed URL:", error);
            return null;
        }
        return data.signedUrl;
    };
    const handlePlay = async (fullPath) => {
        const url = await getSignedVideoUrl(fullPath);
        if (url)
            setPlayUrl(url);
    };
    const handleDelete = async (fullPath) => {
        setDeleteTarget(fullPath);
    };
    const confirmDelete = async () => {
        if (!deleteTarget)
            return;
        const { error } = await supabase.storage
            .from("videos")
            .remove([deleteTarget]);
        if (!error) {
            setVideos(videos.filter((v) => v.fullPath !== deleteTarget));
            setDeleteTarget(null);
        }
        else {
            alert("Failed to delete video: " + error.message);
        }
    };
    // Robust download handler for signed URLs
    const handleDownload = async (file) => {
        const url = await getSignedVideoUrl(file.fullPath);
        if (url) {
            try {
                const response = await fetch(url);
                if (!response.ok)
                    throw new Error("Failed to fetch video for download");
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
            }
            catch (err) {
                alert("Failed to download video: " + err.message);
            }
        }
        else {
            alert("Could not generate a download link for this video.");
        }
    };
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            py: 6,
        }, children: [_jsx(Typography, { variant: "h4", align: "center", fontWeight: 500, mb: 4, sx: { mt: 8 }, children: "Your Recordings" }), loading ? (_jsx(CircularProgress, {})) : videos.length === 0 ? (_jsx(Typography, { color: "text.secondary", children: "No videos found in your folder." })) : (_jsx(Grid, { container: true, spacing: 3, justifyContent: "center", maxWidth: "md", children: videos.map((file) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { elevation: 4, sx: {
                            borderRadius: 3,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: "#f7fafc",
                        }, children: [_jsxs(CardContent, { sx: { width: "100%" }, children: [_jsx(Tooltip, { title: file.name, placement: "top", arrow: true, children: _jsx(Typography, { variant: "subtitle1", fontWeight: 600, noWrap: false, gutterBottom: true, sx: {
                                                wordBreak: "break-all",
                                                maxWidth: "100%",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "block",
                                            }, children: file.name }) }), _jsxs(Typography, { color: "info.main", variant: "body2", align: "center", sx: {
                                            mt: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 1,
                                        }, children: [_jsx(InfoOutlinedIcon, { fontSize: "small", sx: { verticalAlign: "middle" } }), "Video preview is disabled for privacy. Click below to download your recording."] })] }), _jsxs(CardActions, { sx: { justifyContent: "center", width: "100%" }, children: [_jsx(IconButton, { color: "primary", onClick: async () => {
                                            await handlePlay(file.fullPath);
                                        }, children: _jsx(PlayArrowIcon, {}) }), _jsx(IconButton, { color: "error", onClick: () => handleDelete(file.fullPath), children: _jsx(DeleteIcon, {}) }), _jsx(IconButton, { color: "primary", onClick: () => handleDownload(file), children: _jsx(Button, { size: "small", children: "Download" }) })] })] }) }, file.fullPath))) })), _jsxs(Dialog, { open: !!playUrl, onClose: () => setPlayUrl(null), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Play Video" }), _jsx(DialogContent, { children: playUrl && (_jsx("video", { src: playUrl, controls: true, style: { width: "100%" } })) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setPlayUrl(null), children: "Close" }) })] }), _jsxs(Dialog, { open: !!deleteTarget, onClose: () => setDeleteTarget(null), children: [_jsx(DialogTitle, { children: "Delete Video" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this video?" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteTarget(null), children: "Cancel" }), _jsx(Button, { color: "error", onClick: confirmDelete, children: "Delete" })] })] })] }));
};
function VideoPlayer({ fullPath, getSignedVideoUrl, }) {
    const [url, setUrl] = React.useState(null);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        let mounted = true;
        getSignedVideoUrl(fullPath).then((u) => {
            if (mounted)
                setUrl(u);
        });
        return () => {
            mounted = false;
        };
    }, [fullPath, getSignedVideoUrl]);
    if (!url)
        return (_jsx(Box, { sx: { width: "100%", height: 180, background: "#eee", borderRadius: 2 } }));
    return (_jsxs(_Fragment, { children: [_jsx("video", { src: url, controls: true, style: {
                    width: "100%",
                    maxHeight: 180,
                    borderRadius: 8,
                    background: "#000",
                }, onError: () => setError("Failed to load video. Please try again or download.") }), error && (_jsx(Typography, { color: "error", variant: "body2", align: "center", children: error }))] }));
}
export default Recordings;

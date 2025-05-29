import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CardActions, Button, IconButton, Grid, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import { supabase } from "../supabaseClient";
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
            setUserId(uid);
            if (uid) {
                const { data, error } = await supabase.storage
                    .from("videos")
                    .list(uid + "/", { limit: 100 });
                if (data) {
                    setVideos(data.filter((file) => file.name.endsWith(".mp4")));
                }
            }
            setLoading(false);
        };
        fetchUserIdAndVideos();
    }, []);
    const getVideoUrl = (filename) => supabase.storage.from("videos").getPublicUrl(`${userId}/${filename}`).data
        .publicUrl;
    const handlePlay = (filename) => {
        setPlayUrl(getVideoUrl(filename));
    };
    const handleDelete = async (filename) => {
        setDeleteTarget(filename);
    };
    const confirmDelete = async () => {
        if (!userId || !deleteTarget)
            return;
        await supabase.storage.from("videos").remove([`${userId}/${deleteTarget}`]);
        setVideos(videos.filter((v) => v.name !== deleteTarget));
        setDeleteTarget(null);
    };
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            py: 6,
        }, children: [_jsx(Typography, { variant: "h4", align: "center", fontWeight: 500, mb: 4, children: "Your Recordings" }), loading ? (_jsx(CircularProgress, {})) : videos.length === 0 ? (_jsx(Typography, { color: "text.secondary", children: "No videos found in your folder." })) : (_jsx(Grid, { container: true, spacing: 3, justifyContent: "center", maxWidth: "md", children: videos.map((file) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { elevation: 4, sx: {
                            borderRadius: 3,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: "#f7fafc",
                        }, children: [_jsxs(CardContent, { sx: { width: "100%" }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, noWrap: true, gutterBottom: true, children: file.name }), _jsx(Box, { sx: {
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            mb: 1,
                                        }, children: _jsx("video", { src: getVideoUrl(file.name), controls: true, style: {
                                                width: "100%",
                                                maxHeight: 180,
                                                borderRadius: 8,
                                                background: "#000",
                                            } }) })] }), _jsxs(CardActions, { sx: { justifyContent: "center", width: "100%" }, children: [_jsx(IconButton, { color: "primary", onClick: () => handlePlay(file.name), children: _jsx(PlayArrowIcon, {}) }), _jsx(IconButton, { color: "error", onClick: () => handleDelete(file.name), children: _jsx(DeleteIcon, {}) })] })] }) }, file.name))) })), _jsxs(Dialog, { open: !!playUrl, onClose: () => setPlayUrl(null), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Play Video" }), _jsx(DialogContent, { children: playUrl && (_jsx("video", { src: playUrl, controls: true, style: { width: "100%" } })) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setPlayUrl(null), children: "Close" }) })] }), _jsxs(Dialog, { open: !!deleteTarget, onClose: () => setDeleteTarget(null), children: [_jsx(DialogTitle, { children: "Delete Video" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this video?" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteTarget(null), children: "Cancel" }), _jsx(Button, { color: "error", onClick: confirmDelete, children: "Delete" })] })] })] }));
};
export default Recordings;

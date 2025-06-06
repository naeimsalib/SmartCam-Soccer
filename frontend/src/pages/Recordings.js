import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CardActions, Button, IconButton, Grid, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Divider, } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import { supabase } from "../supabaseClient";
import Tooltip from "@mui/material/Tooltip";
const Recordings = () => {
    const [videos, setVideos] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playUrl, setPlayUrl] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const parseVideoFilename = (filename) => {
        try {
            // Extract date and time from filename (format: recording_YYYYMMDD_HHMM_userid.mp4)
            const match = filename.match(/recording_(\d{8})_(\d{4})_/);
            if (!match)
                return null;
            const [, dateStr, timeStr] = match;
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hour = timeStr.substring(0, 2);
            const minute = timeStr.substring(2, 4);
            // Parse the date and time
            const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
            // Calculate end time (1 minute after start time)
            const endDate = new Date(date.getTime() + 60 * 1000);
            // Format the date and times
            const formattedDate = date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const formattedStartTime = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
            const formattedEndTime = endDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
            return {
                name: filename,
                fullPath: filename,
                date: formattedDate,
                startTime: formattedStartTime,
                endTime: formattedEndTime,
            };
        }
        catch (error) {
            console.error("Error parsing video filename:", error);
            return null;
        }
    };
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
                            const parsedVideo = parseVideoFilename(item.name);
                            if (parsedVideo) {
                                mp4Files.push({
                                    ...parsedVideo,
                                    fullPath: uid + "/" + item.name,
                                });
                            }
                        }
                        else if (item.metadata && item.metadata.type === "folder") {
                            const { data: subData, error: subError } = await supabase.storage
                                .from("videos")
                                .list(uid + "/" + item.name + "/", { limit: 100 });
                            if (subError) {
                                console.error("Error fetching subfolder videos:", subError);
                            }
                            if (subData) {
                                const subVideos = subData
                                    .filter((file) => file.name.endsWith(".mp4"))
                                    .map((file) => {
                                    const parsedVideo = parseVideoFilename(file.name);
                                    return parsedVideo
                                        ? {
                                            ...parsedVideo,
                                            fullPath: uid + "/" + item.name + "/" + file.name,
                                        }
                                        : null;
                                })
                                    .filter((video) => video !== null);
                                mp4Files = mp4Files.concat(subVideos);
                            }
                        }
                    }
                }
                // Sort videos by date (oldest first)
                mp4Files.sort((a, b) => {
                    // Extract date and time from the filename for accurate sorting
                    const matchA = a.name.match(/recording_(\d{8})_(\d{4})_/);
                    const matchB = b.name.match(/recording_(\d{8})_(\d{4})_/);
                    if (!matchA || !matchB)
                        return 0;
                    const [, dateStrA, timeStrA] = matchA;
                    const [, dateStrB, timeStrB] = matchB;
                    const dateA = new Date(`${dateStrA.substring(0, 4)}-${dateStrA.substring(4, 6)}-${dateStrA.substring(6, 8)}T${timeStrA.substring(0, 2)}:${timeStrA.substring(2, 4)}:00`);
                    const dateB = new Date(`${dateStrB.substring(0, 4)}-${dateStrB.substring(4, 6)}-${dateStrB.substring(6, 8)}T${timeStrB.substring(0, 2)}:${timeStrB.substring(2, 4)}:00`);
                    return dateA.getTime() - dateB.getTime(); // Oldest first
                });
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
    // Group videos by date
    const groupedVideos = videos.reduce((groups, video) => {
        const date = video.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(video);
        return groups;
    }, {});
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            py: 6,
        }, children: [_jsx(Typography, { variant: "h4", align: "center", fontWeight: 500, mb: 4, sx: { mt: 8 }, children: "Your Recordings" }), loading ? (_jsx(CircularProgress, {})) : videos.length === 0 ? (_jsx(Typography, { color: "text.secondary", children: "No videos found in your folder." })) : (_jsx(Grid, { container: true, spacing: 3, justifyContent: "center", maxWidth: "md", children: Object.entries(groupedVideos).map(([date, dateVideos]) => (_jsxs(React.Fragment, { children: [_jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "h6", sx: {
                                        mt: 4,
                                        mb: 2,
                                        color: "primary.main",
                                        fontWeight: 500,
                                    }, children: date }), _jsx(Divider, { sx: { mb: 3 } })] }), dateVideos.map((file) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { elevation: 4, sx: {
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
                                                    }, children: `${file.startTime} - ${file.endTime}` }) }), _jsx(VideoPlayer, { fullPath: file.fullPath, getSignedVideoUrl: getSignedVideoUrl })] }), _jsxs(CardActions, { sx: { justifyContent: "center", width: "100%" }, children: [_jsx(IconButton, { color: "primary", onClick: async () => {
                                                    await handlePlay(file.fullPath);
                                                }, children: _jsx(PlayArrowIcon, {}) }), _jsx(IconButton, { color: "error", onClick: () => handleDelete(file.fullPath), children: _jsx(DeleteIcon, {}) }), _jsx(IconButton, { color: "primary", onClick: () => handleDownload(file), children: _jsx(Button, { size: "small", children: "Download" }) })] })] }) }, file.fullPath)))] }, date))) })), _jsxs(Dialog, { open: !!playUrl, onClose: () => setPlayUrl(null), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Play Video" }), _jsx(DialogContent, { children: playUrl && (_jsx("video", { src: playUrl, controls: true, style: { width: "100%" } })) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setPlayUrl(null), children: "Close" }) })] }), _jsxs(Dialog, { open: !!deleteTarget, onClose: () => setDeleteTarget(null), children: [_jsx(DialogTitle, { children: "Delete Video" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this video?" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteTarget(null), children: "Cancel" }), _jsx(Button, { color: "error", onClick: confirmDelete, children: "Delete" })] })] })] }));
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

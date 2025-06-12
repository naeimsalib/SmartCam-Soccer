import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, CardActions, Button, Grid, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Divider, } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShareIcon from "@mui/icons-material/Share";
import { supabase } from "../supabaseClient";
import Tooltip from "@mui/material/Tooltip";
import Navbar from "../components/Navbar";
const Recordings = () => {
    const [videos, setVideos] = useState([]);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [shareUrl, setShareUrl] = useState(null);
    const [playUrl, setPlayUrl] = useState(null);
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
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id || null);
        });
    }, []);
    const fetchVideos = async (uid) => {
        setLoading(true);
        console.log("Fetching videos for user:", uid);
        const { data, error } = await supabase.storage
            .from("videos")
            .list(uid + "/", { limit: 100 });
        console.log("Storage response:", { data, error });
        if (error) {
            console.error("Error fetching videos:", error);
            return;
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
        setLoading(false);
    };
    useEffect(() => {
        if (!userId)
            return;
        fetchVideos(userId);
        // Subscribe to storage changes
        const channel = supabase
            .channel("storage-changes")
            .on("postgres_changes", {
            event: "*",
            schema: "storage",
            table: "objects",
            filter: `bucket_id=eq.videos AND name=ilike.${userId}/%`,
        }, () => {
            // Refetch videos when any change occurs in the user's video folder
            fetchVideos(userId);
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);
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
    const handlePlay = async (fullPath) => {
        const url = await getSignedVideoUrl(fullPath);
        if (url)
            setPlayUrl(url);
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
        }, children: [_jsx(Navbar, {}), _jsx(Typography, { variant: "h4", align: "center", fontWeight: 500, mb: 4, sx: { mt: 10 }, children: "Your Recordings" }), loading ? (_jsx(CircularProgress, {})) : videos.length === 0 ? (_jsx(Typography, { color: "text.secondary", children: "No videos found in your folder." })) : (_jsx(Grid, { container: true, spacing: 3, justifyContent: "center", maxWidth: "md", children: Object.entries(groupedVideos).map(([date, dateVideos]) => (_jsxs(React.Fragment, { children: [_jsxs(Grid, { item: true, xs: 12, children: [_jsx(Typography, { variant: "h6", sx: {
                                        mt: 4,
                                        mb: 2,
                                        color: "primary.main",
                                        fontWeight: 500,
                                    }, children: date }), _jsx(Divider, { sx: { mb: 3 } })] }), dateVideos.map((file) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { elevation: 6, sx: {
                                    borderRadius: 4,
                                    p: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    background: "#fff",
                                    width: 400,
                                    maxWidth: "100%",
                                    m: "0 auto 32px auto",
                                    boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
                                    transition: "box-shadow 0.2s, transform 0.2s",
                                    "&:hover": {
                                        boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
                                        transform: "translateY(-2px) scale(1.01)",
                                    },
                                    justifyContent: "flex-start",
                                }, children: [_jsxs(CardContent, { sx: {
                                            width: "100%",
                                            p: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "flex-start",
                                        }, children: [_jsxs(Box, { sx: {
                                                    width: "100%",
                                                    py: 2,
                                                    background: "#f7fafc",
                                                    borderTopLeftRadius: 16,
                                                    borderTopRightRadius: 16,
                                                }, children: [_jsx(Tooltip, { title: file.name, placement: "top", arrow: true, children: _jsx(Typography, { variant: "subtitle1", fontWeight: 700, noWrap: false, gutterBottom: true, sx: {
                                                                wordBreak: "break-all",
                                                                maxWidth: "100%",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                display: "block",
                                                                textAlign: "center",
                                                                fontSize: 18,
                                                                letterSpacing: 0.2,
                                                            }, children: `${file.startTime} - ${file.endTime}` }) }), _jsx(Divider, { sx: { mt: 1, mb: 0 } })] }), _jsx(Box, { sx: {
                                                    width: 360,
                                                    maxWidth: "90%",
                                                    aspectRatio: "16/9",
                                                    background: "#000",
                                                    borderRadius: 3,
                                                    mt: 2,
                                                    mb: 2,
                                                    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)",
                                                    overflow: "hidden",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }, children: _jsx(VideoPlayer, { fullPath: file.fullPath, getSignedVideoUrl: getSignedVideoUrl, height: "100%", width: "100%" }) })] }), _jsx(CardActions, { sx: {
                                            justifyContent: "center",
                                            width: "100%",
                                            mb: 2,
                                            px: 2,
                                            pt: 1,
                                            pb: 2,
                                            display: "block",
                                        }, children: _jsxs(Grid, { container: true, spacing: 2, sx: { width: "100%", margin: 0 }, children: [_jsx(Grid, { item: true, xs: 6, children: _jsxs(Button, { onClick: async () => await handlePlay(file.fullPath), "aria-label": "Play video", sx: {
                                                            width: "100%",
                                                            flexDirection: "column",
                                                            py: 2,
                                                            borderRadius: 3,
                                                            background: "#e3f2fd",
                                                            color: "#1976d2",
                                                            boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.08)",
                                                            transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
                                                            "&:hover": {
                                                                background: "#bbdefb",
                                                                boxShadow: "0 4px 16px 0 rgba(25, 118, 210, 0.16)",
                                                                transform: "translateY(-2px) scale(1.03)",
                                                            },
                                                            textTransform: "none",
                                                            fontWeight: 600,
                                                            fontSize: 15,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }, children: [_jsx(PlayArrowIcon, { sx: { fontSize: 28, mb: 0.5 } }), "Play"] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Button, { onClick: async () => {
                                                            const url = await getSignedVideoUrl(file.fullPath);
                                                            if (url)
                                                                setShareUrl(url);
                                                        }, "aria-label": "Share video", sx: {
                                                            width: "100%",
                                                            flexDirection: "column",
                                                            py: 2,
                                                            borderRadius: 3,
                                                            background: "#e1f5fe",
                                                            color: "#0288d1",
                                                            boxShadow: "0 2px 8px 0 rgba(2, 136, 209, 0.08)",
                                                            transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
                                                            "&:hover": {
                                                                background: "#b3e5fc",
                                                                boxShadow: "0 4px 16px 0 rgba(2, 136, 209, 0.16)",
                                                                transform: "translateY(-2px) scale(1.03)",
                                                            },
                                                            textTransform: "none",
                                                            fontWeight: 600,
                                                            fontSize: 15,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }, children: [_jsx(ShareIcon, { sx: { fontSize: 26, mb: 0.5 } }), "Share"] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Button, { onClick: () => handleDelete(file.fullPath), "aria-label": "Delete video", sx: {
                                                            width: "100%",
                                                            flexDirection: "column",
                                                            py: 2,
                                                            borderRadius: 3,
                                                            background: "#ffebee",
                                                            color: "#d32f2f",
                                                            boxShadow: "0 2px 8px 0 rgba(211, 47, 47, 0.08)",
                                                            transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
                                                            "&:hover": {
                                                                background: "#ffcdd2",
                                                                boxShadow: "0 4px 16px 0 rgba(211, 47, 47, 0.16)",
                                                                transform: "translateY(-2px) scale(1.03)",
                                                            },
                                                            textTransform: "none",
                                                            fontWeight: 600,
                                                            fontSize: 15,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }, children: [_jsx(DeleteIcon, { sx: { fontSize: 26, mb: 0.5 } }), "Delete"] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Button, { onClick: () => handleDownload(file), "aria-label": "Download video", sx: {
                                                            width: "100%",
                                                            flexDirection: "column",
                                                            py: 2,
                                                            borderRadius: 3,
                                                            background: "#e8f5e9",
                                                            color: "#388e3c",
                                                            boxShadow: "0 2px 8px 0 rgba(56, 142, 60, 0.08)",
                                                            transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
                                                            "&:hover": {
                                                                background: "#c8e6c9",
                                                                boxShadow: "0 4px 16px 0 rgba(56, 142, 60, 0.16)",
                                                                transform: "translateY(-2px) scale(1.03)",
                                                            },
                                                            textTransform: "none",
                                                            fontWeight: 600,
                                                            fontSize: 15,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }, children: [_jsx(InfoOutlinedIcon, { sx: { fontSize: 24, mb: 0.5, color: "#388e3c" } }), "Download"] }) })] }) })] }) }, file.fullPath)))] }, date))) })), _jsxs(Dialog, { open: !!shareUrl, onClose: () => setShareUrl(null), children: [_jsx(DialogTitle, { children: "Share Video" }), _jsxs(DialogContent, { children: [_jsx(Typography, { gutterBottom: true, children: "Anyone with this link can view and download the video (link expires in 1 hour)." }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx("input", { type: "text", value: shareUrl || "", readOnly: true, style: { width: "100%" }, onFocus: (e) => e.target.select() }), _jsx(Button, { onClick: () => {
                                            if (shareUrl)
                                                navigator.clipboard.writeText(shareUrl);
                                        }, children: "Copy" })] }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Button, { href: `mailto:?subject=Check out this video&body=${encodeURIComponent(shareUrl || "")}`, target: "_blank", sx: { mr: 1 }, children: "Share via Email" }), _jsx(Button, { href: `sms:?body=${encodeURIComponent(shareUrl || "")}`, target: "_blank", children: "Share via SMS" })] }), _jsx(Box, { sx: { mt: 2 }, children: _jsx("video", { src: shareUrl || "", controls: true, style: { width: "100%" } }) })] }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setShareUrl(null), children: "Close" }) })] }), _jsxs(Dialog, { open: !!deleteTarget, onClose: () => setDeleteTarget(null), children: [_jsx(DialogTitle, { children: "Delete Video" }), _jsx(DialogContent, { children: _jsx(Typography, { children: "Are you sure you want to delete this video?" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteTarget(null), children: "Cancel" }), _jsx(Button, { color: "error", onClick: confirmDelete, children: "Delete" })] })] }), _jsxs(Dialog, { open: !!playUrl, onClose: () => setPlayUrl(null), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Play Video" }), _jsx(DialogContent, { children: playUrl && (_jsx("video", { src: playUrl, controls: true, style: { width: "100%", height: "70vh" } })) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setPlayUrl(null), children: "Close" }) })] })] }));
};
function VideoPlayer({ fullPath, getSignedVideoUrl, height = "100%", width = "100%", }) {
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
        return _jsx(Box, { sx: { width, height, background: "#eee", borderRadius: 2 } });
    return (_jsxs(_Fragment, { children: [_jsx("video", { src: url, controls: true, style: {
                    width: "100%",
                    height: "100%",
                    borderRadius: 8,
                    background: "#000",
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                }, onError: () => setError("Failed to load video. Please try again or download.") }), error && (_jsx(Typography, { color: "error", variant: "body2", align: "center", children: error }))] }));
}
export default Recordings;

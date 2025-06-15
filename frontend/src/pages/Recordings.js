import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Typography, Container, Grid, Card, CardContent, CardMedia, CardActions, Button, IconButton, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, } from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Download as DownloadIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
const Recordings = () => {
    const navigate = useNavigate();
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [userId, setUserId] = useState(null);
    // Check authentication and fetch user ID
    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("Checking authentication...");
                const { data: { session }, error: sessionError, } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error("Session error:", sessionError);
                    throw sessionError;
                }
                console.log("Session:", session);
                if (!session) {
                    console.log("No session found, redirecting to login");
                    navigate("/login");
                    return;
                }
                console.log("Setting user ID:", session.user.id);
                setUserId(session.user.id);
            }
            catch (err) {
                console.error("Error checking authentication:", err);
                setError("Authentication error. Please try logging in again.");
                navigate("/login");
            }
        };
        checkAuth();
    }, [navigate]);
    // Fetch recordings when userId changes
    useEffect(() => {
        if (userId) {
            console.log("User ID changed, fetching recordings...");
            fetchRecordings();
        }
    }, [userId]);
    const fetchRecordings = async () => {
        if (!userId) {
            console.log("No user ID available, skipping fetch");
            return;
        }
        try {
            console.log("Fetching recordings for user:", userId);
            setLoading(true);
            setError(null);
            // First, check if we can access the storage bucket
            const { data: bucketData, error: bucketError } = await supabase.storage.getBucket("videos");
            if (bucketError) {
                console.error("Error accessing storage bucket:", bucketError);
                throw new Error(`Storage bucket error: ${bucketError.message}`);
            }
            console.log("Storage bucket access successful:", bucketData);
            // List all files in the user's recordings folder
            const { data: files, error: listError } = await supabase.storage
                .from("videos")
                .list(userId, {
                limit: 100,
                offset: 0,
                sortBy: { column: "name", order: "asc" },
            });
            if (listError) {
                console.error("Error listing files:", listError);
                throw new Error(`Failed to list files: ${listError.message}`);
            }
            console.log("Files found:", files);
            if (!files || files.length === 0) {
                console.log("No files found in user's folder");
                setRecordings([]);
                return;
            }
            // Create signed URLs for each video and its thumbnail
            const recordingsWithUrls = await Promise.all(files
                .filter((file) => file.name.endsWith(".mp4")) // Only process video files
                .map(async (file) => {
                try {
                    // Get signed URL for the video
                    const { data: videoData, error: videoError } = await supabase.storage
                        .from("videos")
                        .createSignedUrl(`${userId}/${file.name}`, 3600);
                    if (videoError) {
                        console.error(`Error getting signed URL for ${file.name}:`, videoError);
                        return null;
                    }
                    // Get signed URL for the thumbnail
                    const thumbnailName = file.name.replace(".mp4", ".jpg");
                    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
                        .from("videos")
                        .createSignedUrl(`${userId}/${thumbnailName}`, 3600);
                    if (thumbnailError) {
                        console.error(`Error getting signed URL for thumbnail ${thumbnailName}:`, thumbnailError);
                        return null;
                    }
                    return {
                        id: file.id,
                        name: file.name,
                        title: file.name.replace(".mp4", ""),
                        description: "", // You might want to store this in a separate metadata file
                        video_url: videoData?.signedUrl || "",
                        thumbnail_url: thumbnailData?.signedUrl || "",
                        created_at: file.created_at,
                        user_id: userId,
                    };
                }
                catch (err) {
                    console.error(`Error processing file ${file.name}:`, err);
                    return null;
                }
            }));
            // Filter out any null entries from failed processing
            const validRecordings = recordingsWithUrls.filter((rec) => rec !== null);
            console.log("Valid recordings with URLs:", validRecordings);
            setRecordings(validRecordings);
        }
        catch (err) {
            console.error("Error fetching recordings:", err);
            setError(err instanceof Error
                ? err.message
                : "Failed to fetch recordings. Please check your connection and try again.");
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (recording) => {
        try {
            setError(null);
            setSuccess(null);
            // Delete the video file
            const { error: videoError } = await supabase.storage
                .from("videos")
                .remove([`${userId}/${recording.name}`]);
            if (videoError)
                throw videoError;
            // Delete the thumbnail file
            const { error: thumbnailError } = await supabase.storage
                .from("videos")
                .remove([`${userId}/${recording.name.replace(".mp4", ".jpg")}`]);
            if (thumbnailError)
                throw thumbnailError;
            setSuccess("Recording deleted successfully");
            await fetchRecordings();
        }
        catch (err) {
            console.error("Error deleting recording:", err);
            setError("Failed to delete recording");
        }
    };
    const handleEdit = (recording) => {
        setSelectedRecording(recording);
        setEditTitle(recording.title);
        setEditDescription(recording.description);
        setEditDialogOpen(true);
    };
    const handleSaveEdit = async () => {
        if (!selectedRecording || !userId)
            return;
        try {
            setError(null);
            setSuccess(null);
            // Since we're storing files in storage, we'll need to handle metadata separately
            // For now, we'll just update the local state
            setRecordings((prev) => prev.map((rec) => rec.id === selectedRecording.id
                ? { ...rec, title: editTitle, description: editDescription }
                : rec));
            setSuccess("Recording updated successfully");
            setEditDialogOpen(false);
        }
        catch (err) {
            console.error("Error updating recording:", err);
            setError("Failed to update recording");
        }
    };
    const handleDownload = async (recording) => {
        try {
            const { data, error } = await supabase.storage
                .from("videos")
                .download(`${userId}/${recording.name}`);
            if (error)
                throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = recording.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            console.error("Error downloading recording:", err);
            setError("Failed to download recording");
        }
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
                        }, children: "Your Recordings" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, children: success })), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", my: 4, children: _jsx(CircularProgress, { sx: { color: "#F44336" } }) })) : recordings.length === 0 ? (_jsx(Typography, { variant: "h6", align: "center", sx: { color: "#fff", mt: 4 }, children: "No recordings found. Start recording to see your videos here." })) : (_jsx(Grid, { container: true, spacing: 4, children: recordings.map((recording) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: {
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    background: "#1a1a1a",
                                    color: "#fff",
                                    borderRadius: 3,
                                    transition: "transform 0.2s",
                                    "&:hover": {
                                        transform: "translateY(-4px)",
                                    },
                                }, children: [_jsx(CardMedia, { component: "img", height: "200", image: recording.thumbnail_url, alt: recording.title, sx: {
                                            objectFit: "cover",
                                            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                                        } }), _jsxs(CardContent, { sx: { flexGrow: 1 }, children: [_jsx(Typography, { gutterBottom: true, variant: "h6", component: "div", sx: { color: "#fff", fontWeight: 600 }, children: recording.title }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { color: "rgba(255, 255, 255, 0.7)" }, children: recording.description }), _jsx(Typography, { variant: "caption", sx: {
                                                    display: "block",
                                                    mt: 1,
                                                    color: "rgba(255, 255, 255, 0.5)",
                                                }, children: new Date(recording.created_at).toLocaleDateString() })] }), _jsxs(CardActions, { sx: { justifyContent: "space-between", p: 2 }, children: [_jsxs(Box, { children: [_jsx(IconButton, { onClick: () => handleEdit(recording), sx: { color: "#fff" }, children: _jsx(EditIcon, {}) }), _jsx(IconButton, { onClick: () => handleDelete(recording), sx: { color: "#fff" }, children: _jsx(DeleteIcon, {}) })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(DownloadIcon, {}), onClick: () => handleDownload(recording), sx: {
                                                    backgroundColor: "#F44336",
                                                    "&:hover": {
                                                        backgroundColor: "#D32F2F",
                                                    },
                                                }, children: "Download" })] })] }) }, recording.id))) })), _jsxs(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), PaperProps: {
                            sx: {
                                background: "#1a1a1a",
                                color: "#fff",
                            },
                        }, children: [_jsx(DialogTitle, { children: "Edit Recording" }), _jsxs(DialogContent, { children: [_jsx(TextField, { autoFocus: true, margin: "dense", label: "Title", fullWidth: true, value: editTitle, onChange: (e) => setEditTitle(e.target.value), sx: {
                                            mt: 2,
                                            "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                                            "& .MuiOutlinedInput-root": {
                                                color: "#fff",
                                                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                                                "&:hover fieldset": {
                                                    borderColor: "rgba(255, 255, 255, 0.5)",
                                                },
                                            },
                                        } }), _jsx(TextField, { margin: "dense", label: "Description", fullWidth: true, multiline: true, rows: 4, value: editDescription, onChange: (e) => setEditDescription(e.target.value), sx: {
                                            mt: 2,
                                            "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                                            "& .MuiOutlinedInput-root": {
                                                color: "#fff",
                                                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                                                "&:hover fieldset": {
                                                    borderColor: "rgba(255, 255, 255, 0.5)",
                                                },
                                            },
                                        } })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), sx: { color: "rgba(255, 255, 255, 0.7)" }, children: "Cancel" }), _jsx(Button, { onClick: handleSaveEdit, variant: "contained", sx: {
                                            backgroundColor: "#F44336",
                                            "&:hover": {
                                                backgroundColor: "#D32F2F",
                                            },
                                        }, children: "Save" })] })] })] })] }));
};
export default Recordings;

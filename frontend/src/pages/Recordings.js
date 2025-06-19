import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Container, Grid, Card, CardContent, CardMedia, CardActions, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, } from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Download as DownloadIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import Navigation from "../components/Navigation";
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
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session }, } = await supabase.auth.getSession();
                if (!session) {
                    navigate("/login");
                    return;
                }
                setUserId(session.user.id);
            }
            catch (error) {
                console.error("Error initializing auth:", error);
                navigate("/login");
            }
        };
        initializeAuth();
    }, [navigate]);
    const fetchRecordings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // First, get the list of actual files in storage
            const { data: storageFiles, error: storageError } = await supabase.storage
                .from("videos")
                .list(userId || "", {
                limit: 100,
                offset: 0,
                sortBy: { column: "name", order: "desc" },
            });
            if (storageError) {
                console.error("Storage error:", storageError);
                throw storageError;
            }
            // Filter for only .mp4 files
            const videoFiles = storageFiles?.filter((file) => file.name.endsWith(".mp4")) || [];
            // Now fetch the metadata from the database
            const { data: dbRecordings, error: dbError } = await supabase
                .from("videos")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            if (dbError) {
                console.error("Database error:", dbError);
                throw dbError;
            }
            // Match database records with actual files in storage
            const recordingsWithUrls = await Promise.all(dbRecordings.map(async (recording) => {
                // Check if the file exists in storage
                const fileExists = videoFiles.some((file) => file.name === recording.filename);
                if (!fileExists) {
                    return {
                        ...recording,
                        video_url: "",
                    };
                }
                try {
                    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                        .from("videos")
                        .createSignedUrl(`${userId}/${recording.filename}`, 3600);
                    if (signedUrlError) {
                        console.error(`Error getting signed URL for ${recording.filename}:`, signedUrlError);
                        return {
                            ...recording,
                            video_url: "",
                        };
                    }
                    return {
                        ...recording,
                        video_url: signedUrlData?.signedUrl || "",
                    };
                }
                catch (err) {
                    console.error(`Error processing ${recording.filename}:`, err);
                    return {
                        ...recording,
                        video_url: "",
                    };
                }
            }));
            // Filter out recordings that don't have a valid video URL
            const validRecordings = recordingsWithUrls.filter((recording) => recording.video_url !== "");
            setRecordings(validRecordings);
        }
        catch (err) {
            console.error("Error in fetchRecordings:", err);
            setError("Failed to fetch recordings");
        }
        finally {
            setLoading(false);
        }
    }, [userId]);
    useEffect(() => {
        if (!userId)
            return;
        fetchRecordings();
    }, [userId, fetchRecordings]);
    const handleDelete = async (recording) => {
        if (!window.confirm(`Are you sure you want to delete recording: ${recording.title}?`)) {
            return;
        }
        try {
            setLoading(true);
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from("videos")
                .remove([`${recording.user_id}/${recording.filename}`]);
            if (storageError) {
                throw storageError;
            }
            // Delete from database
            const { error: dbError } = await supabase
                .from("videos")
                .delete()
                .eq("id", recording.id);
            if (dbError) {
                throw dbError;
            }
            setSuccess("Recording deleted successfully!");
            fetchRecordings(); // Re-fetch recordings to update the list
        }
        catch (err) {
            console.error("Error deleting recording:", err);
            setError(`Failed to delete recording: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000); // Clear success message
            setTimeout(() => setError(null), 3000); // Clear error message
        }
    };
    const handleEdit = (recording) => {
        setSelectedRecording(recording);
        setEditTitle(recording.title);
        setEditDescription(recording.description);
        setEditDialogOpen(true);
    };
    const handleSaveEdit = async () => {
        if (!selectedRecording)
            return;
        try {
            setLoading(true);
            const { error: dbError } = await supabase
                .from("videos")
                .update({ title: editTitle, description: editDescription })
                .eq("id", selectedRecording.id);
            if (dbError) {
                throw dbError;
            }
            setSuccess("Recording updated successfully!");
            setEditDialogOpen(false);
            fetchRecordings();
        }
        catch (err) {
            console.error("Error updating recording:", err);
            setError(`Failed to update recording: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000);
            setTimeout(() => setError(null), 3000);
        }
    };
    const handleDownload = async (recording) => {
        if (!recording.video_url) {
            alert("Video URL not available.");
            return;
        }
        window.open(recording.video_url, "_blank");
    };
    return (_jsxs(Box, { sx: { minHeight: "100vh", bgcolor: "background.default" }, children: [_jsx(Navigation, {}), _jsxs(Container, { maxWidth: "lg", sx: { pt: 12, pb: 8 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, sx: { color: "text.primary", fontWeight: 700 }, children: "Your Recordings" }), loading && (_jsx(CircularProgress, { sx: { display: "block", mx: "auto", my: 4 } })), error && (_jsx(Alert, { severity: "error", sx: { my: 2 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { my: 2 }, children: success })), !loading && recordings.length === 0 && !error && (_jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mt: 4 }, children: "No recordings found. Make a booking to start recording!" })), _jsx(Grid, { container: true, spacing: 4, children: recordings.map((recording) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Card, { sx: { bgcolor: "background.paper" }, children: [recording.video_url ? (_jsx(CardMedia, { component: "video", src: recording.video_url, controls: true, sx: { height: 200, bgcolor: "black" } })) : (_jsx(Box, { sx: {
                                            height: 200,
                                            bgcolor: "grey.900",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "grey.500",
                                        }, children: "Video not available" })), _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", component: "div", children: recording.title }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: recording.description }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Recorded: ", new Date(recording.created_at).toLocaleString()] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Filename: ", recording.filename] })] }), _jsxs(CardActions, { children: [_jsx(Button, { size: "small", startIcon: _jsx(DownloadIcon, {}), onClick: () => handleDownload(recording), children: "Download" }), _jsx(Button, { size: "small", startIcon: _jsx(EditIcon, {}), onClick: () => handleEdit(recording), children: "Edit" }), _jsx(Button, { size: "small", color: "error", startIcon: _jsx(DeleteIcon, {}), onClick: () => handleDelete(recording), children: "Delete" })] })] }) }, recording.id))) }), _jsxs(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), children: [_jsx(DialogTitle, { children: "Edit Recording" }), _jsxs(DialogContent, { children: [_jsx(TextField, { autoFocus: true, margin: "dense", id: "title", label: "Title", type: "text", fullWidth: true, variant: "standard", value: editTitle, onChange: (e) => setEditTitle(e.target.value), sx: { mb: 2 } }), _jsx(TextField, { margin: "dense", id: "description", label: "Description", type: "text", fullWidth: true, multiline: true, rows: 4, variant: "standard", value: editDescription, onChange: (e) => setEditDescription(e.target.value) })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleSaveEdit, children: "Save" })] })] })] })] }));
};
export default Recordings;

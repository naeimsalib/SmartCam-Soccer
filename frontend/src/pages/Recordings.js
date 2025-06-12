import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Typography, Container, Grid, Card, CardContent, CardMedia, CardActions, Button, IconButton, CircularProgress, Alert, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, } from "@mui/material";
import { PlayArrow as PlayIcon, Delete as DeleteIcon, Edit as EditIcon, Download as DownloadIcon, } from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
const Recordings = () => {
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
        const fetchUserId = async () => {
            const { data: { session }, } = await supabase.auth.getSession();
            setUserId(session?.user?.id || null);
        };
        fetchUserId();
    }, []);
    useEffect(() => {
        fetchRecordings();
    }, []);
    const fetchRecordings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("recordings")
                .select("*")
                .order("created_at", { ascending: false });
            if (error)
                throw error;
            setRecordings(data || []);
        }
        catch (err) {
            setError("Failed to fetch recordings");
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        try {
            setError(null);
            setSuccess(null);
            const { error } = await supabase.from("recordings").delete().eq("id", id);
            if (error)
                throw error;
            setSuccess("Recording deleted successfully");
            fetchRecordings();
        }
        catch (err) {
            setError("Failed to delete recording");
            console.error(err);
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
            setError(null);
            setSuccess(null);
            const { error } = await supabase
                .from("recordings")
                .update({
                title: editTitle,
                description: editDescription,
            })
                .eq("id", selectedRecording.id);
            if (error)
                throw error;
            setSuccess("Recording updated successfully");
            setEditDialogOpen(false);
            fetchRecordings();
        }
        catch (err) {
            setError("Failed to update recording");
            console.error(err);
        }
    };
    const handleDownload = async (recording) => {
        try {
            const { data, error } = await supabase.storage
                .from("recordings")
                .download(recording.video_url);
            if (error)
                throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${recording.title}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            setError("Failed to download recording");
            console.error(err);
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
                                                }, children: new Date(recording.created_at).toLocaleDateString() })] }), _jsxs(CardActions, { sx: { justifyContent: "space-between", p: 2 }, children: [_jsxs(Box, { children: [_jsx(IconButton, { size: "small", onClick: () => handleEdit(recording), sx: { color: "#F44336" }, children: _jsx(EditIcon, {}) }), _jsx(IconButton, { size: "small", onClick: () => handleDelete(recording.id), sx: { color: "#F44336" }, children: _jsx(DeleteIcon, {}) })] }), _jsxs(Box, { children: [_jsx(IconButton, { size: "small", onClick: () => handleDownload(recording), sx: { color: "#F44336" }, children: _jsx(DownloadIcon, {}) }), _jsx(Button, { variant: "contained", size: "small", startIcon: _jsx(PlayIcon, {}), onClick: () => window.open(recording.video_url, "_blank"), sx: {
                                                            ml: 1,
                                                            background: "#F44336",
                                                            "&:hover": {
                                                                background: "#d32f2f",
                                                            },
                                                        }, children: "Play" })] })] })] }) }, recording.id))) })), _jsxs(Dialog, { open: editDialogOpen, onClose: () => setEditDialogOpen(false), PaperProps: {
                            sx: {
                                background: "#1a1a1a",
                                color: "#fff",
                                minWidth: "400px",
                            },
                        }, children: [_jsx(DialogTitle, { children: "Edit Recording" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 3, sx: { mt: 2 }, children: [_jsx(TextField, { label: "Title", value: editTitle, onChange: (e) => setEditTitle(e.target.value), fullWidth: true, sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    color: "#fff",
                                                    "& fieldset": {
                                                        borderColor: "rgba(255, 255, 255, 0.23)",
                                                    },
                                                    "&:hover fieldset": {
                                                        borderColor: "rgba(255, 255, 255, 0.5)",
                                                    },
                                                },
                                                "& .MuiInputLabel-root": {
                                                    color: "rgba(255, 255, 255, 0.7)",
                                                },
                                            } }), _jsx(TextField, { label: "Description", value: editDescription, onChange: (e) => setEditDescription(e.target.value), fullWidth: true, multiline: true, rows: 4, sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    color: "#fff",
                                                    "& fieldset": {
                                                        borderColor: "rgba(255, 255, 255, 0.23)",
                                                    },
                                                    "&:hover fieldset": {
                                                        borderColor: "rgba(255, 255, 255, 0.5)",
                                                    },
                                                },
                                                "& .MuiInputLabel-root": {
                                                    color: "rgba(255, 255, 255, 0.7)",
                                                },
                                            } })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEditDialogOpen(false), sx: { color: "#fff" }, children: "Cancel" }), _jsx(Button, { onClick: handleSaveEdit, variant: "contained", sx: {
                                            background: "#F44336",
                                            "&:hover": {
                                                background: "#d32f2f",
                                            },
                                        }, children: "Save Changes" })] })] })] })] }));
};
export default Recordings;

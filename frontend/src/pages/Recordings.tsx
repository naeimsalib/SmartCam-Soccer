import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { supabase } from "../supabaseClient";
import Navigation from "../components/Navigation";
import { useNavigate } from "react-router-dom";

interface Recording {
  id: string;
  name: string;
  title: string;
  description: string;
  video_url: string;
  created_at: string;
  user_id: string;
  filename: string;
}

const Recordings = () => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/login");
          return;
        }

        setUserId(session.user.id);
      } catch (error) {
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
      const videoFiles =
        storageFiles?.filter((file) => file.name.endsWith(".mp4")) || [];

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
      const recordingsWithUrls = await Promise.all(
        dbRecordings.map(async (recording) => {
          // Check if the file exists in storage
          const fileExists = videoFiles.some(
            (file) => file.name === recording.filename
          );

          if (!fileExists) {
            return {
              ...recording,
              video_url: "",
            };
          }

          try {
            const { data: signedUrlData, error: signedUrlError } =
              await supabase.storage
                .from("videos")
                .createSignedUrl(`${userId}/${recording.filename}`, 3600);

            if (signedUrlError) {
              console.error(
                `Error getting signed URL for ${recording.filename}:`,
                signedUrlError
              );
              return {
                ...recording,
                video_url: "",
              };
            }

            return {
              ...recording,
              video_url: signedUrlData?.signedUrl || "",
            };
          } catch (err) {
            console.error(`Error processing ${recording.filename}:`, err);
            return {
              ...recording,
              video_url: "",
            };
          }
        })
      );

      // Filter out recordings that don't have a valid video URL
      const validRecordings = recordingsWithUrls.filter(
        (recording) => recording.video_url !== ""
      );
      setRecordings(validRecordings);
    } catch (err) {
      console.error("Error in fetchRecordings:", err);
      setError("Failed to fetch recordings");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchRecordings();
  }, [userId, fetchRecordings]);

  const handleDelete = async (recording: Recording) => {
    if (
      !window.confirm(
        `Are you sure you want to delete recording: ${recording.title}?`
      )
    ) {
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
    } catch (err) {
      console.error("Error deleting recording:", err);
      setError(
        `Failed to delete recording: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000); // Clear success message
      setTimeout(() => setError(null), 3000); // Clear error message
    }
  };

  const handleEdit = (recording: Recording) => {
    setSelectedRecording(recording);
    setEditTitle(recording.title);
    setEditDescription(recording.description);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecording) return;
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
    } catch (err) {
      console.error("Error updating recording:", err);
      setError(
        `Failed to update recording: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDownload = async (recording: Recording) => {
    if (!recording.video_url) {
      alert("Video URL not available.");
      return;
    }
    window.open(recording.video_url, "_blank");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ color: "text.primary", fontWeight: 700 }}
        >
          Your Recordings
        </Typography>
        {loading && (
          <CircularProgress sx={{ display: "block", mx: "auto", my: 4 }} />
        )}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            {success}
          </Alert>
        )}
        {!loading && recordings.length === 0 && !error && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 4 }}>
            No recordings found. Make a booking to start recording!
          </Typography>
        )}
        <Grid container spacing={4}>
          {recordings.map((recording) => (
            <Grid item key={recording.id} xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: "background.paper" }}>
                {recording.video_url ? (
                  <CardMedia
                    component="video"
                    src={recording.video_url}
                    controls
                    sx={{ height: 200, bgcolor: "black" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      bgcolor: "grey.900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "grey.500",
                    }}
                  >
                    Video not available
                  </Box>
                )}
                <CardContent>
                  <Typography variant="h6" component="div">
                    {recording.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recording.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recorded: {new Date(recording.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filename: {recording.filename}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(recording)}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(recording)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(recording)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Edit Recording Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Recording</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="title"
              label="Title"
              type="text"
              fullWidth
              variant="standard"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="standard"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Recordings;

import React, { useState, useEffect } from "react";
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
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

interface Recording {
  id: string;
  name: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
  user_id: string;
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

  // Check authentication and fetch user ID
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

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
      } catch (err) {
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
      const { data: bucketData, error: bucketError } =
        await supabase.storage.getBucket("videos");

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
      const recordingsWithUrls = await Promise.all(
        files
          .filter((file) => file.name.endsWith(".mp4")) // Only process video files
          .map(async (file) => {
            try {
              // Get signed URL for the video
              const { data: videoData, error: videoError } =
                await supabase.storage
                  .from("videos")
                  .createSignedUrl(`${userId}/${file.name}`, 3600);

              if (videoError) {
                console.error(
                  `Error getting signed URL for ${file.name}:`,
                  videoError
                );
                return null;
              }

              // Get signed URL for the thumbnail
              const thumbnailName = file.name.replace(".mp4", ".jpg");
              const { data: thumbnailData, error: thumbnailError } =
                await supabase.storage
                  .from("videos")
                  .createSignedUrl(`${userId}/${thumbnailName}`, 3600);

              if (thumbnailError) {
                console.error(
                  `Error getting signed URL for thumbnail ${thumbnailName}:`,
                  thumbnailError
                );
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
            } catch (err) {
              console.error(`Error processing file ${file.name}:`, err);
              return null;
            }
          })
      );

      // Filter out any null entries from failed processing
      const validRecordings = recordingsWithUrls.filter(
        (rec) => rec !== null
      ) as Recording[];
      console.log("Valid recordings with URLs:", validRecordings);
      setRecordings(validRecordings);
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch recordings. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recording: Recording) => {
    try {
      setError(null);
      setSuccess(null);

      // Delete the video file
      const { error: videoError } = await supabase.storage
        .from("videos")
        .remove([`${userId}/${recording.name}`]);

      if (videoError) throw videoError;

      // Delete the thumbnail file
      const { error: thumbnailError } = await supabase.storage
        .from("videos")
        .remove([`${userId}/${recording.name.replace(".mp4", ".jpg")}`]);

      if (thumbnailError) throw thumbnailError;

      setSuccess("Recording deleted successfully");
      await fetchRecordings();
    } catch (err) {
      console.error("Error deleting recording:", err);
      setError("Failed to delete recording");
    }
  };

  const handleEdit = (recording: Recording) => {
    setSelectedRecording(recording);
    setEditTitle(recording.title);
    setEditDescription(recording.description);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecording || !userId) return;

    try {
      setError(null);
      setSuccess(null);

      // Since we're storing files in storage, we'll need to handle metadata separately
      // For now, we'll just update the local state
      setRecordings((prev) =>
        prev.map((rec) =>
          rec.id === selectedRecording.id
            ? { ...rec, title: editTitle, description: editDescription }
            : rec
        )
      );

      setSuccess("Recording updated successfully");
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating recording:", err);
      setError("Failed to update recording");
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const { data, error } = await supabase.storage
        .from("videos")
        .download(`${userId}/${recording.name}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = recording.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading recording:", err);
      setError("Failed to download recording");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
      }}
    >
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 10 }}>
        <Typography
          variant="h3"
          fontWeight={900}
          sx={{
            color: "#fff",
            mb: 6,
            fontFamily: "Montserrat, sans-serif",
            textAlign: "center",
          }}
        >
          Your Recordings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress sx={{ color: "#F44336" }} />
          </Box>
        ) : recordings.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ color: "#fff", mt: 4 }}>
            No recordings found. Start recording to see your videos here.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {recordings.map((recording) => (
              <Grid item xs={12} sm={6} md={4} key={recording.id}>
                <Card
                  sx={{
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
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={recording.thumbnail_url}
                    alt={recording.title}
                    sx={{
                      objectFit: "cover",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="div"
                      sx={{ color: "#fff", fontWeight: 600 }}
                    >
                      {recording.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      {recording.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 1,
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      {new Date(recording.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
                    <Box>
                      <IconButton
                        onClick={() => handleEdit(recording)}
                        sx={{ color: "#fff" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(recording)}
                        sx={{ color: "#fff" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(recording)}
                      sx={{
                        backgroundColor: "#F44336",
                        "&:hover": {
                          backgroundColor: "#D32F2F",
                        },
                      }}
                    >
                      Download
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          PaperProps={{
            sx: {
              background: "#1a1a1a",
              color: "#fff",
            },
          }}
        >
          <DialogTitle>Edit Recording</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              sx={{
                mt: 2,
                "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                },
              }}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              sx={{
                mt: 2,
                "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditDialogOpen(false)}
              sx={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              sx={{
                backgroundColor: "#F44336",
                "&:hover": {
                  backgroundColor: "#D32F2F",
                },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Recordings;

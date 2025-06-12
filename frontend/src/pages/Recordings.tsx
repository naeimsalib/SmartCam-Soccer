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

interface Recording {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
  user_id: string;
}

const Recordings = () => {
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
    const fetchUserId = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

      if (error) throw error;
      setRecordings(data || []);
    } catch (err) {
      setError("Failed to fetch recordings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      const { error } = await supabase.from("recordings").delete().eq("id", id);

      if (error) throw error;
      setSuccess("Recording deleted successfully");
      fetchRecordings();
    } catch (err) {
      setError("Failed to delete recording");
      console.error(err);
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
      setError(null);
      setSuccess(null);
      const { error } = await supabase
        .from("recordings")
        .update({
          title: editTitle,
          description: editDescription,
        })
        .eq("id", selectedRecording.id);

      if (error) throw error;
      setSuccess("Recording updated successfully");
      setEditDialogOpen(false);
      fetchRecordings();
    } catch (err) {
      setError("Failed to update recording");
      console.error(err);
    }
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const { data, error } = await supabase.storage
        .from("recordings")
        .download(recording.video_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${recording.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download recording");
      console.error(err);
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
                        size="small"
                        onClick={() => handleEdit(recording)}
                        sx={{ color: "#F44336" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(recording.id)}
                        sx={{ color: "#F44336" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(recording)}
                        sx={{ color: "#F44336" }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() =>
                          window.open(recording.video_url, "_blank")
                        }
                        sx={{
                          ml: 1,
                          background: "#F44336",
                          "&:hover": {
                            background: "#d32f2f",
                          },
                        }}
                      >
                        Play
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          PaperProps={{
            sx: {
              background: "#1a1a1a",
              color: "#fff",
              minWidth: "400px",
            },
          }}
        >
          <DialogTitle>Edit Recording</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                fullWidth
                sx={{
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
                }}
              />
              <TextField
                label="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                sx={{
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
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditDialogOpen(false)}
              sx={{ color: "#fff" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              sx={{
                background: "#F44336",
                "&:hover": {
                  background: "#d32f2f",
                },
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Recordings;

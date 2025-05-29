import * as React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import { supabase } from "../supabaseClient";

const Recordings = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserIdAndVideos = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  const getVideoUrl = (filename: string) =>
    supabase.storage.from("videos").getPublicUrl(`${userId}/${filename}`).data
      .publicUrl;

  const handlePlay = (filename: string) => {
    setPlayUrl(getVideoUrl(filename));
  };

  const handleDelete = async (filename: string) => {
    setDeleteTarget(filename);
  };

  const confirmDelete = async () => {
    if (!userId || !deleteTarget) return;
    await supabase.storage.from("videos").remove([`${userId}/${deleteTarget}`]);
    setVideos(videos.filter((v) => v.name !== deleteTarget));
    setDeleteTarget(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        py: 6,
      }}
    >
      <Typography variant="h4" align="center" fontWeight={500} mb={4}>
        Your Recordings
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : videos.length === 0 ? (
        <Typography color="text.secondary">
          No videos found in your folder.
        </Typography>
      ) : (
        <Grid container spacing={3} justifyContent="center" maxWidth="md">
          {videos.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.name}>
              <Card
                elevation={4}
                sx={{
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#f7fafc",
                }}
              >
                <CardContent sx={{ width: "100%" }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    noWrap
                    gutterBottom
                  >
                    {file.name}
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <video
                      src={getVideoUrl(file.name)}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: 180,
                        borderRadius: 8,
                        background: "#000",
                      }}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", width: "100%" }}>
                  <IconButton
                    color="primary"
                    onClick={() => handlePlay(file.name)}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(file.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {/* Video Player Dialog */}
      <Dialog
        open={!!playUrl}
        onClose={() => setPlayUrl(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Play Video</DialogTitle>
        <DialogContent>
          {playUrl && (
            <video src={playUrl} controls style={{ width: "100%" }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlayUrl(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Video</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this video?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recordings;

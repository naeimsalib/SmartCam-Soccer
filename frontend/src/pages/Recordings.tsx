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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { supabase } from "../supabaseClient";
import Tooltip from "@mui/material/Tooltip";

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

        let mp4Files: any[] = [];
        if (data) {
          for (const item of data) {
            if (item.name.endsWith(".mp4")) {
              mp4Files.push({
                name: item.name,
                fullPath: uid + "/" + item.name,
              });
            } else if (item.metadata && item.metadata.type === "folder") {
              const { data: subData, error: subError } = await supabase.storage
                .from("videos")
                .list(uid + "/" + item.name + "/", { limit: 100 });
              if (subError) {
                console.error("Error fetching subfolder videos:", subError);
              }
              if (subData) {
                mp4Files = mp4Files.concat(
                  subData
                    .filter((file) => file.name.endsWith(".mp4"))
                    .map((file) => ({
                      name: file.name,
                      fullPath: uid + "/" + item.name + "/" + file.name,
                    }))
                );
              }
            }
          }
        }
        console.log("MP4 files found:", mp4Files);
        setVideos(mp4Files);
      }
      setLoading(false);
    };
    fetchUserIdAndVideos();
  }, []);

  const getSignedVideoUrl = async (fullPath: string) => {
    if (!userId) return null;
    const { data, error } = await supabase.storage
      .from("videos")
      .createSignedUrl(fullPath, 60 * 60); // 1 hour expiry
    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    return data.signedUrl;
  };

  const handlePlay = async (fullPath: string) => {
    const url = await getSignedVideoUrl(fullPath);
    if (url) setPlayUrl(url);
  };

  const handleDelete = async (fullPath: string) => {
    setDeleteTarget(fullPath);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.storage
      .from("videos")
      .remove([deleteTarget]);
    if (!error) {
      setVideos(videos.filter((v) => v.fullPath !== deleteTarget));
      setDeleteTarget(null);
    } else {
      alert("Failed to delete video: " + error.message);
    }
  };

  // Robust download handler for signed URLs
  const handleDownload = async (file: { name: string; fullPath: string }) => {
    const url = await getSignedVideoUrl(file.fullPath);
    if (url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch video for download");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } catch (err) {
        alert("Failed to download video: " + (err as Error).message);
      }
    } else {
      alert("Could not generate a download link for this video.");
    }
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
      <Typography
        variant="h4"
        align="center"
        fontWeight={500}
        mb={4}
        sx={{ mt: 8 }}
      >
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
            <Grid item xs={12} sm={6} md={4} key={file.fullPath}>
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
                  <Tooltip title={file.name} placement="top" arrow>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      noWrap={false}
                      gutterBottom
                      sx={{
                        wordBreak: "break-all",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                    >
                      {file.name}
                    </Typography>
                  </Tooltip>
                  <Typography
                    color="info.main"
                    variant="body2"
                    align="center"
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <InfoOutlinedIcon
                      fontSize="small"
                      sx={{ verticalAlign: "middle" }}
                    />
                    Video preview is disabled for privacy. Click below to
                    download your recording.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", width: "100%" }}>
                  <IconButton
                    color="primary"
                    onClick={async () => {
                      await handlePlay(file.fullPath);
                    }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(file.fullPath)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleDownload(file)}
                  >
                    <Button size="small">Download</Button>
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

function VideoPlayer({
  fullPath,
  getSignedVideoUrl,
}: {
  fullPath: string;
  getSignedVideoUrl: (fullPath: string) => Promise<string | null>;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let mounted = true;
    getSignedVideoUrl(fullPath).then((u) => {
      if (mounted) setUrl(u);
    });
    return () => {
      mounted = false;
    };
  }, [fullPath, getSignedVideoUrl]);
  if (!url)
    return (
      <Box
        sx={{ width: "100%", height: 180, background: "#eee", borderRadius: 2 }}
      />
    );
  return (
    <>
      <video
        src={url}
        controls
        style={{
          width: "100%",
          maxHeight: 180,
          borderRadius: 8,
          background: "#000",
        }}
        onError={() =>
          setError("Failed to load video. Please try again or download.")
        }
      />
      {error && (
        <Typography color="error" variant="body2" align="center">
          {error}
        </Typography>
      )}
    </>
  );
}

export default Recordings;

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
  Divider,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShareIcon from "@mui/icons-material/Share";
import { supabase } from "../supabaseClient";
import Tooltip from "@mui/material/Tooltip";
import Navbar from "../components/Navbar";

interface VideoFile {
  name: string;
  fullPath: string;
  date: string;
  startTime: string;
  endTime: string;
}

const Recordings = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [playUrl, setPlayUrl] = useState<string | null>(null);

  const parseVideoFilename = (filename: string): VideoFile | null => {
    try {
      // Extract date and time from filename (format: recording_YYYYMMDD_HHMM_userid.mp4)
      const match = filename.match(/recording_(\d{8})_(\d{4})_/);
      if (!match) return null;

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
    } catch (error) {
      console.error("Error parsing video filename:", error);
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const fetchVideos = async (uid: string) => {
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

    let mp4Files: VideoFile[] = [];
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
        } else if (item.metadata && item.metadata.type === "folder") {
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
              .filter((video): video is VideoFile => video !== null);
            mp4Files = mp4Files.concat(subVideos);
          }
        }
      }
    }

    // Sort videos by date (oldest first)
    mp4Files.sort((a, b) => {
      const matchA = a.name.match(/recording_(\d{8})_(\d{4})_/);
      const matchB = b.name.match(/recording_(\d{8})_(\d{4})_/);

      if (!matchA || !matchB) return 0;

      const [, dateStrA, timeStrA] = matchA;
      const [, dateStrB, timeStrB] = matchB;

      const dateA = new Date(
        `${dateStrA.substring(0, 4)}-${dateStrA.substring(
          4,
          6
        )}-${dateStrA.substring(6, 8)}T${timeStrA.substring(
          0,
          2
        )}:${timeStrA.substring(2, 4)}:00`
      );
      const dateB = new Date(
        `${dateStrB.substring(0, 4)}-${dateStrB.substring(
          4,
          6
        )}-${dateStrB.substring(6, 8)}T${timeStrB.substring(
          0,
          2
        )}:${timeStrB.substring(2, 4)}:00`
      );

      return dateA.getTime() - dateB.getTime(); // Oldest first
    });

    console.log("MP4 files found:", mp4Files);
    setVideos(mp4Files);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchVideos(userId);

    // Subscribe to storage changes
    const channel = supabase
      .channel("storage-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "storage",
          table: "objects",
          filter: `bucket_id=eq.videos AND name=ilike.${userId}/%`,
        },
        () => {
          // Refetch videos when any change occurs in the user's video folder
          fetchVideos(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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

  const handlePlay = async (fullPath: string) => {
    const url = await getSignedVideoUrl(fullPath);
    if (url) setPlayUrl(url);
  };

  // Group videos by date
  const groupedVideos = videos.reduce((groups, video) => {
    const date = video.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(video);
    return groups;
  }, {} as Record<string, VideoFile[]>);

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
      <Navbar />
      <Typography
        variant="h4"
        align="center"
        fontWeight={500}
        mb={4}
        sx={{ mt: 10 }}
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
          {Object.entries(groupedVideos).map(([date, dateVideos]) => (
            <React.Fragment key={date}>
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  sx={{
                    mt: 4,
                    mb: 2,
                    color: "primary.main",
                    fontWeight: 500,
                  }}
                >
                  {date}
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              {dateVideos.map((file) => (
                <Grid item xs={12} sm={6} md={4} key={file.fullPath}>
                  <Card
                    elevation={6}
                    sx={{
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
                    }}
                  >
                    <CardContent
                      sx={{
                        width: "100%",
                        p: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          py: 2,
                          background: "#f7fafc",
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                        }}
                      >
                        <Tooltip title={file.name} placement="top" arrow>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            noWrap={false}
                            gutterBottom
                            sx={{
                              wordBreak: "break-all",
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                              textAlign: "center",
                              fontSize: 18,
                              letterSpacing: 0.2,
                            }}
                          >
                            {`${file.startTime} - ${file.endTime}`}
                          </Typography>
                        </Tooltip>
                        <Divider sx={{ mt: 1, mb: 0 }} />
                      </Box>
                      {/* Responsive 16:9 video preview */}
                      <Box
                        sx={{
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
                        }}
                      >
                        <VideoPlayer
                          fullPath={file.fullPath}
                          getSignedVideoUrl={getSignedVideoUrl}
                          height="100%"
                          width="100%"
                        />
                      </Box>
                    </CardContent>
                    <CardActions
                      sx={{
                        justifyContent: "center",
                        width: "100%",
                        mb: 2,
                        px: 2,
                        pt: 1,
                        pb: 2,
                        display: "block",
                      }}
                    >
                      <Grid
                        container
                        spacing={2}
                        sx={{ width: "100%", margin: 0 }}
                      >
                        <Grid item xs={6}>
                          <Button
                            onClick={async () =>
                              await handlePlay(file.fullPath)
                            }
                            aria-label="Play video"
                            sx={{
                              width: "100%",
                              flexDirection: "column",
                              py: 2,
                              borderRadius: 3,
                              background: "#e3f2fd",
                              color: "#1976d2",
                              boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.08)",
                              transition:
                                "background 0.2s, box-shadow 0.2s, transform 0.2s",
                              "&:hover": {
                                background: "#bbdefb",
                                boxShadow:
                                  "0 4px 16px 0 rgba(25, 118, 210, 0.16)",
                                transform: "translateY(-2px) scale(1.03)",
                              },
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 15,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PlayArrowIcon sx={{ fontSize: 28, mb: 0.5 }} />
                            Play
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            onClick={async () => {
                              const url = await getSignedVideoUrl(
                                file.fullPath
                              );
                              if (url) setShareUrl(url);
                            }}
                            aria-label="Share video"
                            sx={{
                              width: "100%",
                              flexDirection: "column",
                              py: 2,
                              borderRadius: 3,
                              background: "#e1f5fe",
                              color: "#0288d1",
                              boxShadow: "0 2px 8px 0 rgba(2, 136, 209, 0.08)",
                              transition:
                                "background 0.2s, box-shadow 0.2s, transform 0.2s",
                              "&:hover": {
                                background: "#b3e5fc",
                                boxShadow:
                                  "0 4px 16px 0 rgba(2, 136, 209, 0.16)",
                                transform: "translateY(-2px) scale(1.03)",
                              },
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 15,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ShareIcon sx={{ fontSize: 26, mb: 0.5 }} />
                            Share
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            onClick={() => handleDelete(file.fullPath)}
                            aria-label="Delete video"
                            sx={{
                              width: "100%",
                              flexDirection: "column",
                              py: 2,
                              borderRadius: 3,
                              background: "#ffebee",
                              color: "#d32f2f",
                              boxShadow: "0 2px 8px 0 rgba(211, 47, 47, 0.08)",
                              transition:
                                "background 0.2s, box-shadow 0.2s, transform 0.2s",
                              "&:hover": {
                                background: "#ffcdd2",
                                boxShadow:
                                  "0 4px 16px 0 rgba(211, 47, 47, 0.16)",
                                transform: "translateY(-2px) scale(1.03)",
                              },
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 15,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 26, mb: 0.5 }} />
                            Delete
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            onClick={() => handleDownload(file)}
                            aria-label="Download video"
                            sx={{
                              width: "100%",
                              flexDirection: "column",
                              py: 2,
                              borderRadius: 3,
                              background: "#e8f5e9",
                              color: "#388e3c",
                              boxShadow: "0 2px 8px 0 rgba(56, 142, 60, 0.08)",
                              transition:
                                "background 0.2s, box-shadow 0.2s, transform 0.2s",
                              "&:hover": {
                                background: "#c8e6c9",
                                boxShadow:
                                  "0 4px 16px 0 rgba(56, 142, 60, 0.16)",
                                transform: "translateY(-2px) scale(1.03)",
                              },
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: 15,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <InfoOutlinedIcon
                              sx={{ fontSize: 24, mb: 0.5, color: "#388e3c" }}
                            />
                            Download
                          </Button>
                        </Grid>
                      </Grid>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </React.Fragment>
          ))}
        </Grid>
      )}
      {/* Share Dialog */}
      <Dialog open={!!shareUrl} onClose={() => setShareUrl(null)}>
        <DialogTitle>Share Video</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Anyone with this link can view and download the video (link expires
            in 1 hour).
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <input
              type="text"
              value={shareUrl || ""}
              readOnly
              style={{ width: "100%" }}
              onFocus={(e) => e.target.select()}
            />
            <Button
              onClick={() => {
                if (shareUrl) navigator.clipboard.writeText(shareUrl);
              }}
            >
              Copy
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button
              href={`mailto:?subject=Check out this video&body=${encodeURIComponent(
                shareUrl || ""
              )}`}
              target="_blank"
              sx={{ mr: 1 }}
            >
              Share via Email
            </Button>
            <Button
              href={`sms:?body=${encodeURIComponent(shareUrl || "")}`}
              target="_blank"
            >
              Share via SMS
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            <video src={shareUrl || ""} controls style={{ width: "100%" }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareUrl(null)}>Close</Button>
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
            <video
              src={playUrl}
              controls
              style={{ width: "100%", height: "70vh" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlayUrl(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function VideoPlayer({
  fullPath,
  getSignedVideoUrl,
  height = "100%",
  width = "100%",
}: {
  fullPath: string;
  getSignedVideoUrl: (fullPath: string) => Promise<string | null>;
  height?: number | string;
  width?: number | string;
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
    return <Box sx={{ width, height, background: "#eee", borderRadius: 2 }} />;
  return (
    <>
      <video
        src={url}
        controls
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
          background: "#000",
          objectFit: "contain",
          display: "block",
          margin: "0 auto",
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

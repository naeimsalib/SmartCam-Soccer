import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import InfoIcon from "@mui/icons-material/Info";

// Mock data for the graph
const data = [
  { name: "Mon", reservations: 4 },
  { name: "Tue", reservations: 3 },
  { name: "Wed", reservations: 5 },
  { name: "Thu", reservations: 2 },
  { name: "Fri", reservations: 6 },
  { name: "Sat", reservations: 8 },
  { name: "Sun", reservations: 7 },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: { xs: "72px", md: "80px" },
      }}
    >
      <Container maxWidth="md" sx={{ mt: 0, mb: 0 }}>
        {/* Graph Section */}
        <Paper sx={{ p: 3, mb: 4, width: "100%" }} elevation={3}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Reservation Trends
          </Typography>
          <Box sx={{ height: { xs: 250, md: 350 }, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reservations" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Actions and Activity Section */}
        <Grid container spacing={4} justifyContent="center">
          {/* Quick Actions */}
          <Grid sx={{ width: "100%", mb: 2 }}>
            <Paper
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                height: "100%",
              }}
              elevation={2}
            >
              <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
              >
                Quick Actions
              </Typography>
              <Stack spacing={2} sx={{ width: "100%" }}>
                <Button
                  variant="outlined"
                  startIcon={<EventAvailableIcon />}
                  fullWidth
                  onClick={() => navigate("/calendar")}
                  sx={{ justifyContent: "flex-start", fontWeight: 600 }}
                >
                  Book a new reservation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VideoLibraryIcon />}
                  fullWidth
                  onClick={() => navigate("/recordings")}
                  sx={{ justifyContent: "flex-start", fontWeight: 600 }}
                >
                  View your recordings
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid sx={{ width: "100%", mb: 2 }}>
            <Paper
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                height: "100%",
              }}
              elevation={2}
            >
              <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
              >
                Recent Activity
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <InfoIcon
                    sx={{
                      verticalAlign: "middle",
                      mr: 1,
                      color: "primary.main",
                    }}
                  />
                  Last recording: 2 hours ago
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <EventAvailableIcon
                    sx={{
                      verticalAlign: "middle",
                      mr: 1,
                      color: "primary.main",
                    }}
                  />
                  Next game: Tomorrow at 3 PM
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <VideoLibraryIcon
                    sx={{
                      verticalAlign: "middle",
                      mr: 1,
                      color: "primary.main",
                    }}
                  />
                  3 new recordings available
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;

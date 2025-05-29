import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from "recharts";
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
    return (_jsx(Box, { sx: {
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
        }, children: _jsxs(Container, { maxWidth: "md", sx: { mt: 0, mb: 0 }, children: [_jsxs(Paper, { sx: { p: 3, mb: 4, width: "100%" }, elevation: 3, children: [_jsx(Typography, { component: "h2", variant: "h6", color: "primary", gutterBottom: true, children: "Reservation Trends" }), _jsx(Box, { sx: { height: { xs: 250, md: 350 }, width: "100%" }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data, margin: {
                                        top: 5,
                                        right: 30,
                                        left: 0,
                                        bottom: 5,
                                    }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "reservations", fill: "#1976d2" })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 4, justifyContent: "center", children: [_jsx(Grid, { sx: { width: "100%", mb: 2 }, children: _jsxs(Paper, { sx: {
                                    p: 3,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    height: "100%",
                                }, elevation: 2, children: [_jsx(Typography, { component: "h2", variant: "h6", color: "primary", gutterBottom: true, children: "Quick Actions" }), _jsxs(Stack, { spacing: 2, sx: { width: "100%" }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(EventAvailableIcon, {}), fullWidth: true, onClick: () => navigate("/calendar"), sx: { justifyContent: "flex-start", fontWeight: 600 }, children: "Book a new reservation" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(VideoLibraryIcon, {}), fullWidth: true, onClick: () => navigate("/recordings"), sx: { justifyContent: "flex-start", fontWeight: 600 }, children: "View your recordings" })] })] }) }), _jsx(Grid, { sx: { width: "100%", mb: 2 }, children: _jsxs(Paper, { sx: {
                                    p: 3,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    height: "100%",
                                }, elevation: 2, children: [_jsx(Typography, { component: "h2", variant: "h6", color: "primary", gutterBottom: true, children: "Recent Activity" }), _jsxs(Box, { sx: { mt: 2 }, children: [_jsxs(Typography, { variant: "body1", gutterBottom: true, children: [_jsx(InfoIcon, { sx: {
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            color: "primary.main",
                                                        } }), "Last recording: 2 hours ago"] }), _jsxs(Typography, { variant: "body1", gutterBottom: true, children: [_jsx(EventAvailableIcon, { sx: {
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            color: "primary.main",
                                                        } }), "Next game: Tomorrow at 3 PM"] }), _jsxs(Typography, { variant: "body1", gutterBottom: true, children: [_jsx(VideoLibraryIcon, { sx: {
                                                            verticalAlign: "middle",
                                                            mr: 1,
                                                            color: "primary.main",
                                                        } }), "3 new recordings available"] })] })] }) })] })] }) }));
};
export default Dashboard;

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
import Navbar from "../components/Navbar";
const Dashboard = () => {
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }, children: [_jsx(Navbar, {}), _jsx(Typography, { variant: "h3", fontWeight: 900, sx: {
                    color: "#fff",
                    mb: 6,
                    fontFamily: "Montserrat, sans-serif",
                    textAlign: "center",
                }, children: "Dashboard" })] }));
};
export default Dashboard;

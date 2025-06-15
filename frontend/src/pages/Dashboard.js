import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Container, Grid, } from "@mui/material";
import Navbar from "../components/Navbar";
import TestComponent from "../components/TestComponent";
const Dashboard = () => {
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
                        }, children: "Dashboard" }), _jsx(Grid, { container: true, spacing: 4, children: _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TestComponent, {}) }) })] })] }));
};
export default Dashboard;

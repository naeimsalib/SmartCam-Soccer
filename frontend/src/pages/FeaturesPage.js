import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
const features = [
    "Instant setup and streaming",
    "Full HD and 4K video support",
    "Cloud recording and playback",
    "Easy sharing to social media",
    "Secure and private streams",
    "Mobile and desktop access",
    "Custom branding options",
    "24/7 support",
];
const FeaturesPage = () => (_jsx(Box, { sx: {
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
    }, children: _jsxs(Box, { sx: { textAlign: "center", px: 2, width: "100%", maxWidth: 800 }, children: [_jsx(Typography, { variant: "h3", fontWeight: 900, sx: { color: "#fff", mb: 4, fontFamily: "Montserrat, sans-serif" }, children: "Features" }), _jsx(List, { children: features.map((feature) => (_jsxs(ListItem, { sx: { justifyContent: "center" }, children: [_jsx(ListItemIcon, { sx: { minWidth: 40 }, children: _jsx(CheckCircleIcon, { sx: { color: "#F44336", fontSize: 32 } }) }), _jsx(ListItemText, { primary: feature, primaryTypographyProps: {
                                sx: {
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: "1.3rem",
                                    fontFamily: "Montserrat, sans-serif",
                                },
                            } })] }, feature))) })] }) }));
export default FeaturesPage;

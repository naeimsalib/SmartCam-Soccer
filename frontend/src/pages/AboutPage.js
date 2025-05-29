import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
const AboutPage = () => {
    const navigate = useNavigate();
    return (_jsx(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            pt: { xs: "96px", md: "104px" },
        }, children: _jsxs(Box, { sx: { textAlign: "center", px: 2, width: "100%", maxWidth: 900 }, children: [_jsx(Typography, { variant: "h3", component: "h1", gutterBottom: true, fontWeight: 600, children: "About SmartCam Soccer" }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, mt: 4, fontWeight: 500, children: "Our Mission" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "SmartCam Soccer is dedicated to revolutionizing how soccer games are recorded and analyzed. Our AI-powered camera system automatically tracks and records games, providing high-quality footage that can be accessed and downloaded at any time." }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, mt: 4, fontWeight: 500, children: "How It Works" }), _jsxs(Typography, { variant: "body1", paragraph: true, children: ["1. Book your field through our easy-to-use calendar system", _jsx("br", {}), "2. Our smart cameras automatically start recording at your scheduled time", _jsx("br", {}), "3. Access your recordings through your personal dashboard", _jsx("br", {}), "4. Download and share your game footage whenever you want"] }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, mt: 4, fontWeight: 500, children: "Features" }), _jsx(Typography, { variant: "body1", paragraph: true, children: "\u2022 Automated recording based on your reservation \u00A0\u2022\u00A0 High-quality video capture \u00A0\u2022\u00A0 Easy access to past recordings \u00A0\u2022\u00A0 Secure cloud storage \u00A0\u2022\u00A0 User-friendly interface \u00A0\u2022\u00A0 Real-time availability calendar" }), _jsx(Button, { variant: "contained", size: "large", sx: { mt: 5, px: 4, py: 1.5, fontSize: "1.1rem", fontWeight: 600 }, onClick: () => navigate("/login"), children: "Get Started Today" })] }) }));
};
export default AboutPage;

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
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
        }, children: _jsxs(Box, { sx: {
                textAlign: "center",
                px: 2,
                width: "100%",
                maxWidth: 900,
                mt: 10,
            }, children: [_jsxs(Typography, { variant: "h3", component: "h1", gutterBottom: true, fontWeight: 900, sx: { color: "#fff", fontFamily: "Montserrat, sans-serif", mb: 2 }, children: ["About", " ", _jsx(Box, { component: "span", sx: { color: "#F44336" }, children: "EZREC" })] }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, mt: 4, fontWeight: 700, sx: { color: "#F44336", fontFamily: "Montserrat, sans-serif", mb: 2 }, children: "Our Mission" }), _jsx(Typography, { variant: "body1", paragraph: true, sx: { color: "#fff", opacity: 0.85, fontSize: "1.2rem", mb: 3 }, children: "EZREC is dedicated to revolutionizing how streaming and recording is done. Our powerful, easy-to-use solution lets anyone set up, stream, and share with just a few clicks." }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, mt: 4, fontWeight: 700, sx: { color: "#F44336", fontFamily: "Montserrat, sans-serif", mb: 2 }, children: "How It Works" }), _jsxs(Typography, { variant: "body1", paragraph: true, sx: { color: "#fff", opacity: 0.85, fontSize: "1.2rem", mb: 3 }, children: ["1. Set up your device in seconds.", _jsx("br", {}), "2. Start streaming instantly.", _jsx("br", {}), "3. Share your stream with the world.", _jsx("br", {}), "4. Access your recordings anytime."] }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, mt: 4, fontWeight: 700, sx: { color: "#F44336", fontFamily: "Montserrat, sans-serif", mb: 2 }, children: "Why Choose EZREC?" }), _jsxs(Typography, { variant: "body1", paragraph: true, sx: { color: "#fff", opacity: 0.85, fontSize: "1.2rem", mb: 3 }, children: ["\u2022 Automated, reliable streaming", _jsx("br", {}), "\u2022 High-quality video", _jsx("br", {}), "\u2022 Effortless sharing", _jsx("br", {}), "\u2022 Secure cloud storage", _jsx("br", {}), "\u2022 User-friendly interface", _jsx("br", {})] }), _jsx(Button, { variant: "contained", size: "large", sx: {
                        mt: 5,
                        px: 4,
                        py: 1.5,
                        fontSize: "1.1rem",
                        fontWeight: 700,
                        background: "#F44336",
                        color: "#fff",
                        borderRadius: 2,
                        fontFamily: "Montserrat, sans-serif",
                        boxShadow: "none",
                        "&:hover": { background: "#d32f2f", boxShadow: "none" },
                    }, onClick: () => navigate("/contact"), children: "Contact Us" })] }) }));
};
export default AboutPage;

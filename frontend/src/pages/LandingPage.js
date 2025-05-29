import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
const NAVBAR_HEIGHT = 64;
const LandingPage = () => {
    const navigate = useNavigate();
    return (_jsx(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            pt: { xs: "96px", md: "104px" },
            pb: 6,
            boxSizing: "border-box",
        }, children: _jsxs(Box, { sx: { textAlign: "center", px: 2, width: "100%", maxWidth: 700 }, children: [_jsx(Typography, { variant: "h2", component: "h1", gutterBottom: true, sx: { fontWeight: 700, fontSize: { xs: "2.2rem", md: "3.5rem" } }, children: "Welcome to SmartCam Soccer" }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, color: "text.secondary", sx: { fontWeight: 400, fontSize: { xs: "1.1rem", md: "1.5rem" } }, children: "Your intelligent soccer field recording solution" }), _jsx(Typography, { variant: "body1", paragraph: true, sx: {
                        mt: 4,
                        fontSize: { xs: "1rem", md: "1.15rem" },
                        color: "text.secondary",
                    }, children: "Book your field, record your game, and relive your best moments with our advanced AI-powered camera system." }), _jsxs(Box, { sx: {
                        mt: 5,
                        display: "flex",
                        justifyContent: "center",
                        gap: 2,
                        flexWrap: "wrap",
                    }, children: [_jsx(Button, { variant: "contained", size: "large", onClick: () => navigate("/login"), sx: { px: 4, py: 1.5, fontSize: "1.1rem", fontWeight: 600 }, children: "Get Started" }), _jsx(Button, { variant: "outlined", size: "large", onClick: () => navigate("/about"), sx: { px: 4, py: 1.5, fontSize: "1.1rem", fontWeight: 600 }, children: "Learn More" })] })] }) }));
};
export default LandingPage;

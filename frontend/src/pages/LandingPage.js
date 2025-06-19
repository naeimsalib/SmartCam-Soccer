import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
const navLinks = [
    { label: "Features", to: "/features" },
    { label: "Pricing", to: "/pricing" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];
const LandingPage = () => {
    const navigate = useNavigate();
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
            position: "relative",
        }, children: [_jsxs(Box, { sx: { textAlign: "center", px: 2, width: "100%", maxWidth: 800 }, children: [_jsx(Typography, { variant: "h2", component: "h1", gutterBottom: true, sx: {
                            fontWeight: 900,
                            fontSize: { xs: "2.5rem", md: "4rem" },
                            color: "#fff",
                            mb: 2,
                            fontFamily: "Montserrat, sans-serif",
                            lineHeight: 1.1,
                        }, children: "Set It. Stream It. Share It." }), _jsx(Typography, { variant: "h5", component: "h2", gutterBottom: true, sx: {
                            fontWeight: 400,
                            fontSize: { xs: "1.2rem", md: "1.7rem" },
                            color: "#fff",
                            opacity: 0.85,
                            mb: 4,
                            fontFamily: "Montserrat, sans-serif",
                        }, children: "Powerful and easy-to-use streaming solution" }), _jsx(Stack, { direction: "row", spacing: 3, justifyContent: "center", sx: { mb: 5 }, children: navLinks.map((link) => (_jsx(Button, { onClick: () => navigate(link.to), sx: {
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "1.1rem",
                                letterSpacing: 1,
                                borderBottom: "2px solid transparent",
                                borderRadius: 0,
                                background: "none",
                                px: 2,
                                py: 1,
                                textTransform: "none",
                                fontFamily: "Montserrat, sans-serif",
                                transition: "border-bottom 0.2s",
                                "&:hover": {
                                    borderBottom: "2px solid #F44336",
                                    background: "none",
                                },
                            }, children: link.label }, link.to))) }), _jsx(Button, { variant: "contained", size: "large", onClick: () => navigate("/contact"), sx: {
                            px: 6,
                            py: 2,
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            background: "#F44336",
                            color: "#fff",
                            borderRadius: 2,
                            boxShadow: "none",
                            textTransform: "none",
                            fontFamily: "Montserrat, sans-serif",
                            "&:hover": {
                                background: "#d32f2f",
                                boxShadow: "none",
                            },
                            mt: 2,
                        }, children: "Get Started" })] }), _jsx(Box, { sx: {
                    position: "absolute",
                    bottom: 32,
                    left: 0,
                    width: "100%",
                    textAlign: "center",
                }, children: _jsxs(Typography, { variant: "body1", sx: {
                        color: "#fff",
                        opacity: 0.7,
                        fontFamily: "Montserrat, sans-serif",
                    }, children: ["Powered by:", " ", _jsx(Box, { component: "span", sx: { color: "#fff", fontWeight: 700 }, children: "EZ" }), _jsx(Box, { component: "span", sx: { color: "#F44336", fontWeight: 700 }, children: "REC" })] }) })] }));
};
export default LandingPage;

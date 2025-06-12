import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Grid, Card, CardContent, Button, } from "@mui/material";
const plans = [
    {
        name: "Basic",
        price: "$0",
        features: ["Stream in SD", "1 Recording per month", "Email support"],
        accent: false,
    },
    {
        name: "Pro",
        price: "$19/mo",
        features: [
            "Stream in HD",
            "Unlimited Recordings",
            "Priority support",
            "Cloud Storage",
        ],
        accent: true,
    },
    {
        name: "Enterprise",
        price: "Contact Us",
        features: [
            "Custom Integrations",
            "Dedicated Support",
            "Advanced Analytics",
        ],
        accent: false,
    },
];
const PricingPage = () => (_jsx(Box, { sx: {
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
    }, children: _jsxs(Box, { sx: { textAlign: "center", px: 2, width: "100%", maxWidth: 1100 }, children: [_jsx(Typography, { variant: "h3", fontWeight: 900, sx: { color: "#fff", mb: 4, fontFamily: "Montserrat, sans-serif" }, children: "Pricing" }), _jsx(Grid, { container: true, spacing: 4, justifyContent: "center", children: plans.map((plan) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(Card, { sx: {
                            background: plan.accent ? "#1a1a1a" : "#181818",
                            border: plan.accent ? "2px solid #F44336" : "1px solid #333",
                            color: "#fff",
                            borderRadius: 3,
                            boxShadow: plan.accent
                                ? "0 4px 32px 0 rgba(244,67,54,0.15)"
                                : "0 2px 12px 0 rgba(0,0,0,0.10)",
                            fontFamily: "Montserrat, sans-serif",
                        }, children: _jsxs(CardContent, { sx: { textAlign: "center", p: 4 }, children: [_jsx(Typography, { variant: "h5", fontWeight: 700, sx: { color: plan.accent ? "#F44336" : "#fff", mb: 2 }, children: plan.name }), _jsx(Typography, { variant: "h4", fontWeight: 900, sx: { mb: 2 }, children: plan.price }), _jsx(Box, { sx: { mb: 3 }, children: plan.features.map((f) => (_jsxs(Typography, { sx: {
                                            color: "#fff",
                                            opacity: 0.85,
                                            fontSize: "1.1rem",
                                            mb: 1,
                                        }, children: ["\u2022 ", f] }, f))) }), _jsx(Button, { variant: plan.accent ? "contained" : "outlined", sx: {
                                        background: plan.accent ? "#F44336" : "none",
                                        color: plan.accent ? "#fff" : "#fff",
                                        borderColor: plan.accent ? "#F44336" : "#fff",
                                        fontWeight: 700,
                                        fontSize: "1.1rem",
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontFamily: "Montserrat, sans-serif",
                                        boxShadow: "none",
                                        "&:hover": {
                                            background: plan.accent
                                                ? "#d32f2f"
                                                : "rgba(255,255,255,0.08)",
                                            borderColor: plan.accent ? "#d32f2f" : "#fff",
                                            boxShadow: "none",
                                        },
                                    }, children: plan.name === "Enterprise" ? "Contact Us" : "Choose Plan" })] }) }) }, plan.name))) })] }) }));
export default PricingPage;

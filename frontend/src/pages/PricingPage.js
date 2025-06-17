import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Grid, Card, CardContent, Button, Container, } from "@mui/material";
import Navigation from "../components/Navigation";
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
const PricingPage = () => {
    return (_jsxs(Box, { sx: { minHeight: '100vh', bgcolor: 'background.default' }, children: [_jsx(Navigation, {}), _jsxs(Container, { maxWidth: "lg", sx: { pt: 12, pb: 8 }, children: [_jsx(Typography, { variant: "h2", component: "h1", align: "center", sx: {
                            fontWeight: 900,
                            mb: 6,
                            color: 'text.primary',
                            fontFamily: 'Montserrat, sans-serif',
                        }, children: "Pricing" }), _jsx(Grid, { container: true, spacing: 4, justifyContent: "center", children: plans.map((plan) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(Card, { sx: {
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: plan.accent ? 'primary.dark' : 'background.paper',
                                    border: plan.accent ? '2px solid #F44336' : '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: 2,
                                    boxShadow: plan.accent
                                        ? '0 4px 32px 0 rgba(244,67,54,0.15)'
                                        : 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                    },
                                }, children: _jsxs(CardContent, { sx: { flexGrow: 1, textAlign: 'center', p: 4 }, children: [_jsx(Typography, { variant: "h5", component: "h2", sx: {
                                                fontWeight: 700,
                                                mb: 2,
                                                color: plan.accent ? '#F44336' : 'text.primary',
                                                fontFamily: 'Montserrat, sans-serif',
                                            }, children: plan.name }), _jsx(Typography, { variant: "h4", sx: {
                                                fontWeight: 900,
                                                mb: 2,
                                                color: 'text.primary',
                                                fontFamily: 'Montserrat, sans-serif',
                                            }, children: plan.price }), _jsx(Box, { sx: { mb: 3 }, children: plan.features.map((feature) => (_jsxs(Typography, { sx: {
                                                    color: 'text.secondary',
                                                    fontSize: '1.1rem',
                                                    mb: 1,
                                                    fontFamily: 'Montserrat, sans-serif',
                                                }, children: ["\u2022 ", feature] }, feature))) }), _jsx(Button, { variant: plan.accent ? "contained" : "outlined", sx: {
                                                background: plan.accent ? '#F44336' : 'transparent',
                                                color: plan.accent ? '#fff' : 'primary.main',
                                                borderColor: plan.accent ? '#F44336' : 'primary.main',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 2,
                                                fontFamily: 'Montserrat, sans-serif',
                                                '&:hover': {
                                                    background: plan.accent ? '#d32f2f' : 'rgba(144, 202, 249, 0.08)',
                                                    borderColor: plan.accent ? '#d32f2f' : 'primary.main',
                                                },
                                            }, children: plan.name === "Enterprise" ? "Contact Us" : "Choose Plan" })] }) }) }, plan.name))) })] })] }));
};
export default PricingPage;

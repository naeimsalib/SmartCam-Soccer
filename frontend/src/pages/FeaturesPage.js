import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Container, Typography, Grid, Card, CardContent, } from '@mui/material';
import Navigation from '../components/Navigation';
const features = [
    {
        title: 'Smart Recording',
        description: 'Automatically record your soccer games with our intelligent camera system. No manual intervention needed.',
        icon: '🎥',
    },
    {
        title: 'Live Streaming',
        description: 'Stream your games live to friends, family, and fans. Share your moments in real-time.',
        icon: '📡',
    },
    {
        title: 'Cloud Storage',
        description: 'All your recordings are safely stored in the cloud. Access them anytime, anywhere.',
        icon: '☁️',
    },
    {
        title: 'Easy Sharing',
        description: 'Share your recordings with a single click. Generate shareable links instantly.',
        icon: '🔗',
    },
    {
        title: 'Smart Analytics',
        description: 'Get insights about your games with our advanced analytics and statistics.',
        icon: '📊',
    },
    {
        title: 'Mobile Access',
        description: 'Access your recordings and control your camera from your mobile device.',
        icon: '📱',
    },
];
const FeaturesPage = () => {
    return (_jsxs(Box, { sx: { minHeight: '100vh', bgcolor: 'background.default' }, children: [_jsx(Navigation, {}), _jsxs(Container, { maxWidth: "lg", sx: { pt: 12, pb: 8 }, children: [_jsx(Typography, { variant: "h2", component: "h1", align: "center", sx: {
                            fontWeight: 900,
                            mb: 6,
                            color: 'text.primary',
                            fontFamily: 'Montserrat, sans-serif',
                        }, children: "Features" }), _jsx(Grid, { container: true, spacing: 4, children: features.map((feature, index) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(Card, { sx: {
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                    },
                                }, children: _jsxs(CardContent, { sx: { flexGrow: 1, textAlign: 'center', p: 4 }, children: [_jsx(Typography, { variant: "h1", sx: {
                                                fontSize: '3rem',
                                                mb: 2,
                                            }, children: feature.icon }), _jsx(Typography, { variant: "h5", component: "h2", sx: {
                                                fontWeight: 700,
                                                mb: 2,
                                                color: 'text.primary',
                                                fontFamily: 'Montserrat, sans-serif',
                                            }, children: feature.title }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: {
                                                fontFamily: 'Montserrat, sans-serif',
                                            }, children: feature.description })] }) }) }, index))) })] })] }));
};
export default FeaturesPage;

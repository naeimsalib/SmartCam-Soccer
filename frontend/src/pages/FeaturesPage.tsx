import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
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

const FeaturesPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navigation />
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Typography
          variant="h2"
          component="h1"
          align="center"
    sx={{
            fontWeight: 900,
            mb: 6,
            color: 'text.primary',
            fontFamily: 'Montserrat, sans-serif',
          }}
      >
        Features
      </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
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
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: '3rem',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Typography>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: 'text.primary',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
        ))}
        </Grid>
      </Container>
  </Box>
);
};

export default FeaturesPage;

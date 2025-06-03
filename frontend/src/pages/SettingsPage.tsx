import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { supabase } from '../supabaseClient';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface UserSettings {
  intro_video_path: string | null;
  logo_path: string | null;
  sponsor_logo1_path: string | null;
  sponsor_logo2_path: string | null;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<{
    intro?: string;
    logo?: string;
    sponsor_logo1?: string;
    sponsor_logo2?: string;
  }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSettings(data);

      if (data?.intro_video_path) {
        const { data: introData } = await supabase.storage
          .from('user_media')
          .createSignedUrl(data.intro_video_path, 3600);
        if (introData?.signedUrl) {
          setPreviewUrl((prev) => ({ ...prev, intro: introData.signedUrl }));
        }
      }

      if (data?.logo_path) {
        const { data: logoData } = await supabase.storage
          .from('user_media')
          .createSignedUrl(data.logo_path, 3600);
        if (logoData?.signedUrl) {
          setPreviewUrl((prev) => ({ ...prev, logo: logoData.signedUrl }));
        }
      }

      for (const key of ['sponsor_logo1_path', 'sponsor_logo2_path'] as const) {
        if (data?.[key]) {
          const { data: signedData } = await supabase.storage
            .from('user_media')
            .createSignedUrl(data[key], 3600);
          if (signedData?.signedUrl) {
            setPreviewUrl((prev) => ({
              ...prev,
              [key.replace('_path', '')]: signedData.signedUrl,
            }));
          }
        }
      }
    } catch (err) {
      setError('Failed to fetch settings');
      console.error(err);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: keyof UserSettings & string
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [`${type}`]: filePath,
        });

      if (updateError) throw updateError;

      setSuccess(`${type.replace('_', ' ')} uploaded successfully`);
      fetchSettings();
    } catch (err) {
      setError(`Failed to upload ${type.replace('_', ' ')}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = async (type: keyof UserSettings & string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const currentPath = settings?.[type];
      if (currentPath) {
        const { error: deleteError } = await supabase.storage
          .from('user_media')
          .remove([currentPath]);

        if (deleteError) throw deleteError;
      }

      const { error: updateError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [type]: null,
        });

      if (updateError) throw updateError;

      setSuccess(`${type.replace('_', ' ')} removed successfully`);
      fetchSettings();
    } catch (err) {
      setError(`Failed to remove ${type.replace('_', ' ')}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderUploader = (
    label: string,
    type: keyof UserSettings & string,
    preview?: string
  ) => (
    <Grid item xs={12}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        <Box sx={{ mb: 2 }}>
          {preview ? (
            <Card sx={{ maxWidth: 345, mb: 2 }}>
              <CardMedia
                component={type === 'intro_video_path' ? 'video' : 'img'}
                controls={type === 'intro_video_path'}
                src={preview}
                sx={{ height: 200, objectFit: 'contain' }}
              />
              <CardContent>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleRemoveFile(type)}
                  disabled={loading}
                >
                  Remove {label}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              Upload {label}
              <VisuallyHiddenInput
                type="file"
                accept={type === 'intro_video_path' ? 'video/*' : 'image/*'}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, type);
                }}
              />
            </Button>
          )}
        </Box>
      </Paper>
    </Grid>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Video Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {renderUploader('Intro Video', 'intro_video_path', previewUrl.intro)}
        {renderUploader('Main Logo', 'logo_path', previewUrl.logo)}
        {renderUploader(
          'Sponsor Logo 1',
          'sponsor_logo1_path',
          previewUrl.sponsor_logo1
        )}
        {renderUploader(
          'Sponsor Logo 2',
          'sponsor_logo2_path',
          previewUrl.sponsor_logo2
        )}
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default SettingsPage;

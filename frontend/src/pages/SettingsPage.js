import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Grid, Card, CardContent, CardMedia, CircularProgress, Alert, } from '@mui/material';
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
const SettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [previewUrl, setPreviewUrl] = useState({});
    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        try {
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                return;
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (error)
                throw error;
            setSettings(data);
            if (data?.intro_video_path) {
                const { data: introData } = await supabase.storage
                    .from('usermedia')
                    .createSignedUrl(data.intro_video_path, 3600);
                if (introData?.signedUrl) {
                    setPreviewUrl((prev) => ({ ...prev, intro: introData.signedUrl }));
                }
            }
            if (data?.logo_path) {
                const { data: logoData } = await supabase.storage
                    .from('usermedia')
                    .createSignedUrl(data.logo_path, 3600);
                if (logoData?.signedUrl) {
                    setPreviewUrl((prev) => ({ ...prev, logo: logoData.signedUrl }));
                }
            }
            for (const key of [
                'sponsor_logo1_path',
                'sponsor_logo2_path',
                'sponsor_logo3_path',
            ]) {
                if (data?.[key]) {
                    const { data: signedData } = await supabase.storage
                        .from('usermedia')
                        .createSignedUrl(data[key], 3600);
                    if (signedData?.signedUrl) {
                        setPreviewUrl((prev) => ({
                            ...prev,
                            [key.replace('_path', '')]: signedData.signedUrl,
                        }));
                    }
                }
            }
        }
        catch (err) {
            setError('Failed to fetch settings');
            console.error(err);
        }
    };
    const handleFileUpload = async (file, type) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error('User not authenticated');
            const fileExt = file.name.split('.').pop();
            const fileName = `${type}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${type}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('usermedia')
                .upload(filePath, file);
            if (uploadError)
                throw uploadError;
            const { data: existing, error: existingError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (existingError && existingError.code !== 'PGRST116')
                throw existingError;
            const updatePayload = {
                user_id: user.id,
                intro_video_path: existing?.intro_video_path ?? null,
                logo_path: existing?.logo_path ?? null,
                sponsor_logo1_path: existing?.sponsor_logo1_path ?? null,
                sponsor_logo2_path: existing?.sponsor_logo2_path ?? null,
                sponsor_logo3_path: existing?.sponsor_logo3_path ?? null,
                [type]: filePath,
            };
            const { error: updateError } = await supabase
                .from('user_settings')
                .upsert(updatePayload, { onConflict: 'user_id' });
            if (updateError)
                throw updateError;
            setSuccess(`${type.replace('_', ' ')} uploaded successfully`);
            fetchSettings();
        }
        catch (err) {
            setError(`Failed to upload ${type.replace('_', ' ')}`);
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleRemoveFile = async (type) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            const { data: { user }, } = await supabase.auth.getUser();
            if (!user)
                throw new Error('User not authenticated');
            const currentPath = settings?.[type];
            if (currentPath) {
                const { error: deleteError } = await supabase.storage
                    .from('usermedia')
                    .remove([currentPath]);
                if (deleteError)
                    throw deleteError;
            }
            const { error: updateError } = await supabase
                .from('user_settings')
                .upsert({ user_id: user.id, [type]: null }, { onConflict: 'user_id' });
            if (updateError)
                throw updateError;
            setSuccess(`${type.replace('_', ' ')} removed successfully`);
            fetchSettings();
        }
        catch (err) {
            setError(`Failed to remove ${type.replace('_', ' ')}`);
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const renderUploader = (label, type, preview) => (_jsx(Grid, { item: true, xs: 12, children: _jsxs(Paper, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: label }), _jsx(Box, { sx: { mb: 2 }, children: preview ? (_jsxs(Card, { sx: { maxWidth: 345, mb: 2 }, children: [_jsx(CardMedia, { component: type === 'intro_video_path' ? 'video' : 'img', controls: type === 'intro_video_path', src: preview, sx: { height: 200, objectFit: 'contain' }, onError: () => console.error(`❌ Failed to load preview for: ${type}`, preview) }), _jsx(CardContent, { children: _jsxs(Button, { variant: "outlined", color: "error", onClick: () => handleRemoveFile(type), disabled: loading, children: ["Remove ", label] }) })] })) : (_jsxs(Button, { component: "label", variant: "contained", startIcon: _jsx(CloudUploadIcon, {}), disabled: loading, children: ["Upload ", label, _jsx(VisuallyHiddenInput, { type: "file", accept: type === 'intro_video_path' ? 'video/*' : 'image/*', onChange: (e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                        handleFileUpload(file, type);
                                } })] })) })] }) }));
    return (_jsxs(Container, { maxWidth: "md", sx: { py: 4 }, children: [_jsx(Typography, { variant: "h4", component: "h1", gutterBottom: true, children: "Video Settings" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), success && (_jsx(Alert, { severity: "success", sx: { mb: 2 }, children: success })), _jsxs(Grid, { container: true, spacing: 3, children: [renderUploader('Intro Video', 'intro_video_path', previewUrl.intro), renderUploader('Main Logo', 'logo_path', previewUrl.logo), renderUploader('Sponsor Logo 1', 'sponsor_logo1_path', previewUrl.sponsor_logo1), renderUploader('Sponsor Logo 2', 'sponsor_logo2_path', previewUrl.sponsor_logo2), renderUploader('Sponsor Logo 3', 'sponsor_logo3_path', previewUrl.sponsor_logo3)] }), loading && (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', mt: 2 }, children: _jsx(CircularProgress, {}) }))] }));
};
export default SettingsPage;

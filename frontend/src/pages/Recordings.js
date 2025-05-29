import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
const Recordings = () => {
    return (_jsx(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        }, children: _jsx(Typography, { variant: "h4", align: "center", fontWeight: 400, children: "Your Recordings" }) }));
};
export default Recordings;

import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
const TestComponent = () => {
    return (_jsx(Box, { sx: {
            p: 2,
            background: "#1a1a1a",
            borderRadius: 2,
            color: "#fff",
        }, children: _jsx(Typography, { variant: "h6", children: "Test Component" }) }));
};
export default TestComponent;

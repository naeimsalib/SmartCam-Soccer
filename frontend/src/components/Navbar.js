import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
const Navbar = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };
    const navItems = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Book Field", path: "/calendar" },
        { label: "Recordings", path: "/recordings" },
        { label: "Settings", path: "/settings" },
        { label: "About", path: "/about" },
    ];
    return (_jsx(AppBar, { position: "fixed", sx: { background: "#111" }, children: _jsxs(Toolbar, { sx: { justifyContent: "space-between" }, children: [_jsx(Box, { sx: { display: "flex", gap: 2 }, children: navItems.map((item) => (_jsx(Button, { color: "inherit", onClick: () => navigate(item.path), sx: {
                            fontWeight: 700,
                            fontSize: "1rem",
                            letterSpacing: 1,
                            textTransform: "none",
                            fontFamily: "Montserrat, sans-serif",
                            "&:hover": {
                                background: "#F44336",
                            },
                        }, children: item.label }, item.path))) }), _jsx(Button, { color: "inherit", onClick: handleLogout, sx: {
                        fontWeight: 700,
                        fontSize: "1rem",
                        letterSpacing: 1,
                        textTransform: "none",
                        fontFamily: "Montserrat, sans-serif",
                        "&:hover": {
                            background: "#F44336",
                        },
                    }, children: "Logout" })] }) }));
};
export default Navbar;

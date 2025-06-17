import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPopper } from '@popperjs/core';
window.Popper = { createPopper };
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import "./index.css";
import App from "./App";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import './env-test';
const cache = createCache({
    key: 'css',
    prepend: true,
});
const theme = createTheme();
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(CacheProvider, { value: cache, children: _jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(App, {})] }) }) }));

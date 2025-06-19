import { createPopper } from '@popperjs/core';
(window as any).Popper = { createPopper };

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>
);

import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from '@/components/ui/sonner';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Refresh CSRF token on every Inertia request
axios.interceptors.response.use(
    (response) => {
        // Update CSRF token if provided in response headers
        const token = response.headers['x-csrf-token'];
        if (token) {
            const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
            if (csrfTokenElement) {
                csrfTokenElement.setAttribute('content', token);
            }
        }
        return response;
    },
    (error) => {
        // Handle 419 (CSRF token mismatch / Page Expired)
        if (error.response && error.response.status === 419) {
            // Reload page to get fresh CSRF token
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <Toaster richColors position='top-right' />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import AppLayout from './layouts/AppLayout';
import { TransactionProvider } from '@/features/transactions/TransactionContext';
import { AuthProvider } from '@/features/auth/AuthContext';

const appName = import.meta.env.VITE_APP_NAME || 'Invenos';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ).then((page: any) => {
            // Use AppLayout as the default layout for all pages
            page.default.layout = page.default.layout || ((page: any) => <AppLayout>{page}</AppLayout>);
            return page;
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <AuthProvider>
                <TransactionProvider>
                    <App {...props} />
                    <Toaster richColors position="top-right" />
                </TransactionProvider>
            </AuthProvider>
        );
    },
    progress: { color: '#4B5563' },
});

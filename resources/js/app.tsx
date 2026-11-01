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

// Print documents render without the app shell; the shell's overflow clips
// everything below the first viewport when the browser paginates.
const PRINT_PAGES = new Set([
    'sales/SalePrint',
    'purchases/PurchasePrint',
    'payments/PaymentPrint',
    'reports/StockPrint',
    'returns/SaleReturnPrint',
    'returns/PurchaseReturnPrint',
    'expenses/ExpensePrint',
]);

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ).then((page: any) => {
            if (PRINT_PAGES.has(name)) {
                page.default.layout = (page: any) => page;
                return page;
            }
            // Use AppLayout as the default layout for all other pages
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
    progress: { color: 'var(--primary)', showSpinner: false, delay: 0 },
});

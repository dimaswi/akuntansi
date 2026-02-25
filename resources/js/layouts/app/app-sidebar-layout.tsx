import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        // Restore scroll position on mount
        const savedPosition = sessionStorage.getItem(`scroll-${window.location.pathname}`);
        if (savedPosition) {
            scrollContainer.scrollTop = parseInt(savedPosition, 10);
        }

        // Save scroll position before navigation
        const handleBefore = () => {
            if (scrollContainer) {
                sessionStorage.setItem(`scroll-${window.location.pathname}`, String(scrollContainer.scrollTop));
            }
        };

        // Restore scroll position after navigation
        const handleNavigate = () => {
            const savedPos = sessionStorage.getItem(`scroll-${window.location.pathname}`);
            if (savedPos && scrollContainer) {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    scrollContainer.scrollTop = parseInt(savedPos, 10);
                }, 0);
            } else if (scrollContainer) {
                scrollContainer.scrollTop = 0;
            }
        };

        const removeBefore = router.on('before', handleBefore);
        const removeNavigate = router.on('navigate', handleNavigate);

        return () => {
            removeBefore();
            removeNavigate();
        };
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div ref={scrollRef} className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}

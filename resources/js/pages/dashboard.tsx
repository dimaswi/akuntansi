import React, { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';

// This is a redirect page that handles routing to appropriate dashboard based on permissions
// The actual routing logic is handled in DashboardController.php

export default function Dashboard() {
    useEffect(() => {
        // This page should not be directly rendered
        // The controller will redirect to the appropriate dashboard
        // If somehow we reach here, redirect to home
        router.visit(route('dashboard'));
    }, []);

    return (
        <>
            <Head title="Dashboard - Redirecting..." />
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
                </div>
            </div>
        </>
    );
}

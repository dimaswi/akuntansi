import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from '@/lib/toast';
import type { SharedData } from '@/types';

/**
 * Hook to handle flash messages from Laravel session
 * Automatically displays toast notifications for success, error, warning, and info messages
 * Uses the deduplicated toast wrapper to prevent double toasts
 */
export function useFlashMessages() {
    const { props } = usePage<SharedData>();
    const flash = props.flash;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.warning) {
            toast.warning(flash.warning);
        }
        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [flash?.success, flash?.error, flash?.warning, flash?.info]);

    return flash;
}

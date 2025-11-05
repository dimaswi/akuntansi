import { useForm } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface RevisionError {
    require_revision_reason: boolean;
    period_id: number;
    period_name: string;
    message: string;
}

interface UseRevisionDialogOptions {
    onSuccess?: () => void;
    onError?: (errors: any) => void;
}

export function useRevisionDialog(options: UseRevisionDialogOptions = {}) {
    const [showDialog, setShowDialog] = useState(false);
    const [revisionData, setRevisionData] = useState<RevisionError | null>(null);
    const [pendingRequest, setPendingRequest] = useState<{
        method: string;
        url: string;
        data: any;
    } | null>(null);

    /**
     * Check if error response indicates revision reason required
     */
    const checkRevisionRequired = useCallback((errors: any): boolean => {
        if (!errors) return false;

        // Check if errors contain revision requirement flag
        if (errors.require_revision_reason === true) {
            setRevisionData({
                require_revision_reason: true,
                period_id: errors.period_id,
                period_name: errors.period_name || 'Periode Tertutup',
                message: errors.message || 'Periode sudah di-soft close',
            });
            setShowDialog(true);
            return true;
        }

        return false;
    }, []);

    /**
     * Submit with revision reason
     */
    const submitWithRevision = useCallback((reason: string) => {
        if (!pendingRequest) return;

        const { method, url, data } = pendingRequest;

        // Add revision reason to request data
        const requestData = {
            ...data,
            revision_reason: reason,
        };

        // Submit with Inertia
        router[method as 'post' | 'put' | 'delete' | 'patch'](url, requestData, {
            onSuccess: () => {
                setShowDialog(false);
                setPendingRequest(null);
                setRevisionData(null);
                options.onSuccess?.();
            },
            onError: (errors) => {
                // Check if still requires revision (validation failed)
                if (!checkRevisionRequired(errors)) {
                    // Other error, keep dialog open but show error
                    options.onError?.(errors);
                }
            },
        });
    }, [pendingRequest, options, checkRevisionRequired]);

    /**
     * Make a request that might require revision reason
     */
    const makeRequest = useCallback((
        method: 'post' | 'put' | 'delete' | 'patch',
        url: string,
        data: any = {}
    ) => {
        // Store pending request
        setPendingRequest({ method, url, data });

        // Try to submit
        router[method](url, data, {
            onSuccess: () => {
                setPendingRequest(null);
                options.onSuccess?.();
            },
            onError: (errors) => {
                // Check if revision required
                if (!checkRevisionRequired(errors)) {
                    // Other error
                    setPendingRequest(null);
                    options.onError?.(errors);
                }
            },
        });
    }, [options, checkRevisionRequired]);

    /**
     * Close dialog
     */
    const closeDialog = useCallback(() => {
        setShowDialog(false);
        setPendingRequest(null);
        setRevisionData(null);
    }, []);

    return {
        showDialog,
        revisionData,
        makeRequest,
        submitWithRevision,
        closeDialog,
    };
}

import { toast as sonnerToast, ExternalToast } from 'sonner';

/**
 * Deduplication mechanism to prevent double/spam toasts
 * Stores recent messages with timestamps
 */
const recentMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 3000; // Don't show same message within 3 seconds

/**
 * Rate limiting - max toasts per time window
 */
let toastCount = 0;
let lastResetTime = Date.now();
const MAX_TOASTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 2000;

/**
 * Clean up old messages from the deduplication cache
 */
const cleanupOldMessages = () => {
    const now = Date.now();
    for (const [message, timestamp] of recentMessages.entries()) {
        if (now - timestamp > DEDUP_WINDOW_MS) {
            recentMessages.delete(message);
        }
    }
};

/**
 * Check rate limit and reset if needed
 */
const checkRateLimit = (): boolean => {
    const now = Date.now();
    if (now - lastResetTime > RATE_LIMIT_WINDOW_MS) {
        toastCount = 0;
        lastResetTime = now;
    }
    
    if (toastCount >= MAX_TOASTS_PER_WINDOW) {
        return false; // Rate limited
    }
    
    toastCount++;
    return true;
};

/**
 * Check if message should be deduplicated
 */
const shouldDeduplicate = (message: string): boolean => {
    cleanupOldMessages();
    
    // Check rate limit first
    if (!checkRateLimit()) {
        return true; // Skip due to rate limiting
    }
    
    const now = Date.now();
    const lastShown = recentMessages.get(message);
    
    if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
        return true; // Skip this toast - duplicate
    }
    
    recentMessages.set(message, now);
    return false;
};

/**
 * Custom toast wrapper with deduplication and rate limiting
 * to prevent double/spam messages when both backend flash 
 * and frontend handlers trigger toasts
 */
export const toast = {
    success: (message: string, options?: ExternalToast) => {
        if (shouldDeduplicate(message)) return;
        return sonnerToast.success(message, options);
    },
    
    error: (message: string, options?: ExternalToast) => {
        if (shouldDeduplicate(message)) return;
        return sonnerToast.error(message, options);
    },
    
    warning: (message: string, options?: ExternalToast) => {
        if (shouldDeduplicate(message)) return;
        return sonnerToast.warning(message, options);
    },
    
    info: (message: string, options?: ExternalToast) => {
        if (shouldDeduplicate(message)) return;
        return sonnerToast.info(message, options);
    },
    
    // Pass through other toast methods without deduplication
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    message: sonnerToast.message,
    dismiss: sonnerToast.dismiss,
};

export default toast;

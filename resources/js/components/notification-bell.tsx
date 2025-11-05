import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Bell, CheckCircle, XCircle, AlertCircle, FileCheck, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
    id: number;
    type: 'closing_period' | 'revision_approval' | 'period_reminder' | 'system';
    title: string;
    message: string;
    data?: any;
    read_at: string | null;
    created_at: string;
    action_url?: string;
}

interface NotificationData {
    unread_count: number;
    notifications: Notification[];
}

export function NotificationBell() {
    const { props } = usePage<{ notifications?: NotificationData }>();
    const [notifications, setNotifications] = useState<Notification[]>(props.notifications?.notifications || []);
    const [unreadCount, setUnreadCount] = useState(props.notifications?.unread_count || 0);
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (props.notifications) {
            setNotifications(props.notifications.notifications || []);
            setUnreadCount(props.notifications.unread_count || 0);
        }
    }, [props.notifications]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'closing_period':
                return <Calendar className="h-4 w-4 text-blue-600" />;
            case 'revision_approval':
                return <FileCheck className="h-4 w-4 text-green-600" />;
            case 'period_reminder':
                return <AlertCircle className="h-4 w-4 text-orange-600" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const formatTime = (date: string) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now.getTime() - notifDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return notifDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const handleMarkAsRead = (id: number) => {
        router.post(
            route('notifications.mark-as-read', id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNotifications(prev =>
                        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                },
            }
        );
    };

    const handleMarkAllAsRead = () => {
        router.post(
            route('notifications.mark-all-as-read'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNotifications(prev =>
                        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
                    );
                    setUnreadCount(0);
                },
            }
        );
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            handleMarkAsRead(notification.id);
        }
        if (notification.action_url) {
            router.visit(notification.action_url);
            setOpen(false);
        }
    };

    const renderNotificationList = () => (
        <div className={cn(
            "overflow-y-auto",
            isMobile ? "h-[calc(100vh-120px)]" : "max-h-[400px]"
        )}>
            {!notifications || notifications.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground px-3">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Tidak ada notifikasi</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                'flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-accent',
                                !notification.read_at && 'bg-muted/50 border-l-4 border-l-blue-600'
                            )}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="mt-1 shrink-0">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm font-medium leading-tight">
                                        {notification.title}
                                    </p>
                                    {!notification.read_at && (
                                        <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatTime(notification.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Mobile view - Sheet (Full Screen)
    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] font-bold flex items-center justify-center"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full p-0 sm:max-w-full">
                    <SheetHeader className="px-4 py-4 border-b space-y-0">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg">Notifikasi</SheetTitle>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={handleMarkAllAsRead}
                                >
                                    Tandai dibaca
                                </Button>
                            )}
                        </div>
                    </SheetHeader>
                    
                    {renderNotificationList()}

                    {notifications && notifications.length > 0 && (
                        <div className="border-t p-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    router.visit(route('notifications.index'));
                                    setOpen(false);
                                }}
                            >
                                Lihat semua notifikasi
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop view - Dropdown
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] font-bold flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                className="w-[380px]"
                sideOffset={5}
            >
                <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                    <span className="font-semibold text-sm">Notifikasi</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            Tandai dibaca
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {renderNotificationList()}

                {notifications && notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="justify-center text-xs text-muted-foreground hover:text-foreground cursor-pointer py-2"
                            onClick={() => {
                                router.visit(route('notifications.index'));
                                setOpen(false);
                            }}
                        >
                            Lihat semua notifikasi
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

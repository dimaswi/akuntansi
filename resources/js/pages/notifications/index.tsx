import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, FileCheck, AlertCircle, Trash2, CheckCheck } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
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

interface PaginatedData {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    notifications: PaginatedData;
    unread_count: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Bell className="h-4 w-4" />, href: '/dashboard' },
    { title: 'Notifikasi', href: '#' },
];

const formatDate = (date: string) => {
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
    return notifDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function NotificationIndex({ notifications, unread_count }: Props) {
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'closing_period':
                return <Calendar className="h-5 w-5 text-blue-600" />;
            case 'revision_approval':
                return <FileCheck className="h-5 w-5 text-green-600" />;
            case 'period_reminder':
                return <AlertCircle className="h-5 w-5 text-orange-600" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };

    const handleMarkAsRead = (id: number) => {
        router.post(route('notifications.mark-as-read', id), {}, { preserveScroll: true });
    };

    const handleMarkAllAsRead = () => {
        router.post(route('notifications.mark-all-as-read'), {}, { preserveScroll: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus notifikasi ini?')) {
            router.delete(route('notifications.destroy', id), { preserveScroll: true });
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            router.post(
                route('notifications.mark-as-read', notification.id),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (notification.action_url) {
                            router.visit(notification.action_url);
                        }
                    },
                }
            );
        } else if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    const filteredNotifications =
        filter === 'unread'
            ? notifications.data.filter((n) => !n.read_at)
            : notifications.data;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi" />

            <div className="flex h-full flex-1 flex-col space-y-8 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Notifikasi</h2>
                        <p className="text-muted-foreground text-sm">
                            {unread_count} notifikasi belum dibaca
                        </p>
                    </div>
                    {unread_count > 0 && (
                        <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                </div>

                {/* Filter Tabs - Mobile Friendly */}
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="flex-1 sm:flex-none"
                    >
                        Semua ({notifications.total})
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('unread')}
                        className="flex-1 sm:flex-none"
                    >
                        Belum Dibaca ({unread_count})
                    </Button>
                </div>

                {/* Notifications List - Mobile Optimized */}
                <div className="space-y-2">
                    {filteredNotifications.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {filter === 'unread'
                                        ? 'Tidak ada notifikasi belum dibaca'
                                        : 'Tidak ada notifikasi'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className={cn(
                                    'transition-colors hover:bg-accent/50 cursor-pointer',
                                    !notification.read_at && 'border-l-4 border-l-blue-600 bg-muted/30'
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex gap-3">
                                        {/* Icon - Hidden on very small screens */}
                                        <div className="shrink-0 mt-1 hidden xs:block">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-sm leading-tight">
                                                    {notification.title}
                                                </h3>
                                                {!notification.read_at && (
                                                    <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                                <div className="flex gap-1">
                                                    {!notification.read_at && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                        >
                                                            Tandai Dibaca
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notification.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination - Mobile Friendly */}
                {notifications.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {notifications.from || 0} - {notifications.to || 0} dari{' '}
                            {notifications.total}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(route('notifications.index', { page: notifications.current_page - 1 }))
                                }
                                disabled={notifications.current_page === 1}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.get(route('notifications.index', { page: notifications.current_page + 1 }))
                                }
                                disabled={notifications.current_page === notifications.last_page}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

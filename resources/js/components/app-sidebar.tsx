import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Package, BarChart3, Users, Settings, FileText, Building2 } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Inventori',
        href: route('inventory.dashboard'),
        icon: Package,
        permission: 'inventory.view',
        items: [
            {
                title: 'Item',
                href: route('inventory.items.index'),
                permission: 'inventory.item.view',
            },
            {
                title: 'Lokasi',
                href: route('inventory.locations.index'),
                permission: 'inventory.location.view',
            },
            {
                title: 'Perpindahan Stok',
                href: route('inventory.movements.index'),
                permission: 'inventory.movement.view',
            },
            {
                title: 'Laporan',
                href: route('inventory.reports.index'),
                permission: 'inventory.report.view',
            },
        ],
    },
    {
        title: 'Departemen',
        href: '/departments',
        icon: Building2,
        items: [
            {
                title: 'Daftar Departemen',
                href: '/departments',
            },
            {
                title: 'Permintaan Departemen',
                href: '/department-requests',
                permission: 'department-requests.index',
            },
            {
                title: 'Laporan Permintaan',
                href: '/department-requests/reports',
                permission: 'department-requests.reports',
            },
        ],
    },
    {
        title: 'Master Data',
        href: '/master',
        icon: Users,
        items: [
            {
                title: 'Pengguna',
                href: '/master/users',
            },
            {
                title: 'Role',
                href: '/master/roles',
            },
            {
                title: 'Permission',
                href: '/master/permissions',
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

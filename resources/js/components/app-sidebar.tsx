import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Banknote,
    BarChart,
    Book,
    BookOpen,
    BookOpenCheck,
    Box,
    Building2,
    Calculator,
    ClipboardList,
    Cog,
    DollarSign,
    FileBarChart,
    FileCheck,
    FileText,
    Home,
    Key,
    Landmark,
    LayoutGrid,
    Package,
    Receipt,
    Settings,
    Shield,
    Tag,
    TrendingUp,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import AppLogo from './app-logo';

export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Kas & Bank',
        href: '/kas',
        icon: Wallet,
        children: [
            {
                title: 'Dashboard',
                href: '/kas',
                icon: LayoutGrid,
                permission: 'kas.view',
            },
            {
                title: 'Transaksi Kas',
                href: '/kas/cash-transactions',
                icon: Wallet,
                permission: 'kas.cash-management.view',
            },
            {
                title: 'Bank Account',
                href: '/kas/bank-accounts',
                icon: Building2,
                permission: 'kas.bank-account.view',
            },
            {
                title: 'Transaksi Bank',
                href: '/kas/bank-transactions',
                icon: Landmark,
                permission: 'kas.cash-management.view',
            },
            {
                title: 'Transaksi Giro',
                href: '/kas/giro-transactions',
                icon: Receipt,
                permission: 'kas.giro-transaction.view',
            },
            {
                title: 'Laporan Arus Kas',
                href: '/kas/reports/cash-flow',
                icon: TrendingUp,
                permission: 'laporan.cash-flow.view',
            },
            {
                title: 'Laporan Giro',
                href: '/kas/reports/giro',
                icon: FileBarChart,
                permission: 'laporan.giro-report.view',
            },
        ],
    },
    {
        title: 'Akuntansi',
        href: '/akuntansi',
        icon: Calculator,
        children: [
            {
                title: 'Dashboard',
                href: '/akuntansi',
                icon: LayoutGrid,
                permission: 'akuntansi.view',
            },
            {
                title: 'Daftar Akun',
                href: '/akuntansi/daftar-akun',
                icon: BookOpen,
                permission: 'akuntansi.daftar-akun.view',
            },
            {
                title: 'Jurnal',
                href: '/akuntansi/jurnal',
                icon: FileText,
                permission: 'akuntansi.jurnal.view',
            },
            {
                title: 'Jurnal Penyesuaian',
                href: '/akuntansi/jurnal-penyesuaian',
                icon: BookOpenCheck,
                permission: 'akuntansi.jurnal-penyesuaian.view',
            },
            {
                title: 'Buku Besar',
                href: '/akuntansi/buku-besar',
                icon: Book,
                permission: 'akuntansi.buku-besar.view',
            },
            {
                title: 'Laporan Keuangan',
                href: '/akuntansi/laporan',
                icon: BarChart,
                permission: 'akuntansi.laporan.view',
            },
            {
                title: 'Periode Tutup Buku',
                href: '/settings/closing-periods/list',
                icon: BookOpenCheck,
                permission: 'closing-period.view',
            },
        ],
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
        children: [
            {
                title: 'Kategori Barang',
                href: '/item-categories',
                icon: Tag,
                permission: 'inventory.categories.view',
            },
            {
                title: 'Supplier',
                href: '/suppliers',
                icon: Users,
                permission: 'inventory.suppliers.view',
            },
            {
                title: 'Barang',
                href: '/items',
                icon: Box,
                permission: 'inventory.items.view',
            },
            {
                title: 'Pembelian',
                href: '/purchases',
                icon: FileText,
                permission: 'inventory.purchases.view',
            },
            {
                title: 'Pembayaran Pembelian',
                href: '/purchase-payments',
                icon: DollarSign,
                permission: 'inventory.purchases.view',
            },
            {
                title: 'Stock Adjustment',
                href: '/stock-adjustments',
                icon: ClipboardList,
                permission: 'inventory.stock-adjustments.view',
            },
            {
                title: 'Stock Opname',
                href: '/stock-opnames',
                icon: FileBarChart,
                permission: 'inventory.stock-opnames.view',
            },
            {
                title: 'Transfer Stok',
                href: '/stock-transfers',
                icon: ArrowRightLeft,
                permission: 'inventory.stock-transfers.view',
            },
            {
                title: 'Permintaan Stok',
                href: '/stock-requests',
                icon: FileCheck,
                permission: 'inventory.stock-requests.view',
            },
            {
                title: 'Gudang Pusat',
                href: '/central-warehouse',
                icon: Warehouse,
                permission: 'inventory.central-warehouse.view',
            },
            {
                title: 'Stok Department',
                href: '/department-stocks',
                icon: Building2,
                permission: 'inventory.department-stocks.view',
            },
            {
                title: 'Departemen',
                href: '/departments',
                icon: Users,
                permission: 'inventory.departments.view',
            },
            {
                title: 'Laporan Inventory',
                href: '/inventory-reports',
                icon: FileBarChart,
                permission: 'inventory.reports.view',
            },
            {
                title: 'Kepatuhan Opname',
                href: '/reports/stock-opname-compliance',
                icon: BarChart,
                permission: 'inventory.stock-opnames.view',
            },
        ],
    },
    {
        title: 'Penggajian',
        href: '/penggajian',
        icon: Banknote,
        children: [
            {
                title: 'Gaji',
                href: '/penggajian',
                icon: FileText,
                permission: 'penggajian.view',
            },
        ],
    },
    {
        title: 'Pengaturan',
        href: '/master',
        icon: Cog,
        children: [
            {
                title: 'Daftar User',
                href: '/master/users',
                icon: Users,
                permission: 'user.view',
            },
            {
                title: 'User Department',
                href: '/master/users/departments',
                icon: Building2,
                permission: 'user.department.manage',
            },
            {
                title: 'Daftar Role',
                href: '/master/roles',
                icon: Shield,
                permission: 'role.view',
            },
            {
                title: 'Daftar Permission',
                href: '/master/permissions',
                icon: Key,
                permission: 'permission.view',
            },
            {
                title: 'Konfigurasi Tutup Buku',
                href: '/settings/closing-periods',
                icon: Settings,
                permission: 'closing-period.manage-settings',
            },
            {
                title: 'Approval Revisi Jurnal',
                href: '/settings/revision-approvals',
                icon: FileCheck,
                permission: 'closing-period.approve-revision',
            },
        ],
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

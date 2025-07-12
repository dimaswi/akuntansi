import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string | JSX.Element;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
    items?: NavItem[]; // Support for submenu items
    permission?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role_id?: number;
    role?: Role;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
    users?: User[];
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    module: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis: string;
    sub_jenis?: string;
    parent_id?: number;
    level: number;
    saldo_normal: string;
    aktif: boolean;
    created_at: string;
    updated_at: string;
    parent?: DaftarAkun;
    children?: DaftarAkun[];
}

export interface DetailJurnal {
    id?: number;
    jurnal_id?: number;
    daftar_akun_id: number;
    deskripsi: string;
    debit: number;
    kredit: number;
    created_at?: string;
    updated_at?: string;
    akun?: DaftarAkun;
    [key: string]: any;
}

export interface Jurnal {
    id?: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
    status: string;
    dibuat_oleh: number;
    created_at?: string;
    updated_at?: string;
    detail_jurnal?: DetailJurnal[];
    pembuat?: User;
}

export interface JurnalFormData {
    nomor_jurnal: string;
    tanggal: string;
    deskripsi: string;
    detail_jurnal: DetailJurnal[];
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
    auth: Auth;
    ziggy: Config & { location: string };
    [key: string]: unknown;
}

export interface AkuntansiPageProps extends PageProps {
    daftar_akun: DaftarAkun[];
}

export interface JurnalPageProps extends PageProps {
    jurnal?: Jurnal;
    daftar_akun: DaftarAkun[];
}

export interface BukuBesarTransaksi {
    id: number;
    tanggal: string;
    keterangan: string;
    referensi: string;
    debet: number;
    kredit: number;
    saldo: number;
}

export interface BukuBesarData {
    akun: DaftarAkun;
    saldo_awal: number;
    saldo_akhir: number;
    mutasi_debet: number;
    mutasi_kredit: number;
    transaksi: BukuBesarTransaksi[];
}

export interface BukuBesarPageProps extends PageProps {
    bukuBesar: BukuBesarData[];
    semuaAkun: DaftarAkun[];
    filters: {
        daftar_akun_id?: number;
        periode_dari: string;
        periode_sampai: string;
        jenis_akun?: string;
    };
    jenisAkun: Record<string, string>;
}

export interface BukuBesarDetailPageProps extends PageProps {
    akun: DaftarAkun;
    saldoAwal: number;
    saldoAkhir: number;
    mutasiDebet: number;
    mutasiKredit: number;
    transaksi: BukuBesarTransaksi[];
    filters: {
        periode_dari: string;
        periode_sampai: string;
    };
}

export interface InventoryItem {
    id: number;
    name: string;
    code: string;
    barcode?: string;
    sku?: string;
    category_id: number;
    type: 'general' | 'pharmacy';
    unit: string;
    description?: string;
    manufacturer?: string;
    supplier?: string;
    minimum_stock: number;
    maximum_stock?: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    category?: InventoryCategory;
    stocks?: InventoryStock[];
    current_stock?: number;
    available_stock?: number;
    reserved_stock?: number;
}

export interface InventoryCategory {
    id: number;
    name: string;
    code: string;
    description?: string;
    parent_id?: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    parent?: InventoryCategory;
    children?: InventoryCategory[];
    items?: InventoryItem[];
    items_count?: number;
}

export interface InventoryLocation {
    id: number;
    name: string;
    code: string;
    type: 'warehouse' | 'store' | 'clinic' | 'pharmacy';
    address?: string;
    description?: string;
    capacity?: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    stocks?: InventoryStock[];
}

export interface InventoryStock {
    id: number;
    item_id: number;
    location_id: number;
    current_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    reorder_level: number;
    max_stock_level?: number;
    unit_cost: number;
    total_value: number;
    last_updated: string;
    created_at: string;
    updated_at: string;
    item?: InventoryItem;
    location?: InventoryLocation;
}

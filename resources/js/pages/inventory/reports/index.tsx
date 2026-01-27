import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    FileBarChart, 
    Search, 
    Filter, 
    Download, 
    CheckCircle, 
    Clock, 
    XCircle, 
    Package,
    ChevronDown,
    Calendar,
    Eye,
    Check,
    ChevronsUpDown,
    FileText,
    FileSpreadsheet
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Department {
    id: number;
    name: string;
    is_active?: boolean;
}

interface Supplier {
    id: number;
    name: string;
    is_active?: boolean;
}

interface Item {
    id: number;
    name: string;
    code: string;
}

interface ColumnOption {
    value: string;
    label: string;
}

interface ReportItem {
    id: number;
    [key: string]: any;
}

interface Props extends PageProps {
    reportData: {
        data: ReportItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    summary: any;
    departments: Department[];
    suppliers: Supplier[];
    items: Item[];
    filters: {
        report_type: string;
        show_rankings?: boolean;
        date_from?: string;
        date_to?: string;
        department_id?: number;
        supplier_id?: number;
        status?: string;
        item_id?: number;
        columns: string;
    };
    availableColumns: ColumnOption[];
    selectedColumns: string[];
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Laporan Inventory', href: '' },
];

const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
        draft: { variant: 'secondary', icon: Clock, label: 'Draft' },
        submitted: { variant: 'default', icon: Clock, label: 'Submitted' },
        pending: { variant: 'default', icon: Clock, label: 'Pending' },
        approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
        completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
        rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
        cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
        ordered: { variant: 'default', icon: Package, label: 'Ordered' },
        partial: { variant: 'default', icon: Package, label: 'Partial' },
    };

    const config = statusConfig[status] || { variant: 'secondary', icon: null, label: status };
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
            {Icon && <Icon className="h-3 w-3" />}
            {config.label}
        </Badge>
    );
};

const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { variant: any; label: string }> = {
        low: { variant: 'secondary', label: 'Rendah' },
        normal: { variant: 'default', label: 'Normal' },
        high: { variant: 'default', label: 'Tinggi' },
        urgent: { variant: 'destructive', label: 'Urgent' },
    };

    const config = priorityConfig[priority] || { variant: 'secondary', label: priority };

    return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
        return format(new Date(date), 'dd MMM yyyy', { locale: idLocale });
    } catch {
        return '-';
    }
};

export default function Index({
    reportData,
    departments,
    suppliers,
    items,
    filters,
    availableColumns,
    selectedColumns: initialSelectedColumns,
}: Props) {
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [openDepartment, setOpenDepartment] = useState(false);
    const [openSupplier, setOpenSupplier] = useState(false);
    const [openItem, setOpenItem] = useState(false);
    const [openStatus, setOpenStatus] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        report_type: filters.report_type || 'stock_requests',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        department_id: filters.department_id?.toString() || '',
        supplier_id: filters.supplier_id?.toString() || '',
        status: filters.status || '',
        item_id: filters.item_id?.toString() || '',
    });
    const [selectedColumns, setSelectedColumns] = useState<string[]>(initialSelectedColumns);

    // Check if current report type is ranking
    const isRankingReport = ['stock_request_rankings', 'stock_request_item_rankings', 'purchase_item_rankings'].includes(filters.report_type);

    // Get current columns based on report type - always use availableColumns from server since it's already set correctly
    const currentColumns = availableColumns;

    const handleFilterChange = (key: string, value: any) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        router.get(
            route('inventory-reports.index'),
            {
                ...localFilters,
                columns: selectedColumns.join(','),
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleResetFilters = () => {
        setLocalFilters({
            report_type: 'stock_requests',
            date_from: '',
            date_to: '',
            department_id: '',
            supplier_id: '',
            status: '',
            item_id: '',
        });
        setSelectedColumns(['request_number', 'request_date', 'department_name', 'status', 'total_items', 'total_quantity_requested']);
    };

    const handleColumnToggle = (column: string) => {
        setSelectedColumns((prev) =>
            prev.includes(column)
                ? prev.filter((c) => c !== column)
                : [...prev, column]
        );
    };

    const handleReportTypeChange = (type: string) => {
        // Determine new columns based on type
        let newColumns: string[];
        if (type === 'stock_requests') {
            newColumns = ['request_number', 'request_date', 'department_name', 'status', 'total_items', 'total_quantity_requested'];
        } else if (type === 'stock_request_rankings') {
            newColumns = ['rank', 'department_name', 'total_requests', 'total_items', 'total_approved', 'approval_rate'];
        } else if (type === 'stock_request_item_rankings') {
            newColumns = ['rank', 'item_code', 'item_name', 'category_name', 'total_requests', 'total_quantity_requested', 'total_quantity_approved', 'approval_rate'];
        } else if (type === 'purchase_item_rankings') {
            newColumns = ['rank', 'item_code', 'item_name', 'category_name', 'total_purchases', 'total_quantity', 'total_amount', 'avg_unit_price'];
        } else if (type === 'stock_request_items') {
            newColumns = ['item_name', 'department_name', 'quantity_requested'];
        } else if (type === 'purchase_items') {
            newColumns = ['item_name', 'supplier_name', 'quantity_ordered', 'total_price'];
        } else {
            newColumns = ['purchase_number', 'purchase_date', 'supplier_name', 'status', 'total_amount', 'items_count'];
        }

        // Auto-fetch data when report type changes
        router.get(
            route('inventory-reports.index'),
            {
                report_type: type,
                date_from: localFilters.date_from,
                date_to: localFilters.date_to,
                columns: newColumns.join(','),
            },
            {
                preserveState: false,
                replace: true,
            }
        );
    };

    const handleExport = (format: 'excel' | 'pdf') => {
        const params = {
            report_type: filters.report_type, // Use server-side filter for current report type
            date_from: localFilters.date_from,
            date_to: localFilters.date_to,
            department_id: localFilters.department_id,
            supplier_id: localFilters.supplier_id,
            status: localFilters.status,
            item_id: localFilters.item_id,
            columns: selectedColumns.join(','),
            format,
        };

        window.location.href = route('inventory-reports.export', params);
    };

    const handlePageChange = (page: number) => {
        router.get(
            route('inventory-reports.index'),
            {
                ...localFilters,
                columns: selectedColumns.join(','),
                page,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const getStatusOptions = () => {
        if (['stock_requests', 'stock_request_items', 'stock_request_rankings', 'stock_request_item_rankings'].includes(localFilters.report_type)) {
            return [
                { value: '', label: 'Semua Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'approved', label: 'Approved' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'cancelled', label: 'Cancelled' },
            ];
        } else {
            return [
                { value: '', label: 'Semua Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'ordered', label: 'Ordered' },
                { value: 'partial', label: 'Partial' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
            ];
        }
    };

    const renderCellValue = (item: ReportItem, column: string) => {
        const value = item[column];

        // Handle different data types
        if (column.includes('date') && value) {
            return formatDate(value);
        }

        if (column === 'status') {
            return getStatusBadge(value);
        }

        if (column === 'priority') {
            return getPriorityBadge(value);
        }

        if (column.includes('amount') || column.includes('price')) {
            return formatCurrency(value || 0);
        }

        // Handle numeric columns for ranking report
        if (column === 'rank' || column === 'total_requests' || column === 'total_approved') {
            return value !== undefined && value !== null ? Math.floor(value).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : '-';
        }

        if (column.includes('quantity') || column.includes('items_count') || column.includes('total_items') || column === 'total_purchases') {
            return Math.floor(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
        }

        // Handle approval_rate which already has % suffix
        if (column === 'approval_rate') {
            return value || '0%';
        }

        return value !== undefined && value !== null && value !== '' ? value : '-';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Laporan Inventory" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileBarChart className="h-5 w-5" />
                                Laporan Inventory
                            </CardTitle>
                            <CardDescription>
                                Laporan dan analisis data inventory dengan filter yang dapat disesuaikan
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                            className="gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            {isFilterExpanded ? 'Tutup Filter' : 'Filter & Export'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Report Type Selection */}
                    <div className="grid gap-2">
                        <Label>Tipe Laporan</Label>
                        <Select
                            value={localFilters.report_type}
                            onValueChange={handleReportTypeChange}
                        >
                            <SelectTrigger className="w-full sm:w-64">
                                <SelectValue placeholder="Pilih Tipe Laporan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stock_requests">
                                    Laporan Permintaan Stok
                                </SelectItem>
                                <SelectItem value="stock_request_items">
                                    Laporan Detail Item Permintaan
                                </SelectItem>
                                <SelectItem value="stock_request_rankings">
                                    Ranking Permintaan per Departemen
                                </SelectItem>
                                <SelectItem value="stock_request_item_rankings">
                                    Ranking Item Paling Banyak Diminta
                                </SelectItem>
                                <SelectItem value="purchases">
                                    Laporan Pembelian
                                </SelectItem>
                                <SelectItem value="purchase_items">
                                    Laporan Detail Item Pembelian
                                </SelectItem>
                                <SelectItem value="purchase_item_rankings">
                                    Ranking Item Paling Banyak Dibeli
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-col gap-4">
                                {/* Date Range */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Tanggal Dari
                                            </Label>
                                            <Input
                                                type="date"
                                                value={localFilters.date_from}
                                                onChange={(e) =>
                                                    handleFilterChange('date_from', e.target.value)
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Tanggal Sampai
                                            </Label>
                                            <Input
                                                type="date"
                                                value={localFilters.date_to}
                                                onChange={(e) =>
                                                    handleFilterChange('date_to', e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Conditional Filters based on report type */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Department filter - for stock_requests, stock_request_items and stock_request_item_rankings */}
                                        {['stock_requests', 'stock_request_items', 'stock_request_item_rankings'].includes(localFilters.report_type) && (
                                            <div className="grid gap-2">
                                                <Label>Departemen</Label>
                                                <Popover open={openDepartment} onOpenChange={setOpenDepartment}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openDepartment}
                                                            className="justify-between w-full"
                                                        >
                                                            {localFilters.department_id
                                                                ? departments.find((dept) => dept.id.toString() === localFilters.department_id)?.name
                                                                : "Semua Departemen"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Cari departemen..." />
                                                            <CommandList>
                                                                <CommandEmpty>Departemen tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        onSelect={() => {
                                                                            handleFilterChange('department_id', '');
                                                                            setOpenDepartment(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                !localFilters.department_id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        Semua Departemen
                                                                    </CommandItem>
                                                                    {departments.map((dept) => (
                                                                        <CommandItem
                                                                            key={dept.id}
                                                                            onSelect={() => {
                                                                                handleFilterChange('department_id', dept.id.toString());
                                                                                setOpenDepartment(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    localFilters.department_id === dept.id.toString() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {dept.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}

                                        {/* Supplier filter - for purchases, purchase_items and purchase_item_rankings */}
                                        {['purchases', 'purchase_items', 'purchase_item_rankings'].includes(localFilters.report_type) && (
                                            <div className="grid gap-2">
                                                <Label>Supplier</Label>
                                                <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openSupplier}
                                                            className="justify-between w-full"
                                                        >
                                                            {localFilters.supplier_id
                                                                ? suppliers.find((supplier) => supplier.id.toString() === localFilters.supplier_id)?.name
                                                                : "Semua Supplier"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Cari supplier..." />
                                                            <CommandList>
                                                                <CommandEmpty>Supplier tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        onSelect={() => {
                                                                            handleFilterChange('supplier_id', '');
                                                                            setOpenSupplier(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                !localFilters.supplier_id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        Semua Supplier
                                                                    </CommandItem>
                                                                    {suppliers.map((supplier) => (
                                                                        <CommandItem
                                                                            key={supplier.id}
                                                                            onSelect={() => {
                                                                                handleFilterChange('supplier_id', supplier.id.toString());
                                                                                setOpenSupplier(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    localFilters.supplier_id === supplier.id.toString() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {supplier.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}

                                        {/* Status filter - for stock_requests, stock_request_items, purchases, purchase_items */}
                                        {['stock_requests', 'stock_request_items', 'purchases', 'purchase_items'].includes(localFilters.report_type) && (
                                            <div className="grid gap-2">
                                                <Label>Status</Label>
                                                <Popover open={openStatus} onOpenChange={setOpenStatus}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openStatus}
                                                            className="justify-between w-full"
                                                        >
                                                            {localFilters.status
                                                                ? getStatusOptions().find((option) => option.value === localFilters.status)?.label
                                                                : "Semua Status"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Cari status..." />
                                                            <CommandList>
                                                                <CommandEmpty>Status tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {getStatusOptions().map((option) => (
                                                                        <CommandItem
                                                                            key={option.value || 'all'}
                                                                            value={option.label}
                                                                            onSelect={() => {
                                                                                handleFilterChange('status', option.value);
                                                                                setOpenStatus(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    localFilters.status === option.value ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {option.label}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}

                                        {/* Item filter - for stock_requests, stock_request_items, purchases, purchase_items */}
                                        {['stock_requests', 'stock_request_items', 'purchases', 'purchase_items'].includes(localFilters.report_type) && (
                                            <div className="grid gap-2">
                                                <Label>Item</Label>
                                                <Popover open={openItem} onOpenChange={setOpenItem}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openItem}
                                                            className="justify-between w-full"
                                                        >
                                                            {localFilters.item_id
                                                                ? (() => {
                                                                    const selectedItem = items.find((item) => item.id.toString() === localFilters.item_id);
                                                                    return selectedItem ? `${selectedItem.code} - ${selectedItem.name}` : "Semua Item";
                                                                })()
                                                                : "Semua Item"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Cari item..." />
                                                            <CommandList>
                                                                <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    <CommandItem
                                                                        onSelect={() => {
                                                                            handleFilterChange('item_id', '');
                                                                            setOpenItem(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                !localFilters.item_id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        Semua Item
                                                                    </CommandItem>
                                                                    {items.map((item) => (
                                                                        <CommandItem
                                                                            key={item.id}
                                                                            value={`${item.code} ${item.name}`}
                                                                            onSelect={() => {
                                                                                handleFilterChange('item_id', item.id.toString());
                                                                                setOpenItem(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    localFilters.item_id === item.id.toString() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {item.code} - {item.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info for ranking report */}
                                    {isRankingReport && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                Laporan ranking menampilkan peringkat berdasarkan data terbanyak.
                                                Gunakan filter tanggal untuk membatasi periode laporan.
                                            </p>
                                        </div>
                                    )}

                                    {/* Column Selector for Display & Export */}
                                    <div className="grid gap-2">
                                        <Label>Kolom Ditampilkan & Export {isRankingReport && "(Mode Ranking)"}</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="justify-between">
                                                    {selectedColumns.length} kolom dipilih
                                                    <ChevronDown className="h-4 w-4 ml-2" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="grid gap-2">
                                                    <div className="font-medium text-sm">
                                                        Pilih Kolom untuk Tabel & Export {isRankingReport && "(Ranking)"}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Kolom yang dipilih akan ditampilkan di tabel dan digunakan saat export PDF/Excel
                                                    </p>
                                                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                                                        {currentColumns.map((column) => (
                                                            <div
                                                                key={column.value}
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <Checkbox
                                                                    id={`col-${column.value}`}
                                                                    checked={selectedColumns.includes(
                                                                        column.value
                                                                    )}
                                                                    onCheckedChange={() =>
                                                                        handleColumnToggle(column.value)
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={`col-${column.value}`}
                                                                    className="text-sm font-normal cursor-pointer flex-1 select-none"
                                                                >
                                                                    {column.label}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            onClick={handleApplyFilters}
                                            className="gap-2"
                                        >
                                            <Search className="h-4 w-4" />
                                            Tampilkan Laporan
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleResetFilters}
                                        >
                                            Reset Filter
                                        </Button>
                                        <div className="flex-1" />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="gap-2">
                                                    <Download className="h-4 w-4" />
                                                    Export
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                    Export Excel
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Export PDF
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                            </div>
                        </div>
                    )}

                    {/* Data Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {!isRankingReport && <TableHead className="w-[60px]">No</TableHead>}
                                    {selectedColumns.map((column) => {
                                        const columnInfo = currentColumns.find(
                                            (c) => c.value === column
                                        );
                                        return (
                                            <TableHead key={column}>
                                                {columnInfo?.label || column}
                                            </TableHead>
                                        );
                                    })}
                                    {!isRankingReport && (
                                        <TableHead className="w-[80px] text-center">
                                            Aksi
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={selectedColumns.length + (isRankingReport ? 0 : 2)}
                                            className="text-center py-8"
                                        >
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <FileBarChart className="h-12 w-12" />
                                                <p>Tidak ada data</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportData.data.map((item, index) => (
                                        <TableRow key={isRankingReport ? index : item.id}>
                                            {!isRankingReport && (
                                                <TableCell>
                                                    {(reportData.current_page - 1) *
                                                        reportData.per_page +
                                                        index +
                                                        1}
                                                </TableCell>
                                            )}
                                            {selectedColumns.map((column) => (
                                                <TableCell key={column}>
                                                    {renderCellValue(item, column)}
                                                </TableCell>
                                            ))}
                                            {!isRankingReport && (
                                                <TableCell className="text-center">
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {reportData.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan{' '}
                                {(reportData.current_page - 1) * reportData.per_page + 1} sampai{' '}
                                {Math.min(
                                    reportData.current_page * reportData.per_page,
                                    reportData.total
                                )}{' '}
                                dari {reportData.total} data
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(reportData.current_page - 1)
                                    }
                                    disabled={reportData.current_page === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from(
                                        { length: Math.min(5, reportData.last_page) },
                                        (_, i) => {
                                            const page =
                                                Math.max(1, reportData.current_page - 2) + i;
                                            if (page > reportData.last_page) return null;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page === reportData.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="w-8"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        }
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(reportData.current_page + 1)
                                    }
                                    disabled={
                                        reportData.current_page === reportData.last_page
                                    }
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
            </CardContent>
        </Card>
        </AppLayout>
    );
}

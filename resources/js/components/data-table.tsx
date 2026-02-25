import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { type ReactNode, useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────
export interface Column<T> {
    /** Unique key for the column */
    key: string;
    /** Header label */
    label: string;
    /** Whether the column should be hidden */
    hidden?: boolean;
    /** Fixed width class e.g. "w-12" */
    className?: string;
    /** Render cell content */
    render: (row: T, index: number, meta: RowMeta) => ReactNode;
    /** Render custom header content (overrides label) */
    headerRender?: () => ReactNode;
}

export interface FilterField {
    name: string;
    label: string;
    type: 'select' | 'date' | 'text';
    placeholder?: string;
    options?: { value: string; label: string }[];
    value?: string;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface RowMeta {
    /** 1-based row number across pages */
    rowNumber: number;
}

export interface DataTableProps<T> {
    /** Column definitions */
    columns: Column<T>[];
    /** Row data */
    data: T[];
    /** Pagination info */
    pagination?: PaginationData;

    // ─── Search ──────────────────────────────────────────────
    /** Current search value from server filters */
    searchValue?: string;
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Called when search is submitted */
    onSearch?: (value: string) => void;

    // ─── Filters ─────────────────────────────────────────────
    /** Filter field definitions */
    filters?: FilterField[];
    /** Called when a filter changes. Key = field name, value = new value */
    onFilterChange?: (name: string, value: string) => void;
    /** Called when all filters are reset */
    onFilterReset?: () => void;

    // ─── Pagination ──────────────────────────────────────────
    /** Called when page changes */
    onPageChange?: (page: number) => void;
    /** Called when per-page changes */
    onPerPageChange?: (perPage: number) => void;
    /** Per-page options */
    perPageOptions?: number[];

    // ─── Header area ─────────────────────────────────────────
    /** Action buttons rendered in the header right side */
    headerActions?: ReactNode;

    // ─── Empty state ─────────────────────────────────────────
    /** Icon for empty state */
    emptyIcon?: ReactNode;
    /** Text for empty state */
    emptyText?: string;

    // ─── Row key ─────────────────────────────────────────────
    /** Function to extract unique key from a row */
    rowKey: (row: T) => string | number;

    // ─── Optional row click ──────────────────────────────────
    onRowClick?: (row: T) => void;

    // ─── Additional row className ────────────────────────────
    rowClassName?: (row: T) => string;

    // ─── Optional page title and subtitle ─────────────────────
    pageTitle?: string;
    pageSubtitle?: string;
}

// ─── Component ───────────────────────────────────────────────────────
export function DataTable<T>({
    columns,
    data,
    pagination = { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 },
    searchValue = '',
    searchPlaceholder = 'Cari...',
    onSearch,
    filters,
    onFilterChange,
    onFilterReset,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 20, 50, 100],
    headerActions,
    pageTitle,
    pageSubtitle,
    emptyIcon,
    emptyText = 'Tidak ada data ditemukan',
    rowKey,
    onRowClick,
    rowClassName,
}: DataTableProps<T>) {
    const [localSearch, setLocalSearch] = useState(searchValue);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Sync local search when server value changes
    useEffect(() => {
        setLocalSearch(searchValue);
    }, [searchValue]);

    // Auto-expand filters when there are active filter values
    useEffect(() => {
        if (filters?.some((f) => f.value && f.value !== '')) {
            setFiltersOpen(true);
        }
    }, [filters]);

    const handleSearchSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            onSearch?.(localSearch);
        },
        [localSearch, onSearch],
    );

    const handleClearSearch = useCallback(() => {
        setLocalSearch('');
        onSearch?.('');
    }, [onSearch]);

    const activeFilterCount = filters?.filter((f) => f.value && f.value !== '').length ?? 0;
    const visibleColumns = columns.filter((c) => !c.hidden);

    // ─── Pagination helpers ──────────────────────────────────
    const renderPageButtons = () => {
        const { current_page, last_page } = pagination;
        if (last_page <= 1) return null;

        const pages: (number | '...')[] = [];
        const window = 2;
        const start = Math.max(1, current_page - window);
        const end = Math.min(last_page, current_page + window);

        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < last_page) {
            if (end < last_page - 1) pages.push('...');
            pages.push(last_page);
        }

        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(current_page - 1)}
                    disabled={current_page <= 1}
                >
                    Sebelumnya
                </Button>
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-muted-foreground">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === current_page ? 'default' : 'outline'}
                            size="sm"
                            className="w-8"
                            onClick={() => onPageChange?.(p)}
                        >
                            {p}
                        </Button>
                    ),
                )}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(current_page + 1)}
                    disabled={current_page >= last_page}
                >
                    Selanjutnya
                </Button>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* ─── Header dan Judul Halaman ─────────────────────────── */}
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">{pageTitle}</h2>
                {pageSubtitle && <p className="text-muted-foreground">{pageSubtitle}</p>}
            </div>
            {/* ─── Search + Actions bar ─────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {onSearch ? (
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={localSearch}
                                onChange={(e) => setLocalSearch(e.target.value)}
                                className="pl-9 pr-8"
                            />
                            {localSearch && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="outline" size="sm">
                            Cari
                        </Button>
                    </form>
                ) : (
                    <div />
                )}

                <div className="flex items-center gap-2">
                    {filters && filters.length > 0 && (
                        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-xs">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                    <ChevronDown
                                        className={cn(
                                            'h-3.5 w-3.5 transition-transform',
                                            filtersOpen && 'rotate-180',
                                        )}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                    {headerActions}
                </div>
            </div>

            {/* ─── Collapsible Filters ──────────────────────────── */}
            {filters && filters.length > 0 && (
                <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <CollapsibleContent>
                        <div className="rounded-md border bg-muted/30 p-4">
                            <div className="flex flex-wrap items-end gap-4">
                                {filters.map((field) => (
                                    <div key={field.name} className="grid gap-1.5">
                                        <Label className="text-xs font-medium">{field.label}</Label>
                                        {field.type === 'select' ? (
                                            <Select
                                                value={field.value || ''}
                                                onValueChange={(v) =>
                                                    onFilterChange?.(field.name, v === '__all__' ? '' : v)
                                                }
                                            >
                                                <SelectTrigger className="w-44">
                                                    <SelectValue placeholder={field.placeholder || field.label} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map((opt) => (
                                                        <SelectItem
                                                            key={opt.value || '__all__'}
                                                            value={opt.value || '__all__'}
                                                        >
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                type={field.type}
                                                value={field.value || ''}
                                                onChange={(e) => onFilterChange?.(field.name, e.target.value)}
                                                placeholder={field.placeholder || field.label}
                                                className="w-44"
                                            />
                                        )}
                                    </div>
                                ))}
                                {onFilterReset && activeFilterCount > 0 && (
                                    <Button variant="outline" size="sm" onClick={onFilterReset} className="gap-1.5">
                                        <X className="h-3.5 w-3.5" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}

            {/* ─── Table ────────────────────────────────────────── */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.map((col) => (
                                <TableHead key={col.key} className={col.className}>
                                    {col.headerRender ? col.headerRender() : col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        {emptyIcon}
                                        <span>{emptyText}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => {
                                const meta: RowMeta = {
                                    rowNumber:
                                        (pagination.current_page - 1) * pagination.per_page + index + 1,
                                };
                                return (
                                    <TableRow
                                        key={rowKey(row)}
                                        className={cn(
                                            onRowClick && 'cursor-pointer',
                                            rowClassName?.(row),
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {visibleColumns.map((col) => (
                                            <TableCell key={col.key} className={col.className}>
                                                {col.render(row, index, meta)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ─── Pagination ───────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    {onPerPageChange && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Per halaman</Label>
                            <Select
                                value={pagination.per_page.toString()}
                                onValueChange={(v) => onPerPageChange(Number(v))}
                            >
                                <SelectTrigger className="w-18">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {perPageOptions.map((n) => (
                                        <SelectItem key={n} value={n.toString()}>
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {pagination.from != null && pagination.to != null && (
                        <span className="text-sm text-muted-foreground">
                            Menampilkan {pagination.from} &ndash; {pagination.to} dari {pagination.total}
                        </span>
                    )}
                </div>
                {renderPageButtons()}
            </div>
        </div>
    );
}

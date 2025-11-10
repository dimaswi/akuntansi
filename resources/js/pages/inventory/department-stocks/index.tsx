import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, Eye, Filter, Package, Search } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Department {
    id: number;
    name: string;
    code: string;
    total_items: number;
    total_quantity: number;
    total_value: number;
    items_count: number;
}

interface Props extends PageProps {
    departments: {
        data: Department[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Stok Department', href: '' },
];

export default function Index({ departments, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = () => {
        router.get(route('department-stocks.index'), {
            search: searchTerm,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        router.get(route('department-stocks.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
        if (num >= 1000 || num <= -1000) {
            return num.toLocaleString('id-ID');
        }
        return num.toString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Stok Department" />

            <Card className="mt-6">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Stok Department
                            </CardTitle>
                            <CardDescription>
                                Kelola dan pantau stok inventory per department
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by department name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} className="gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {searchTerm && (
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Collapsible Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <div className="text-sm text-muted-foreground">
                                Gunakan search box di atas untuk mencari department berdasarkan nama
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Department</TableHead>
                                    <TableHead className="text-center">Total Item</TableHead>
                                    <TableHead className="text-right">Total Qty</TableHead>
                                    <TableHead className="text-right">Total Nilai</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                            <p>Tidak ada data department</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    departments.data.map((dept) => (
                                        <TableRow 
                                            key={dept.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.visit(route('department-stocks.show', dept.id))}
                                        >
                                            <TableCell className="font-medium">
                                                {dept.code}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-gray-400" />
                                                    <span className="font-semibold">{dept.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">
                                                    {dept.total_items} items
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatNumber(dept.total_quantity)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(dept.total_value)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.visit(route('department-stocks.show', dept.id));
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {departments.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {(departments.current_page - 1) * departments.per_page + 1} to{' '}
                                {Math.min(
                                    departments.current_page * departments.per_page,
                                    departments.total
                                )}{' '}
                                of {departments.total} entries
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={departments.current_page === 1}
                                    onClick={() =>
                                        router.get(
                                            route('department-stocks.index', {
                                                page: departments.current_page - 1,
                                            })
                                        )
                                    }
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={departments.current_page === departments.last_page}
                                    onClick={() =>
                                        router.get(
                                            route('department-stocks.index', {
                                                page: departments.current_page + 1,
                                            })
                                        )
                                    }
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}

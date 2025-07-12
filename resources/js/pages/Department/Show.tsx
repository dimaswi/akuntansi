import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Building, User, MapPin, DollarSign, Users, Calendar, Settings } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

interface Department {
    id: number;
    code: string;
    name: string;
    description?: string;
    parent_id?: number;
    parent?: Department;
    manager_id?: number;
    manager?: {
        id: number;
        name: string;
        nip: string;
    };
    location?: string;
    monthly_budget_limit: number;
    current_month_usage: number;
    is_active: boolean;
    can_request_items: boolean;
    users: {
        id: number;
        name: string;
        nip: string;
        email: string;
    }[];
    created_at: string;
    updated_at: string;
}

interface ShowProps extends PageProps {
    department: Department;
    canEdit: boolean;
}

export default function DepartmentShow({ department, canEdit }: ShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Departemen',
            href: '/departments',
        },
        {
            title: department.name,
            href: `/departments/${department.id}`,
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getBudgetUsagePercentage = () => {
        if (department.monthly_budget_limit === 0) return 0;
        return (department.current_month_usage / department.monthly_budget_limit) * 100;
    };

    const getBudgetUsageBadge = () => {
        const percentage = getBudgetUsagePercentage();
        if (percentage >= 90) {
            return <Badge variant="destructive">Mendekati Limit</Badge>;
        } else if (percentage >= 70) {
            return <Badge variant="outline" className="text-yellow-600">Perlu Perhatian</Badge>;
        } else {
            return <Badge variant="outline" className="text-green-600">Sehat</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Departemen ${department.name}`} />
            
            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building className="h-6 w-6" />
                            {department.name}
                        </h1>
                        <p className="text-muted-foreground">{department.code}</p>
                    </div>
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button asChild>
                                <Link href={`/departments/${department.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/departments">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Department Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Informasi Departemen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    Kode Departemen
                                </div>
                                <div className="font-semibold text-lg">{department.code}</div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    Nama Departemen
                                </div>
                                <div className="font-semibold text-lg">{department.name}</div>
                            </div>
                            
                            {department.parent && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <Building className="h-4 w-4" />
                                        Departemen Induk
                                    </div>
                                    <div>
                                        <div className="font-semibold">{department.parent.name}</div>
                                        <div className="text-sm text-muted-foreground">{department.parent.code}</div>
                                    </div>
                                </div>
                            )}
                            
                            {department.manager && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        Manager
                                    </div>
                                    <div>
                                        <div className="font-semibold">{department.manager.name}</div>
                                        <div className="text-sm text-muted-foreground">{department.manager.nip}</div>
                                    </div>
                                </div>
                            )}
                            
                            {department.location && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        Lokasi
                                    </div>
                                    <div className="font-semibold">{department.location}</div>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Dibuat
                                </div>
                                <div className="font-semibold">{formatDate(department.created_at)}</div>
                            </div>
                        </div>
                        
                        {department.description && (
                            <div className="mt-6">
                                <div className="text-sm font-medium text-muted-foreground mb-2">Deskripsi</div>
                                <p className="text-gray-700">{department.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Budget Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Informasi Budget
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Budget Bulanan</div>
                                <div className="font-semibold text-2xl text-blue-600">
                                    {formatCurrency(department.monthly_budget_limit)}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Penggunaan Bulan Ini</div>
                                <div className="font-semibold text-2xl text-orange-600">
                                    {formatCurrency(department.current_month_usage)}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Sisa Budget</div>
                                <div className="font-semibold text-2xl text-green-600">
                                    {formatCurrency(department.monthly_budget_limit - department.current_month_usage)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Penggunaan Budget</span>
                                <span className="text-sm text-muted-foreground">
                                    {getBudgetUsagePercentage().toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${
                                        getBudgetUsagePercentage() >= 90 ? 'bg-red-500' :
                                        getBudgetUsagePercentage() >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(getBudgetUsagePercentage(), 100)}%` }}
                                ></div>
                            </div>
                            <div className="mt-2">
                                {getBudgetUsageBadge()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status & Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status & Pengaturan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Status Aktif</div>
                                <div>
                                    {department.is_active ? (
                                        <Badge variant="outline" className="text-green-600">Aktif</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-red-600">Tidak Aktif</Badge>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Dapat Mengajukan Permintaan</div>
                                <div>
                                    {department.can_request_items ? (
                                        <Badge variant="outline" className="text-green-600">Ya</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-red-600">Tidak</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assigned Users */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Karyawan Terdaftar ({department.users.length})
                        </CardTitle>
                        <CardDescription>
                            Daftar karyawan yang terdaftar di departemen ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {department.users.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>NIP</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {department.users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.nip}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Belum ada karyawan yang terdaftar di departemen ini
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

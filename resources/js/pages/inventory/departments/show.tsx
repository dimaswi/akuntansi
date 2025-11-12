import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Building2, Edit3, Package, Users, FileText, FileBarChart, Activity } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    role_name: string;
}

interface Department {
    id: number;
    code: string;
    name: string;
    level: number;
    is_active: boolean;
    parent?: {
        id: number;
        name: string;
    };
    children?: Array<{
        id: number;
        name: string;
        code: string;
    }>;
}

interface StockRequest {
    id: number;
    request_number: string;
    status: string;
    created_at: string;
}

interface StockOpname {
    id: number;
    opname_number: string;
    status: string;
    opname_date: string;
}

interface Props extends SharedData {
    department: Department;
    users: User[];
    stockItemsCount: number;
    recentRequests: StockRequest[];
    recentOpnames: StockOpname[];
    isLogistics: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Building2 className="h-4 w-4" />,
        href: '/departments',
    },
    {
        title: 'Departemen',
        href: '/departments',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
        draft: { variant: "secondary", label: "Draft" },
        pending: { variant: "outline", label: "Pending" },
        approved: { variant: "default", label: "Approved" },
        rejected: { variant: "destructive", label: "Rejected" },
        completed: { variant: "default", label: "Completed" },
        submitted: { variant: "outline", label: "Submitted" },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function DepartmentShow() {
    const { department, users, stockItemsCount, recentRequests, recentOpnames, isLogistics } = usePage<Props>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Departemen - ${department.name}`} />
            <div className="p-4 space-y-4">
                {/* Header Card */}
                <Card className="border-neutral-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit('/departments')}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Kembali
                                </Button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            {department.name}
                                        </CardTitle>
                                        <Badge variant={department.is_active ? "default" : "secondary"}>
                                            {department.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1">
                                        Kode: {department.code} | Level: {department.level}
                                    </CardDescription>
                                </div>
                            </div>
                            {isLogistics && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('departments.users', department.id))}
                                        className="gap-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        Kelola Users
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => router.visit(route('departments.edit', department.id))}
                                        className="gap-2"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Department Info & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Info Card */}
                    <Card className="border-neutral-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Informasi Departemen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <div className="text-neutral-500 text-xs mb-1">Kode</div>
                                <div className="font-mono font-semibold">{department.code}</div>
                            </div>
                            <div>
                                <div className="text-neutral-500 text-xs mb-1">Nama</div>
                                <div className="font-medium">{department.name}</div>
                            </div>
                            <div>
                                <div className="text-neutral-500 text-xs mb-1">Level</div>
                                <Badge variant="outline">Level {department.level}</Badge>
                            </div>
                            {department.parent && (
                                <div>
                                    <div className="text-neutral-500 text-xs mb-1">Parent Department</div>
                                    <div className="font-medium">{department.parent.name}</div>
                                </div>
                            )}
                            {department.children && department.children.length > 0 && (
                                <div>
                                    <div className="text-neutral-500 text-xs mb-1">Sub Departments ({department.children.length})</div>
                                    <div className="space-y-1">
                                        {department.children.map((child) => (
                                            <div key={child.id} className="text-xs">
                                                <span className="font-mono text-neutral-600">{child.code}</span> - {child.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <Card className="border-neutral-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-neutral-900">{users.length}</div>
                                    <div className="text-sm text-neutral-500">Total Users</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <Package className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-neutral-900">{stockItemsCount}</div>
                                    <div className="text-sm text-neutral-500">Stock Items</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Users List */}
                    <Card className="border-neutral-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Users di Departemen ({users.length})
                                </CardTitle>
                                {isLogistics && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('departments.users', department.id))}
                                        className="h-7 text-xs"
                                    >
                                        Kelola
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {users.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    Belum ada user di departemen ini
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-neutral-50">
                                                <TableHead className="text-xs">Nama</TableHead>
                                                <TableHead className="text-xs">Email</TableHead>
                                                <TableHead className="text-xs">Role</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user: User) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium text-sm">{user.name}</TableCell>
                                                    <TableCell className="text-xs text-neutral-600">{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {user.role_name}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <div className="space-y-4">
                        {/* Recent Stock Requests */}
                        <Card className="border-neutral-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Stock Requests Terbaru
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentRequests.length === 0 ? (
                                    <div className="text-center py-6 text-neutral-500 text-sm">
                                        Belum ada stock request
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentRequests.map((request: StockRequest) => (
                                            <div
                                                key={request.id}
                                                className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 cursor-pointer"
                                                onClick={() => router.visit(route('stock-requests.show', request.id))}
                                            >
                                                <div>
                                                    <div className="text-sm font-medium font-mono">{request.request_number}</div>
                                                    <div className="text-xs text-neutral-500">{formatDate(request.created_at)}</div>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Stock Opnames */}
                        <Card className="border-neutral-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileBarChart className="h-4 w-4" />
                                    Stock Opname Terbaru
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentOpnames.length === 0 ? (
                                    <div className="text-center py-6 text-neutral-500 text-sm">
                                        Belum ada stock opname
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentOpnames.map((opname: StockOpname) => (
                                            <div
                                                key={opname.id}
                                                className="flex items-center justify-between p-2 rounded-md hover:bg-neutral-50 cursor-pointer"
                                                onClick={() => router.visit(route('stock-opnames.show', opname.id))}
                                            >
                                                <div>
                                                    <div className="text-sm font-medium font-mono">{opname.opname_number}</div>
                                                    <div className="text-xs text-neutral-500">{formatDate(opname.opname_date)}</div>
                                                </div>
                                                {getStatusBadge(opname.status)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Users, UserPlus, UserMinus, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from '@/lib/toast';

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
}

interface Props extends SharedData {
    department: Department;
    departmentUsers: User[];
    availableUsers: User[];
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
        title: 'Kelola Users',
        href: '#',
    },
];

export default function DepartmentUsers() {
    const { department, departmentUsers, availableUsers } = usePage<Props>().props;
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    const handleSelectUser = (userId: number) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === availableUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(availableUsers.map((u: User) => u.id));
        }
    };

    const handleAssignUsers = () => {
        if (selectedUsers.length === 0) {
            toast.error('Pilih minimal 1 user untuk di-assign');
            return;
        }

        router.post(route('departments.assign-users', department.id), {
            user_ids: selectedUsers,
        }, {
            onSuccess: () => {
                setSelectedUsers([]);
            },
            onError: (errors) => {
                toast.error(errors?.message || 'Gagal assign users');
            },
        });
    };

    const handleRemoveUser = (userId: number) => {
        if (!confirm('Hapus user dari departemen ini?')) return;

        router.post(route('departments.remove-user', department.id), {
            user_id: userId,
        }, {
            onError: (errors) => {
                toast.error(errors?.message || 'Gagal menghapus user');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kelola Users - ${department.name}`} />
            <div className="p-4 space-y-4">
                {/* Header */}
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
                                </Button>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Kelola Users Departemen
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {department.name} ({department.code})
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant={department.is_active ? "default" : "secondary"}>
                                {department.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Available Users - Left Side */}
                    <Card className="border-neutral-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <UserPlus className="h-4 w-4" />
                                        User Tersedia ({availableUsers.length})
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-1">
                                        User yang belum terdaftar di departemen manapun
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {availableUsers.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    Semua user sudah terdaftar di departemen
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="select-all"
                                                checked={selectedUsers.length === availableUsers.length && availableUsers.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                                Pilih Semua
                                            </label>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleAssignUsers}
                                            disabled={selectedUsers.length === 0}
                                            className="gap-2"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            Assign ({selectedUsers.length})
                                        </Button>
                                    </div>

                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-neutral-50">
                                                    <TableHead className="w-12"></TableHead>
                                                    <TableHead>Nama</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Role</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {availableUsers.map((user: User) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedUsers.includes(user.id)}
                                                                onCheckedChange={() => handleSelectUser(user.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{user.name}</TableCell>
                                                        <TableCell className="text-sm text-neutral-600">{user.email}</TableCell>
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
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Department Users - Right Side */}
                    <Card className="border-neutral-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                User di Departemen ({departmentUsers.length})
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                User yang sudah terdaftar di departemen ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {departmentUsers.length === 0 ? (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    Belum ada user di departemen ini
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-neutral-50">
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {departmentUsers.map((user: User) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell className="text-sm text-neutral-600">{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {user.role_name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRemoveUser(user.id)}
                                                            className="gap-2 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <UserMinus className="h-3 w-3" />
                                                            Hapus
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

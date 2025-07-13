import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Users, Building2, Search, Edit, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface Department {
    id: number;
    name: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
    email?: string;
    department_id?: number;
    department?: Department;
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    users: PaginatedUsers;
    departments: Department[];
    filters: {
        search: string;
        department_id?: string;
    };
}

export default function UserDepartmentIndex() {
    const { users, departments, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || 'all');

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Master Data", href: "#" },
        { title: "User Department", href: route('users.departments.index') },
    ];

    const handleSearch = () => {
        router.get(route('users.departments.index'), {
            search,
            department_id: selectedDepartment === 'all' ? undefined : selectedDepartment,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setSelectedDepartment('all');
        router.get(route('users.departments.index'));
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbItems}
        >
            <Head title="User Department Assignment" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-semibold">User Department Assignment</h1>
                            <p className="text-muted-foreground">Kelola assignment user ke department</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Cari User</label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari berdasarkan nama atau email..."
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div className="w-64">
                                <label className="text-sm font-medium mb-2 block">Department</label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Department</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch}>
                                    <Search className="h-4 w-4 mr-2" />
                                    Cari
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Daftar User ({users.total} total)
                        </CardTitle>
                        <CardDescription>
                            Kelola assignment department untuk setiap user
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.data.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{user.name}</h3>
                                            <p className="text-sm text-muted-foreground">NIP: {user.nip}</p>
                                            {user.email && (
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            {user.department ? (
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {user.department.name}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    Tidak ada department
                                                </Badge>
                                            )}
                                        </div>
                                        
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.visit(route('users.departments.edit', user.id))}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            
                            {users.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada user yang ditemukan
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex justify-center mt-6">
                                <div className="flex gap-2">
                                    {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={page === users.current_page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => router.get(route('users.departments.index'), {
                                                ...filters,
                                                page,
                                            })}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

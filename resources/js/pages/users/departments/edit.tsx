import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Users, Building2, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

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

interface Props extends SharedData {
    user: User;
    departments: Department[];
}

export default function EditUserDepartment() {
    const { user, departments } = usePage<Props>().props;
    
    const { data, setData, put, processing, errors } = useForm({
        department_id: user.department_id?.toString() || 'none',
    });

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: "Dashboard", href: "/dashboard" },
        { title: "Master Data", href: "#" },
        { title: "User Department", href: route('users.departments.index') },
        { title: `Edit ${user.name}`, href: "#" },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.departments.update', user.id), {
            onSuccess: () => {
                toast.success('Department assignment berhasil diupdate!');
                router.visit(route('users.departments.index'));
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error('Gagal mengupdate department assignment.');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Edit Department - ${user.name}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-semibold">Edit Department Assignment</h1>
                            <p className="text-muted-foreground">Update assignment department untuk user</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route('users.departments.index'))}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* User Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Informasi User
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Nama</Label>
                                <p className="font-medium">{user.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">NIP</Label>
                                <p className="font-medium">{user.nip}</p>
                            </div>
                            {user.email && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            )}
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Department Saat Ini</Label>
                                <p className="font-medium">
                                    {user.department ? user.department.name : 'Tidak ada department'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Form */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Update Department Assignment</CardTitle>
                            <CardDescription>
                                Pilih department baru untuk user ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="department_id">Department</Label>
                                    <Select 
                                        value={data.department_id} 
                                        onValueChange={(value) => setData('department_id', value === 'none' ? '' : value)}
                                    >
                                        <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Tidak ada department</SelectItem>
                                            {departments.map((department) => (
                                                <SelectItem key={department.id} value={department.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4" />
                                                        <span>{department.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.department_id}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('users.departments.index'))}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

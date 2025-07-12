import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, MapPin, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { InventoryLocation, PageProps } from '@/types';

interface LocationsIndexProps extends PageProps {
    locations: {
        data: InventoryLocation[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
    locationTypes: string[];
}

export default function Index({ locations, filters, locationTypes }: LocationsIndexProps) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleSearch = () => {
        router.get(route('inventory.locations.index'), {
            search: searchValue,
            type: typeFilter !== 'all' ? typeFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (location: InventoryLocation) => {
        if (confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) {
            router.delete(route('inventory.locations.destroy', location.id), {
                onSuccess: () => {
                    toast.success('Lokasi berhasil dihapus');
                },
                onError: () => {
                    toast.error('Gagal menghapus lokasi');
                }
            });
        }
    };

    const getTypeColor = (type: string) => {
        const colors = {
            warehouse: 'bg-blue-100 text-blue-800',
            store: 'bg-green-100 text-green-800',
            clinic: 'bg-purple-100 text-purple-800',
            pharmacy: 'bg-orange-100 text-orange-800',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getStatusColor = (status: string) => {
        return status === 'active' 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    return (
        <AppLayout>
            <Head title="Lokasi Inventori" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lokasi Inventori</h1>
                        <p className="text-gray-600">Kelola lokasi penyimpanan inventori</p>
                    </div>
                    <Link href={route('inventory.locations.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Lokasi
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Cari lokasi..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} variant="outline">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    {locationTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch} className="flex-1">
                                    <Search className="h-4 w-4 mr-2" />
                                    Cari
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.data.map((location) => (
                        <Card key={location.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-gray-500" />
                                        <div>
                                            <CardTitle className="text-lg">{location.name}</CardTitle>
                                            <p className="text-sm text-gray-600">{location.code}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Badge className={getTypeColor(location.type)}>
                                            {location.type}
                                        </Badge>
                                        <Badge className={getStatusColor(location.status)}>
                                            {location.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {location.address && (
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {location.address}
                                        </p>
                                    )}
                                    {location.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {location.description}
                                        </p>
                                    )}
                                    {location.capacity && (
                                        <div className="text-sm">
                                            <span className="text-gray-600">Kapasitas: </span>
                                            <span className="font-medium">{location.capacity}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Link href={route('inventory.locations.edit', location.id)}>
                                            <Button variant="outline" size="sm">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(location)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {locations.data.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Belum ada lokasi inventori</p>
                            <Link href={route('inventory.locations.create')}>
                                <Button className="mt-4">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Lokasi Pertama
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Pagination */}
                {locations.links && locations.links.length > 3 && (
                    <div className="flex justify-center space-x-2">
                        {locations.links.map((link, index) => (
                            link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

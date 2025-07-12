import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, Save, RotateCcw } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface InventoryItem {
    id: number;
    name: string;
    code: string;
    unit_of_measure: string;
    category: {
        id: number;
        name: string;
    };
}

interface DepartmentStock {
    id: number;
    inventory_item_id: number;
    department_id: number;
    current_stock: number;
    reserved_stock: number;
    minimum_stock: number;
    maximum_stock: number;
    last_updated: string;
    inventory_item: InventoryItem;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface OpnameData {
    id: number;
    physical_count: number;
    system_count: number;
    difference: number;
    notes: string;
}

interface Props {
    department: Department;
    departmentStocks: DepartmentStock[];
}

export default function StockOpname({ department, departmentStocks }: Props) {
    const [opnameData, setOpnameData] = useState<Record<number, OpnameData>>({});
    const [processing, setProcessing] = useState(false);
    const [notes, setNotes] = useState('');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Departemen', href: '/departments' },
        { title: department.name, href: `/departments/${department.id}` },
        { title: 'Stok Barang', href: `/departments/${department.id}/stock` },
        { title: 'Stock Opname', href: '' },
    ];

    const handlePhysicalCountChange = (stockId: number, physicalCount: number) => {
        const stock = departmentStocks.find(s => s.id === stockId);
        if (!stock) return;

        const systemCount = stock.current_stock;
        const difference = physicalCount - systemCount;

        setOpnameData(prev => ({
            ...prev,
            [stockId]: {
                id: stockId,
                physical_count: physicalCount,
                system_count: systemCount,
                difference,
                notes: prev[stockId]?.notes || ''
            }
        }));
    };

    const handleNotesChange = (stockId: number, notes: string) => {
        setOpnameData(prev => ({
            ...prev,
            [stockId]: {
                ...prev[stockId],
                notes
            }
        }));
    };

    const getDifferenceColor = (difference: number) => {
        if (difference > 0) return 'text-green-600 bg-green-50';
        if (difference < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    const getDifferenceIcon = (difference: number) => {
        if (difference > 0) return '+';
        return '';
    };

    const getVariantColor = (difference: number) => {
        if (difference > 0) return 'default';
        if (difference < 0) return 'destructive';
        return 'outline';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const hasData = Object.keys(opnameData).length > 0;
        if (!hasData) {
            alert('Mohon isi minimal satu item untuk stock opname');
            return;
        }

        setProcessing(true);

        const formData = {
            department_id: department.id,
            opname_data: Object.values(opnameData).filter(data => 
                data.physical_count !== undefined && data.physical_count !== data.system_count
            ),
            notes: notes
        };

        router.post(`/departments/${department.id}/stock/opname`, formData as any, {
            onSuccess: () => {
                // Reset form
                setOpnameData({});
                setNotes('');
            },
            onError: (errors) => {
                console.error('Stock opname errors:', errors);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTotalDifferences = () => {
        const data = Object.values(opnameData);
        return {
            positive: data.filter(d => d.difference > 0).length,
            negative: data.filter(d => d.difference < 0).length,
            zero: data.filter(d => d.difference === 0).length
        };
    };

    const totals = getTotalDifferences();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Opname - ${department.name}`} />
            
            <div className="p-4 space-y-6">
                {/* Header Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Stock Opname - {department.name}
                        </CardTitle>
                        <CardDescription>
                            Lakukan penghitungan fisik stok barang dan bandingkan dengan sistem
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{departmentStocks.length}</div>
                                <div className="text-sm text-blue-600">Total Item</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{totals.positive}</div>
                                <div className="text-sm text-green-600">Lebih (+)</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{totals.negative}</div>
                                <div className="text-sm text-red-600">Kurang (-)</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">{totals.zero}</div>
                                <div className="text-sm text-gray-600">Sesuai (=)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Stock Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Stock Opname</CardTitle>
                            <CardDescription>
                                Masukkan hasil penghitungan fisik untuk setiap item
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {departmentStocks.map((stock) => {
                                    const opname = opnameData[stock.id];
                                    const difference = opname?.difference || 0;
                                    
                                    return (
                                        <div key={stock.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium">{stock.inventory_item.name}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {stock.inventory_item.code} - {stock.inventory_item.category.name}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="ml-2">
                                                    {stock.inventory_item.unit_of_measure}
                                                </Badge>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <Label className="text-sm">Stok Sistem</Label>
                                                    <div className="font-medium text-lg">{stock.current_stock}</div>
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor={`physical_${stock.id}`} className="text-sm">
                                                        Stok Fisik
                                                    </Label>
                                                    <Input
                                                        id={`physical_${stock.id}`}
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={opname?.physical_count || ''}
                                                        onChange={(e) => handlePhysicalCountChange(
                                                            stock.id, 
                                                            parseInt(e.target.value) || 0
                                                        )}
                                                    />
                                                </div>
                                                
                                                <div>
                                                    <Label className="text-sm">Selisih</Label>
                                                    {opname ? (
                                                        <Badge 
                                                            variant={getVariantColor(difference)}
                                                            className={`w-full justify-center font-medium ${getDifferenceColor(difference)}`}
                                                        >
                                                            {getDifferenceIcon(difference)}{difference}
                                                        </Badge>
                                                    ) : (
                                                        <div className="h-6 bg-gray-100 rounded text-center text-sm text-gray-500 leading-6">
                                                            -
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <Label htmlFor={`notes_${stock.id}`} className="text-sm">
                                                        Catatan
                                                    </Label>
                                                    <Input
                                                        id={`notes_${stock.id}`}
                                                        placeholder="Catatan..."
                                                        value={opname?.notes || ''}
                                                        onChange={(e) => handleNotesChange(stock.id, e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {difference !== 0 && opname && (
                                                <div className={`p-3 rounded-md ${getDifferenceColor(difference)}`}>
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {difference > 0 
                                                                ? `Kelebihan stok sebanyak ${difference} ${stock.inventory_item.unit_of_measure}`
                                                                : `Kekurangan stok sebanyak ${Math.abs(difference)} ${stock.inventory_item.unit_of_measure}`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* General Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan Umum</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Catatan umum tentang stock opname ini..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpnameData({});
                                setNotes('');
                            }}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Stock Opname'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

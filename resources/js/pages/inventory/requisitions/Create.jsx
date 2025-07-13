import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Plus, Trash, ArrowLeft, Save, Send } from 'lucide-react';
import DepartmentSearchableDropdown from '@/Components/SearchableDropdowns/DepartmentSearchableDropdown';
import ItemSearchableDropdown from '@/Components/SearchableDropdowns/ItemSearchableDropdown';

export default function Create({ auth, departments }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        department_id: '',
        requisition_date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        items: [{ item_id: '', quantity: 1, estimated_price: 0, notes: '' }]
    });

    const [totalEstimatedCost, setTotalEstimatedCost] = useState(0);

    // Calculate total estimated cost when items change
    useEffect(() => {
        const total = data.items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity || 0) * parseFloat(item.estimated_price || 0));
        }, 0);
        setTotalEstimatedCost(total);
    }, [data.items]);

    const addItem = () => {
        setData('items', [...data.items, { item_id: '', quantity: 1, estimated_price: 0, notes: '' }]);
    };

    const removeItem = (index) => {
        if (data.items.length > 1) {
            const newItems = data.items.filter((_, i) => i !== index);
            setData('items', newItems);
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    const handleSubmit = (e, action = 'save') => {
        e.preventDefault();
        
        const submitData = {
            ...data,
            action: action // 'save' for draft, 'submit' for submission
        };

        post(route('requisitions.store'), {
            data: submitData,
            onSuccess: () => {
                if (action === 'submit') {
                    alert('Permintaan berhasil disubmit untuk approval!');
                } else {
                    alert('Permintaan berhasil disimpan sebagai draft!');
                }
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
            }
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Buat Permintaan Barang Baru
                    </h2>
                    <Button 
                        variant="outline" 
                        onClick={() => router.visit(route('requisitions.index'))}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>
                </div>
            }
        >
            <Head title="Buat Permintaan Barang" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={(e) => handleSubmit(e, 'save')}>
                        {/* Basic Information */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Informasi Umum</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="department_id">Departemen <span className="text-red-500">*</span></Label>
                                        <DepartmentSearchableDropdown
                                            value={data.department_id}
                                            onValueChange={(value) => setData('department_id', value)}
                                            placeholder="Pilih departemen..."
                                        />
                                        {errors.department_id && (
                                            <p className="text-sm text-red-500 mt-1">{errors.department_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="requisition_date">Tanggal Permintaan <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="requisition_date"
                                            type="date"
                                            value={data.requisition_date}
                                            onChange={(e) => setData('requisition_date', e.target.value)}
                                            className={errors.requisition_date ? 'border-red-500' : ''}
                                        />
                                        {errors.requisition_date && (
                                            <p className="text-sm text-red-500 mt-1">{errors.requisition_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description">Deskripsi Permintaan</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Jelaskan tujuan permintaan barang ini..."
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="notes">Catatan Tambahan</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Catatan tambahan jika diperlukan..."
                                        className={errors.notes ? 'border-red-500' : ''}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-500 mt-1">{errors.notes}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card className="mb-6">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Daftar Barang</CardTitle>
                                <Button type="button" onClick={addItem} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Tambah Barang
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-medium">Barang #{index + 1}</h4>
                                                {data.items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="md:col-span-2">
                                                    <Label>Nama Barang <span className="text-red-500">*</span></Label>
                                                    <ItemSearchableDropdown
                                                        value={item.item_id}
                                                        onValueChange={(value) => updateItem(index, 'item_id', value)}
                                                        placeholder="Pilih barang..."
                                                    />
                                                    {errors[`items.${index}.item_id`] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors[`items.${index}.item_id`]}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label>Jumlah <span className="text-red-500">*</span></Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        className={errors[`items.${index}.quantity`] ? 'border-red-500' : ''}
                                                    />
                                                    {errors[`items.${index}.quantity`] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors[`items.${index}.quantity`]}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label>Estimasi Harga</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.estimated_price}
                                                        onChange={(e) => updateItem(index, 'estimated_price', e.target.value)}
                                                        className={errors[`items.${index}.estimated_price`] ? 'border-red-500' : ''}
                                                    />
                                                    {errors[`items.${index}.estimated_price`] && (
                                                        <p className="text-sm text-red-500 mt-1">{errors[`items.${index}.estimated_price`]}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <Label>Catatan Barang</Label>
                                                <Textarea
                                                    value={item.notes}
                                                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                    placeholder="Catatan khusus untuk barang ini..."
                                                    className={errors[`items.${index}.notes`] ? 'border-red-500' : ''}
                                                />
                                                {errors[`items.${index}.notes`] && (
                                                    <p className="text-sm text-red-500 mt-1">{errors[`items.${index}.notes`]}</p>
                                                )}
                                            </div>

                                            <div className="mt-2 text-right">
                                                <span className="text-sm font-medium">
                                                    Subtotal: {formatCurrency(item.quantity * item.estimated_price)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Summary */}
                                <div className="mt-6 pt-4 border-t">
                                    <div className="text-right">
                                        <div className="text-lg font-semibold">
                                            Total Estimasi Biaya: {formatCurrency(totalEstimatedCost)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <Card>
                            <CardContent className="flex justify-end gap-4 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('requisitions.index'))}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={processing}
                                    className="flex items-center gap-2"
                                    onClick={(e) => handleSubmit(e, 'save')}
                                >
                                    <Save className="h-4 w-4" />
                                    Simpan Draft
                                </Button>
                                <Button
                                    type="button"
                                    disabled={processing}
                                    className="flex items-center gap-2"
                                    onClick={(e) => handleSubmit(e, 'submit')}
                                >
                                    <Send className="h-4 w-4" />
                                    Submit untuk Approval
                                </Button>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

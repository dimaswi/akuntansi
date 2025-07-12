import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventory',
        href: '/inventory',
    },
    {
        title: 'Stock Count',
        href: '/inventory/stock-count',
    },
    {
        title: 'New Stock Count',
        href: '/inventory/stock-count/create',
    },
];

interface Location {
    id: number;
    name: string;
    description?: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    current_stock: number;
    unit: string;
}

interface StockCountItem {
    item_id: number;
    system_quantity: number;
    counted_quantity: number;
    variance: number;
    notes?: string;
}

interface FormData {
    location_id: string;
    count_date: string;
    notes: string;
    items: Record<string, StockCountItem>;
    [key: string]: any;
}

interface Props extends PageProps {
    locations: Location[];
}

export default function StockCountCreate({ auth, locations }: Props) {
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [items, setItems] = useState<Item[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [countedItems, setCountedItems] = useState<Record<string, StockCountItem>>({});

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        location_id: '',
        count_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: {},
    });

    const handleLocationChange = async (locationId: string) => {
        setSelectedLocation(locationId);
        setData('location_id', locationId);
        setCountedItems({});
        
        if (locationId) {
            setLoadingItems(true);
            try {
                const response = await fetch(`/inventory/stock-count/items/${locationId}`);
                const itemsData = await response.json();
                setItems(itemsData);
                
                // Initialize counted items with system quantities
                const initialCountedItems: Record<string, StockCountItem> = {};
                itemsData.forEach((item: Item) => {
                    initialCountedItems[item.id.toString()] = {
                        item_id: item.id,
                        system_quantity: item.current_stock,
                        counted_quantity: item.current_stock,
                        variance: 0,
                        notes: '',
                    };
                });
                setCountedItems(initialCountedItems);
            } catch (error) {
                console.error('Error loading items:', error);
            }
            setLoadingItems(false);
        } else {
            setItems([]);
        }
    };

    const handleCountChange = (itemId: string, countedQuantity: number) => {
        const item = items.find(i => i.id.toString() === itemId);
        if (!item) return;

        const systemQuantity = item.current_stock;
        const variance = countedQuantity - systemQuantity;

        setCountedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                counted_quantity: countedQuantity,
                variance,
            }
        }));
    };

    const handleNotesChange = (itemId: string, notes: string) => {
        setCountedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                notes,
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = {
            ...data,
            items: countedItems,
        };

        post('/inventory/stock-count', {
            onSuccess: () => {
                router.visit('/inventory/stock-count');
            },
        });
    };

    const getTotalVariance = () => {
        return Object.values(countedItems).reduce((total, item) => total + item.variance, 0);
    };

    const getVarianceColor = (variance: number) => {
        if (variance > 0) return 'text-green-600';
        if (variance < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    useEffect(() => {
        setData('items', countedItems);
    }, [countedItems]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Stock Count" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        New Stock Count
                    </h2>
                    <Button 
                        variant="outline" 
                        onClick={() => router.visit('/inventory/stock-count')}
                    >
                        ← Back to Stock Count
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>📋 Stock Count Information</CardTitle>
                            <CardDescription>Enter the basic details for this stock count</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location_id">Location *</Label>
                                    <Select value={selectedLocation} onValueChange={handleLocationChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select location for stock count" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((location) => (
                                                <SelectItem key={location.id} value={location.id.toString()}>
                                                    {location.name}
                                                    {location.description && (
                                                        <span className="text-muted-foreground"> - {location.description}</span>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.location_id && (
                                        <p className="text-sm text-red-600">{errors.location_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="count_date">Count Date *</Label>
                                    <Input
                                        id="count_date"
                                        type="date"
                                        value={data.count_date}
                                        onChange={(e) => setData('count_date', e.target.value)}
                                        required
                                    />
                                    {errors.count_date && (
                                        <p className="text-sm text-red-600">{errors.count_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Enter any notes about this stock count..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                                {errors.notes && (
                                    <p className="text-sm text-red-600">{errors.notes}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items to Count */}
                    {selectedLocation && (
                        <Card>
                            <CardHeader>
                                <CardTitle>📦 Items to Count</CardTitle>
                                <CardDescription>
                                    Enter the counted quantities for each item in the selected location
                                    {countedItems && Object.keys(countedItems).length > 0 && (
                                        <span className="block mt-2">
                                            Total Variance: 
                                            <span className={`ml-1 font-medium ${getVarianceColor(getTotalVariance())}`}>
                                                {getTotalVariance() > 0 ? '+' : ''}{getTotalVariance()}
                                            </span>
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingItems ? (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">Loading items...</p>
                                    </div>
                                ) : items.length > 0 ? (
                                    <div className="space-y-4">
                                        {items.map((item) => {
                                            const countedItem = countedItems[item.id.toString()];
                                            const variance = countedItem?.variance || 0;
                                            
                                            return (
                                                <div key={item.id} className="p-4 border rounded-lg">
                                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="font-medium">{item.name}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                Code: {item.code} • Unit: {item.unit}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                System Quantity: {item.current_stock}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`counted_${item.id}`}>Counted Quantity</Label>
                                                                <Input
                                                                    id={`counted_${item.id}`}
                                                                    type="number"
                                                                    min="0"
                                                                    
                                                                    value={countedItem?.counted_quantity || 0}
                                                                    onChange={(e) => handleCountChange(
                                                                        item.id.toString(), 
                                                                        parseFloat(e.target.value) || 0
                                                                    )}
                                                                    className="w-32"
                                                                />
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <Label>Variance</Label>
                                                                <div className={`flex items-center h-10 px-3 border rounded-md bg-muted ${getVarianceColor(variance)}`}>
                                                                    {variance > 0 ? '+' : ''}{variance}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`notes_${item.id}`}>Notes</Label>
                                                                <Input
                                                                    id={`notes_${item.id}`}
                                                                    placeholder="Notes for this item..."
                                                                    value={countedItem?.notes || ''}
                                                                    onChange={(e) => handleNotesChange(
                                                                        item.id.toString(), 
                                                                        e.target.value
                                                                    )}
                                                                    className="w-48"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {variance !== 0 && (
                                                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                                                            <p className="text-sm text-amber-800">
                                                                {variance > 0 
                                                                    ? `📈 Surplus of ${variance} ${item.unit}` 
                                                                    : `📉 Shortage of ${Math.abs(variance)} ${item.unit}`
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No items found in this location.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    {selectedLocation && items.length > 0 && (
                        <div className="flex justify-end gap-4">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => router.visit('/inventory/stock-count')}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={processing}
                            >
                                {processing ? 'Creating...' : '💾 Create Stock Count'}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}

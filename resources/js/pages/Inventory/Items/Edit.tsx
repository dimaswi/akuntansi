import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventori',
        href: '/inventory',
    },
    {
        title: 'Barang',
        href: '/inventory/items',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface Category {
    id: number;
    name: string;
    code: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    description?: string;
    category_id: number;
    inventory_type: 'pharmacy' | 'general';
    unit_of_measure: string;
    pack_size?: number;
    standard_cost?: number;
    is_active: boolean;
    requires_approval: boolean;
    is_controlled_substance: boolean;
    requires_prescription: boolean;
    reorder_level: number;
    max_level?: number;
    safety_stock?: number;
    pharmacy_details?: {
        generic_name?: string;
        brand_name?: string;
        strength?: string;
        dosage_form?: string;
        route_of_administration?: string;
        manufacturer?: string;
        registration_number?: string;
        therapeutic_class?: string;
        indication?: string;
        contraindication?: string;
        side_effects?: string;
        dosage_instructions?: string;
        storage_conditions?: string;
        pregnancy_category?: string;
        is_narcotic?: boolean;
        is_psychotropic?: boolean;
        max_dispensing_quantity?: number;
    };
    general_details?: {
        brand?: string;
        model?: string;
        serial_number?: string;
        warranty_period?: number;
        warranty_start_date?: string;
        supplier_part_number?: string;
        manufacturer_part_number?: string;
        color?: string;
        size?: string;
        weight?: number;
        material?: string;
        country_of_origin?: string;
    };
}

interface Props extends PageProps {
    item: Item;
    categories: Category[];
}

export default function EditItem({ item, categories }: Props) {
    const [formData, setFormData] = useState({
        // Basic Info
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        category_id: item.category_id?.toString() || '',
        inventory_type: item.inventory_type || 'general',
        unit_of_measure: item.unit_of_measure || '',
        pack_size: item.pack_size?.toString() || '',
        standard_cost: item.standard_cost?.toString() || '',
        is_active: item.is_active ?? true,
        requires_approval: item.requires_approval ?? false,
        is_controlled_substance: item.is_controlled_substance ?? false,
        requires_prescription: item.requires_prescription ?? false,
        
        // Stock Info
        reorder_level: item.reorder_level?.toString() || '',
        max_level: item.max_level?.toString() || '',
        safety_stock: item.safety_stock?.toString() || '',
        
        // Pharmacy Details
        generic_name: item.pharmacy_details?.generic_name || '',
        brand_name: item.pharmacy_details?.brand_name || '',
        strength: item.pharmacy_details?.strength || '',
        dosage_form: item.pharmacy_details?.dosage_form || '',
        route_of_administration: item.pharmacy_details?.route_of_administration || '',
        manufacturer: item.pharmacy_details?.manufacturer || '',
        registration_number: item.pharmacy_details?.registration_number || '',
        therapeutic_class: item.pharmacy_details?.therapeutic_class || '',
        indication: item.pharmacy_details?.indication || '',
        contraindication: item.pharmacy_details?.contraindication || '',
        side_effects: item.pharmacy_details?.side_effects || '',
        dosage_instructions: item.pharmacy_details?.dosage_instructions || '',
        storage_conditions: item.pharmacy_details?.storage_conditions || '',
        pregnancy_category: item.pharmacy_details?.pregnancy_category || '',
        is_narcotic: item.pharmacy_details?.is_narcotic ?? false,
        is_psychotropic: item.pharmacy_details?.is_psychotropic ?? false,
        max_dispensing_quantity: item.pharmacy_details?.max_dispensing_quantity?.toString() || '',
        
        // General Details
        brand: item.general_details?.brand || '',
        model: item.general_details?.model || '',
        serial_number: item.general_details?.serial_number || '',
        warranty_period: item.general_details?.warranty_period?.toString() || '',
        warranty_start_date: item.general_details?.warranty_start_date || '',
        supplier_part_number: item.general_details?.supplier_part_number || '',
        manufacturer_part_number: item.general_details?.manufacturer_part_number || '',
        color: item.general_details?.color || '',
        size: item.general_details?.size || '',
        weight: item.general_details?.weight?.toString() || '',
        material: item.general_details?.material || '',
        country_of_origin: item.general_details?.country_of_origin || '',
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const submitData = {
            ...formData,
            standard_cost: parseFloat(formData.standard_cost) || 0,
            pack_size: parseInt(formData.pack_size) || null,
            reorder_level: parseFloat(formData.reorder_level) || 0,
            max_level: formData.max_level ? parseFloat(formData.max_level) : null,
            safety_stock: formData.safety_stock ? parseFloat(formData.safety_stock) : null,
            warranty_period: formData.warranty_period ? parseInt(formData.warranty_period) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            max_dispensing_quantity: formData.max_dispensing_quantity ? parseFloat(formData.max_dispensing_quantity) : null,
        };

        router.put(`/inventory/items/${item.id}`, submitData, {
            onSuccess: () => {
                router.visit('/inventory/items');
            },
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            }
        });
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Item - ${item.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Edit Item: {item.name}
                    </h2>
                    <Button variant="outline" onClick={() => router.visit('/inventory/items')}>
                        ← Back to Items
                    </Button>
                </div>

                <div>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="stock">Stock Management</TabsTrigger>
                            <TabsTrigger value="pharmacy">Pharmacy Details</TabsTrigger>
                            <TabsTrigger value="general">General Details</TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>
                                        Edit the basic information for the inventory item
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Item Name *</label>
                                            <Input
                                                placeholder="Enter item name"
                                                value={formData.name}
                                                onChange={(e) => updateFormData('name', e.target.value)}
                                            />
                                            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Item Code *</label>
                                            <Input
                                                placeholder="Enter unique item code"
                                                value={formData.code}
                                                onChange={(e) => updateFormData('code', e.target.value)}
                                            />
                                            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Category *</label>
                                            <Select value={formData.category_id} onValueChange={(value) => updateFormData('category_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            {category.name} ({category.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Item Type *</label>
                                            <Select value={formData.inventory_type} onValueChange={(value) => updateFormData('inventory_type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select item type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">General Item</SelectItem>
                                                    <SelectItem value="pharmacy">Pharmacy Item</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.inventory_type && <p className="text-red-500 text-sm">{errors.inventory_type}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Unit of Measure *</label>
                                            <Input
                                                placeholder="e.g., pieces, kg, liter"
                                                value={formData.unit_of_measure}
                                                onChange={(e) => updateFormData('unit_of_measure', e.target.value)}
                                            />
                                            {errors.unit_of_measure && <p className="text-red-500 text-sm">{errors.unit_of_measure}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Pack Size</label>
                                            <Input
                                                placeholder="Enter pack size"
                                                type="number"
                                                value={formData.pack_size}
                                                onChange={(e) => updateFormData('pack_size', e.target.value)}
                                            />
                                            {errors.pack_size && <p className="text-red-500 text-sm">{errors.pack_size}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Standard Cost</label>
                                            <Input
                                                placeholder="Enter standard cost"
                                                type="number"
                                                step="0.01"
                                                value={formData.standard_cost}
                                                onChange={(e) => updateFormData('standard_cost', e.target.value)}
                                            />
                                            {errors.standard_cost && <p className="text-red-500 text-sm">{errors.standard_cost}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <Textarea
                                            placeholder="Enter item description"
                                            value={formData.description}
                                            onChange={(e) => updateFormData('description', e.target.value)}
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_active"
                                                checked={formData.is_active}
                                                onCheckedChange={(checked) => updateFormData('is_active', checked)}
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium">
                                                Active
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_approval"
                                                checked={formData.requires_approval}
                                                onCheckedChange={(checked) => updateFormData('requires_approval', checked)}
                                            />
                                            <label htmlFor="requires_approval" className="text-sm font-medium">
                                                Requires Approval
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_controlled_substance"
                                                checked={formData.is_controlled_substance}
                                                onCheckedChange={(checked) => updateFormData('is_controlled_substance', checked)}
                                            />
                                            <label htmlFor="is_controlled_substance" className="text-sm font-medium">
                                                Controlled Substance
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_prescription"
                                                checked={formData.requires_prescription}
                                                onCheckedChange={(checked) => updateFormData('requires_prescription', checked)}
                                            />
                                            <label htmlFor="requires_prescription" className="text-sm font-medium">
                                                Requires Prescription
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Stock Management Tab */}
                        <TabsContent value="stock">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Stock Management</CardTitle>
                                    <CardDescription>
                                        Configure stock levels and reorder settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Reorder Level *</label>
                                            <Input
                                                placeholder="Enter reorder level"
                                                type="number"
                                                step="0.01"
                                                value={formData.reorder_level}
                                                onChange={(e) => updateFormData('reorder_level', e.target.value)}
                                            />
                                            {errors.reorder_level && <p className="text-red-500 text-sm">{errors.reorder_level}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Maximum Level</label>
                                            <Input
                                                placeholder="Enter maximum level"
                                                type="number"
                                                step="0.01"
                                                value={formData.max_level}
                                                onChange={(e) => updateFormData('max_level', e.target.value)}
                                            />
                                            {errors.max_level && <p className="text-red-500 text-sm">{errors.max_level}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Safety Stock</label>
                                            <Input
                                                placeholder="Enter safety stock"
                                                type="number"
                                                step="0.01"
                                                value={formData.safety_stock}
                                                onChange={(e) => updateFormData('safety_stock', e.target.value)}
                                            />
                                            {errors.safety_stock && <p className="text-red-500 text-sm">{errors.safety_stock}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Pharmacy Details Tab */}
                        <TabsContent value="pharmacy">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pharmacy Details</CardTitle>
                                    <CardDescription>
                                        Additional information for pharmacy items
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {formData.inventory_type === 'pharmacy' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Generic Name</label>
                                                <Input
                                                    placeholder="Enter generic name"
                                                    value={formData.generic_name}
                                                    onChange={(e) => updateFormData('generic_name', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Brand Name</label>
                                                <Input
                                                    placeholder="Enter brand name"
                                                    value={formData.brand_name}
                                                    onChange={(e) => updateFormData('brand_name', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Strength</label>
                                                <Input
                                                    placeholder="e.g., 500mg"
                                                    value={formData.strength}
                                                    onChange={(e) => updateFormData('strength', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Dosage Form</label>
                                                <Select value={formData.dosage_form} onValueChange={(value) => updateFormData('dosage_form', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select dosage form" />
                                                    </SelectTrigger>                                                <SelectContent>
                                                    <SelectItem value="placeholder" disabled>Select dosage form</SelectItem>
                                                    <SelectItem value="tablet">Tablet</SelectItem>
                                                        <SelectItem value="capsule">Capsule</SelectItem>
                                                        <SelectItem value="syrup">Syrup</SelectItem>
                                                        <SelectItem value="injection">Injection</SelectItem>
                                                        <SelectItem value="cream">Cream</SelectItem>
                                                        <SelectItem value="ointment">Ointment</SelectItem>
                                                        <SelectItem value="drops">Drops</SelectItem>
                                                        <SelectItem value="inhaler">Inhaler</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Route of Administration</label>
                                                <Input
                                                    placeholder="e.g., Oral, Topical"
                                                    value={formData.route_of_administration}
                                                    onChange={(e) => updateFormData('route_of_administration', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Manufacturer</label>
                                                <Input
                                                    placeholder="Enter manufacturer"
                                                    value={formData.manufacturer}
                                                    onChange={(e) => updateFormData('manufacturer', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Registration Number</label>
                                                <Input
                                                    placeholder="Enter registration number"
                                                    value={formData.registration_number}
                                                    onChange={(e) => updateFormData('registration_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Therapeutic Class</label>
                                                <Input
                                                    placeholder="Enter therapeutic class"
                                                    value={formData.therapeutic_class}
                                                    onChange={(e) => updateFormData('therapeutic_class', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Max Dispensing Quantity</label>
                                                <Input
                                                    placeholder="Enter max dispensing quantity"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.max_dispensing_quantity}
                                                    onChange={(e) => updateFormData('max_dispensing_quantity', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Pharmacy details are only available for pharmacy items.</p>
                                            <p>Please change the item type to "Pharmacy Item" to access these fields.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* General Details Tab */}
                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Details</CardTitle>
                                    <CardDescription>
                                        Additional information for general items
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {formData.inventory_type === 'general' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Brand</label>
                                                <Input
                                                    placeholder="Enter brand"
                                                    value={formData.brand}
                                                    onChange={(e) => updateFormData('brand', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Model</label>
                                                <Input
                                                    placeholder="Enter model"
                                                    value={formData.model}
                                                    onChange={(e) => updateFormData('model', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Serial Number</label>
                                                <Input
                                                    placeholder="Enter serial number"
                                                    value={formData.serial_number}
                                                    onChange={(e) => updateFormData('serial_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Warranty Period (months)</label>
                                                <Input
                                                    placeholder="Enter warranty period"
                                                    type="number"
                                                    value={formData.warranty_period}
                                                    onChange={(e) => updateFormData('warranty_period', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Warranty Start Date</label>
                                                <Input
                                                    type="date"
                                                    value={formData.warranty_start_date}
                                                    onChange={(e) => updateFormData('warranty_start_date', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Supplier Part Number</label>
                                                <Input
                                                    placeholder="Enter supplier part number"
                                                    value={formData.supplier_part_number}
                                                    onChange={(e) => updateFormData('supplier_part_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Manufacturer Part Number</label>
                                                <Input
                                                    placeholder="Enter manufacturer part number"
                                                    value={formData.manufacturer_part_number}
                                                    onChange={(e) => updateFormData('manufacturer_part_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Color</label>
                                                <Input
                                                    placeholder="Enter color"
                                                    value={formData.color}
                                                    onChange={(e) => updateFormData('color', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Size</label>
                                                <Input
                                                    placeholder="Enter size"
                                                    value={formData.size}
                                                    onChange={(e) => updateFormData('size', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Weight (kg)</label>
                                                <Input
                                                    placeholder="Enter weight"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.weight}
                                                    onChange={(e) => updateFormData('weight', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Material</label>
                                                <Input
                                                    placeholder="Enter material"
                                                    value={formData.material}
                                                    onChange={(e) => updateFormData('material', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Country of Origin</label>
                                                <Input
                                                    placeholder="Enter country of origin"
                                                    value={formData.country_of_origin}
                                                    onChange={(e) => updateFormData('country_of_origin', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>General details are only available for general items.</p>
                                            <p>Please change the item type to "General Item" to access these fields.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Submit Button */}
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-end gap-4 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit('/inventory/items')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Item'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

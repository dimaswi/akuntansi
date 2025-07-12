import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/inventory' },
    { title: 'Categories', href: '/inventory/categories' },
    { title: 'Create Category', href: '' },
];

interface ParentCategory {
    id: number;
    name: string;
    code: string;
}

interface Props extends PageProps {
    parentCategories: ParentCategory[];
}

export default function CategoryCreate({ parentCategories }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        name: string;
        description: string;
        category_type: string;
        parent_id: string;
        is_active: boolean;
    }>({
        code: '',
        name: '',
        description: '',
        category_type: 'general',
        parent_id: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('inventory.categories.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Category" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Header */}
                    <div className="flex items-center mb-6">
                        <Link href={route('inventory.categories.index')}>
                            <Button variant="ghost" size="sm" className="mr-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Categories
                            </Button>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Category</h1>
                    </div>

                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Category Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Category Code */}
                                    <div>
                                        <Label htmlFor="code">Category Code</Label>
                                        <Input
                                            id="code"
                                            type="text"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            placeholder="e.g., MED001"
                                            className="mt-1"
                                        />
                                        {errors.code && (
                                            <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                                        )}
                                    </div>

                                    {/* Category Name */}
                                    <div>
                                        <Label htmlFor="name">Category Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="e.g., Medicines"
                                            className="mt-1"
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Category Type */}
                                    <div>
                                        <Label htmlFor="category_type">Category Type</Label>
                                        <Select
                                            value={data.category_type}
                                            onValueChange={(value) => setData('category_type', value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select category type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General Inventory</SelectItem>
                                                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                                <SelectItem value="medical_equipment">Medical Equipment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.category_type && (
                                            <p className="text-red-500 text-sm mt-1">{errors.category_type}</p>
                                        )}
                                    </div>

                                    {/* Parent Category */}
                                    <div>
                                        <Label htmlFor="parent_id">Parent Category (Optional)</Label>
                                        <Select
                                            value={data.parent_id || undefined}
                                            onValueChange={(value) => setData('parent_id', value || '')}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="No Parent (Root Category)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parentCategories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.code} - {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.parent_id && (
                                            <p className="text-red-500 text-sm mt-1">{errors.parent_id}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Enter category description..."
                                        className="mt-1"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                    )}
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked === true)}
                                    />
                                    <Label htmlFor="is_active">Active Category</Label>
                                </div>
                                {errors.is_active && (
                                    <p className="text-red-500 text-sm mt-1">{errors.is_active}</p>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-4 pt-6">
                                    <Link href={route('inventory.categories.index')}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Category'}
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

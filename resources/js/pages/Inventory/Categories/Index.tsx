import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        title: 'Categories',
        href: '/inventory/categories',
    },
];

interface Category {
    id: number;
    name: string;
    code: string;
    description: string;
    parent_id: number | null;
    category_type: string;
    is_active: boolean;
    items_count: number;
    children?: Category[];
    parent?: Category;
}

interface Props extends PageProps {
    categories: Category[];
    parentCategories: Category[];
}

export default function CategoryIndex({ auth, categories, parentCategories }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        parent_id: '',
        is_active: true
    });

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const data = {
            ...formData,
            parent_id: formData.parent_id || null
        };

        if (editingCategory) {
            router.put(`/inventory/categories/${editingCategory.id}`, data, {
                onSuccess: () => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setFormData({ name: '', code: '', description: '', parent_id: '', is_active: true });
                }
            });
        } else {
            router.post('/inventory/categories', data, {
                onSuccess: () => {
                    setShowForm(false);
                    setFormData({ name: '', code: '', description: '', parent_id: '', is_active: true });
                }
            });
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            code: category.code,
            description: category.description || '',
            parent_id: category.parent_id?.toString() || '',
            is_active: category.is_active
        });
        setShowForm(true);
    };

    const handleDelete = (categoryId: number) => {
        if (confirm('Are you sure you want to delete this category?')) {
            router.delete(`/inventory/categories/${categoryId}`);
        }
    };

    const getCategoryLevel = (category: Category) => {
        return category.parent_id ? '—— ' : '';
    };

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Inventory Categories" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Inventory Categories
                    </h2>
                    <Link href={route('inventory.categories.create')}>
                        <Button>
                            ➕ Add Category
                        </Button>
                    </Link>
                </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Input
                            placeholder="🔍 Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Category Form */}
            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </CardTitle>
                        <CardDescription>
                            {editingCategory ? 'Update category information' : 'Create a new inventory category'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Name</label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Category name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Code</label>
                                    <Input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="Category code"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Parent Category</label>
                                <Select value={formData.parent_id} onValueChange={(value) => setFormData({ ...formData, parent_id: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent category (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">No Parent (Root Category)</SelectItem>
                                        {parentCategories.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {getCategoryLevel(category)} {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Category description"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium">Active</label>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit">
                                    {editingCategory ? 'Update' : 'Create'} Category
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingCategory(null);
                                        setFormData({ name: '', code: '', description: '', parent_id: '', is_active: true });
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Categories List */}
            <Card>
                <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage your inventory categories</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h3 className="font-medium">
                                                {getCategoryLevel(category)} {category.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Code: {category.code}
                                                {category.parent && ` • Parent: ${category.parent.name}`}
                                                {category.description && ` • ${category.description}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {category.items_count} items
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {category.parent_id ? 'Subcategory' : 'Root Category'}
                                        </p>
                                    </div>
                                    <Badge variant={category.is_active ? "default" : "secondary"}>
                                        {category.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Link href={route('inventory.categories.edit', category.id)}>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                            >
                                                ✏️ Edit
                                            </Button>
                                        </Link>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            🗑️ Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {filteredCategories.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                {searchTerm ? 'No categories found matching your search.' : 'No categories created yet.'}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            </div>
        </Layout>
    );
}

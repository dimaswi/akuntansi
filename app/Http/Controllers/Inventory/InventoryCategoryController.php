<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryCategoryController extends Controller
{
    public function index()
    {
        $categories = InventoryCategory::with(['parent', 'children'])
            ->withCount('items')
            ->orderBy('code')
            ->get();

        $parentCategories = InventoryCategory::whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Categories/Index', [
            'categories' => $categories,
            'parentCategories' => $parentCategories
        ]);
    }

    public function create()
    {
        $parentCategories = InventoryCategory::whereNull('parent_id')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Categories/Create', [
            'parentCategories' => $parentCategories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:inventory_categories',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_type' => 'required|in:pharmacy,general,medical_equipment',
            'parent_id' => 'nullable|exists:inventory_categories,id',
            'is_active' => 'boolean',
        ]);

        $category = InventoryCategory::create($validated);

        return redirect()->route('inventory.categories.index')
            ->with('success', 'Category created successfully.');
    }

    public function show(InventoryCategory $category)
    {
        $category->load(['parent', 'children', 'items.stocks']);

        return Inertia::render('Inventory/Categories/Show', [
            'category' => $category
        ]);
    }

    public function edit(InventoryCategory $category)
    {
        $parentCategories = InventoryCategory::whereNull('parent_id')
            ->where('id', '!=', $category->id)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Categories/Edit', [
            'category' => $category,
            'parentCategories' => $parentCategories
        ]);
    }

    public function update(Request $request, InventoryCategory $category)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:inventory_categories,code,' . $category->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_type' => 'required|in:pharmacy,general,medical_equipment',
            'parent_id' => 'nullable|exists:inventory_categories,id',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->route('inventory.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(InventoryCategory $category)
    {
        if ($category->items()->exists()) {
            return back()->withErrors([
                'delete' => 'Cannot delete category with existing items.'
            ]);
        }

        if ($category->children()->exists()) {
            return back()->withErrors([
                'delete' => 'Cannot delete category with subcategories.'
            ]);
        }

        $category->delete();

        return redirect()->route('inventory.categories.index')
            ->with('success', 'Category deleted successfully.');
    }

    public function getSubcategories(Request $request)
    {
        $parentId = $request->get('parent_id');
        
        $subcategories = InventoryCategory::where('parent_id', $parentId)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return response()->json($subcategories);
    }
}

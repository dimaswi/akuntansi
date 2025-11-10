<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Repositories\Inventory\ItemCategoryRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemCategoryController extends Controller
{

    protected $repo;

    public function __construct(ItemCategoryRepositoryInterface $repo)
    {
        $this->repo = $repo;
    }

    public function index(Request $request)
    {
        $user = $request->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        $filters = [
            'search' => $request->get('search', ''),
            'category_type' => $request->get('category_type', ''),
            'is_active' => $request->get('is_active', ''),
            'perPage' => (int) $request->get('perPage', 15),
        ];

        $categories = $this->repo->paginate($filters);

        return Inertia::render('inventory/item_categories/index', [
            'categories' => $categories,
            'filters' => $filters,
            'isLogistics' => $isLogistics,
        ]);
    }

    public function create()
    {
        $user = request()->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Only logistics can create categories
        if (!$isLogistics) {
            abort(403, 'Unauthorized access. Only logistics role can manage categories.');
        }
        
        $parents = $this->repo->getParents();
        return Inertia::render('inventory/item_categories/create', [
            'parents' => $parents,
            'isLogistics' => $isLogistics,
        ]);
    }

    public function show($id)
    {
        $category = $this->repo->find($id);
        
        return Inertia::render('inventory/item_categories/show', [
            'category' => $category,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:item_categories,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:item_categories,id',
            'category_type' => 'required|in:pharmacy,general,medical',
            'is_active' => 'boolean',
            'requires_batch_tracking' => 'boolean',
            'requires_expiry_tracking' => 'boolean',
            'storage_requirements' => 'nullable|array',
        ]);
        
        // Convert empty parent_id to null
        if (empty($data['parent_id'])) {
            $data['parent_id'] = null;
        }
        
        $this->repo->create($data);
        return redirect()->route('item_categories.index')->with('success', 'Kategori berhasil ditambahkan');
    }

    public function edit($id)
    {
        $item_category = $this->repo->find($id);
        $parents = $this->repo->getParents($id);
        return Inertia::render('inventory/item_categories/edit', [
            'item_category' => $item_category,
            'parents' => $parents,
        ]);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'code' => 'required|string|max:20|unique:item_categories,code,' . $id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:item_categories,id',
            'category_type' => 'required|in:pharmacy,general,medical',
            'is_active' => 'boolean',
            'requires_batch_tracking' => 'boolean',
            'requires_expiry_tracking' => 'boolean',
            'storage_requirements' => 'nullable|array',
        ]);
        
        // Convert empty parent_id to null
        if (empty($data['parent_id'])) {
            $data['parent_id'] = null;
        }
        
        $this->repo->update($id, $data);
        return redirect()->route('item_categories.index')->with('success', 'Kategori berhasil diupdate');
    }

    public function destroy($id)
    {
        try {
            // Check if category has items
            $category = $this->repo->find($id);
            
            if ($category->items()->count() > 0) {
                return back()->withErrors(['error' => 'Kategori tidak dapat dihapus karena masih digunakan oleh ' . $category->items()->count() . ' item(s)']);
            }
            
            // Check if category has child categories
            $childCount = \App\Models\Inventory\ItemCategory::where('parent_id', $id)->count();
            if ($childCount > 0) {
                return back()->withErrors(['error' => 'Kategori tidak dapat dihapus karena masih memiliki ' . $childCount . ' sub-kategori']);
            }
            
            $this->repo->delete($id);
            return redirect()->route('item_categories.index')->with('success', 'Kategori berhasil dihapus');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus kategori: ' . $e->getMessage()]);
        }
    }

    /**
     * API endpoint for searching categories
     */
    public function api(Request $request)
    {
        $search = $request->get('search', '');
        $limit = $request->get('limit', 10);
        
        $categories = $this->repo->search($search, $limit);
        
        return response()->json([
            'data' => $categories->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'description' => $category->description ?? '',
                    'is_active' => $category->is_active,
                    'category_type' => $category->category_type,
                ];
            }),
            'total' => $categories->count(),
        ]);
    }
}

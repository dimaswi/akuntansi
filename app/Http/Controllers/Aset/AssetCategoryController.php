<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\AssetCategory;
use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssetCategoryController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'is_active', 'perPage']);
        $perPage = $filters['perPage'] ?? 10;

        $categories = AssetCategory::query()
            ->with(['accountAsset:id,kode_akun,nama_akun', 'accountDepreciation:id,kode_akun,nama_akun', 'accountExpense:id,kode_akun,nama_akun'])
            ->withCount('assets')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%"))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', $filters['is_active'] === '1'))
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('aset/categories/index', [
            'categories' => $categories,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('aset/categories/create', [
            'accounts' => DaftarAkun::aktif()->orderBy('kode_akun')->get(['id', 'kode_akun', 'nama_akun']),
            'generatedCode' => AssetCategory::generateCode(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:asset_categories,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_useful_life_years' => 'required|integer|min:1|max:100',
            'default_depreciation_method' => 'required|in:straight_line,declining_balance,double_declining,sum_of_years_digits,service_hours,productive_output',
            'default_salvage_percentage' => 'required|numeric|min:0|max:100',
            'account_asset_id' => 'nullable|exists:daftar_akun,id',
            'account_depreciation_id' => 'nullable|exists:daftar_akun,id',
            'account_expense_id' => 'nullable|exists:daftar_akun,id',
            'is_active' => 'required|boolean',
        ]);

        AssetCategory::create($validated);

        return redirect()->route('aset.categories.index')
            ->with('success', 'Kategori aset berhasil ditambahkan.');
    }

    public function edit(AssetCategory $category)
    {
        $category->load(['accountAsset:id,kode_akun,nama_akun', 'accountDepreciation:id,kode_akun,nama_akun', 'accountExpense:id,kode_akun,nama_akun']);

        return Inertia::render('aset/categories/edit', [
            'category' => $category,
            'accounts' => DaftarAkun::aktif()->orderBy('kode_akun')->get(['id', 'kode_akun', 'nama_akun']),
        ]);
    }

    public function update(Request $request, AssetCategory $category)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:asset_categories,code,' . $category->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'default_useful_life_years' => 'required|integer|min:1|max:100',
            'default_depreciation_method' => 'required|in:straight_line,declining_balance,double_declining,sum_of_years_digits,service_hours,productive_output',
            'default_salvage_percentage' => 'required|numeric|min:0|max:100',
            'account_asset_id' => 'nullable|exists:daftar_akun,id',
            'account_depreciation_id' => 'nullable|exists:daftar_akun,id',
            'account_expense_id' => 'nullable|exists:daftar_akun,id',
            'is_active' => 'required|boolean',
        ]);

        $category->update($validated);

        return redirect()->route('aset.categories.index')
            ->with('success', 'Kategori aset berhasil diperbarui.');
    }

    public function destroy(AssetCategory $category)
    {
        if ($category->assets()->exists()) {
            return back()->with('error', 'Kategori tidak bisa dihapus karena masih memiliki aset.');
        }

        $category->delete();

        return redirect()->route('aset.categories.index')
            ->with('success', 'Kategori aset berhasil dihapus.');
    }

    /**
     * API: search categories
     */
    public function api(Request $request)
    {
        $search = $request->get('search', '');

        $categories = AssetCategory::active()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'code', 'name', 'default_useful_life_years', 'default_depreciation_method', 'default_salvage_percentage']);

        return response()->json(['data' => $categories]);
    }
}

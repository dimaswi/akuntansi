# Searchable Dropdown Components

Kumpulan komponen searchable dropdown untuk Department, Category, dan Supplier yang dapat digunakan di seluruh aplikasi.

## Komponen yang Tersedia

### 1. DepartmentSearchableDropdown
Dropdown dengan pencarian untuk memilih department.

### 2. CategorySearchableDropdown
Dropdown dengan pencarian untuk memilih kategori item.

### 3. SupplierSearchableDropdown
Dropdown dengan pencarian untuk memilih supplier.

## Fitur

- ✅ **Searchable**: Pencarian real-time dengan debouncing
- ✅ **API Integration**: Fetch data dari API endpoint
- ✅ **Clear Option**: Opsi untuk menghapus pilihan
- ✅ **Loading State**: Indikator loading saat fetch data
- ✅ **Error State**: Visual state untuk error validation
- ✅ **Disabled State**: State untuk disable komponen
- ✅ **Responsive**: Design responsive untuk berbagai ukuran layar
- ✅ **TypeScript**: Full TypeScript support

## Cara Penggunaan

### Import Komponen

```tsx
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import { CategorySearchableDropdown } from '@/components/ui/category-searchable-dropdown';
import { SupplierSearchableDropdown } from '@/components/ui/supplier-searchable-dropdown';
```

### Basic Usage

```tsx
import React, { useState } from 'react';

function MyForm() {
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <DepartmentSearchableDropdown
        value={departmentId}
        onValueChange={setDepartmentId}
        placeholder="Pilih department..."
      />

      <CategorySearchableDropdown
        value={categoryId}
        onValueChange={setCategoryId}
        placeholder="Pilih kategori..."
      />

      <SupplierSearchableDropdown
        value={supplierId}
        onValueChange={setSupplierId}
        placeholder="Pilih supplier..."
      />
    </div>
  );
}
```

### Props

#### Common Props untuk Semua Komponen

| Prop | Type | Default | Deskripsi |
|------|------|---------|-----------|
| `value` | `number \| null` | `null` | ID item yang terpilih |
| `onValueChange` | `(value: number \| null) => void` | - | Callback saat value berubah |
| `placeholder` | `string` | varies | Placeholder text |
| `disabled` | `boolean` | `false` | Disable komponen |
| `className` | `string` | - | CSS class tambahan |
| `error` | `boolean` | `false` | State error untuk validation |
| `apiEndpoint` | `string` | varies | API endpoint untuk fetch data |

#### Specific Props

**DepartmentSearchableDropdown**
- `departments`: `Department[]` - Data departments initial (opsional)
- Default `apiEndpoint`: `"/departments/api/search"`

**CategorySearchableDropdown**
- `categories`: `Category[]` - Data categories initial (opsional)
- Default `apiEndpoint`: `"/item-categories/api/search"`

**SupplierSearchableDropdown**
- `suppliers`: `Supplier[]` - Data suppliers initial (opsional)
- Default `apiEndpoint`: `"/suppliers/api/search"`

### Advanced Usage

#### Dengan Error State
```tsx
<DepartmentSearchableDropdown
  value={departmentId}
  onValueChange={setDepartmentId}
  error={!!errors.department_id}
  placeholder="Pilih department..."
/>
{errors.department_id && (
  <p className="text-sm text-red-500">{errors.department_id}</p>
)}
```

#### Dengan Data Initial
```tsx
<DepartmentSearchableDropdown
  value={departmentId}
  onValueChange={setDepartmentId}
  departments={initialDepartments}
  placeholder="Pilih department..."
/>
```

#### Custom API Endpoint
```tsx
<SupplierSearchableDropdown
  value={supplierId}
  onValueChange={setSupplierId}
  apiEndpoint="/api/v1/suppliers/search"
  placeholder="Pilih supplier..."
/>
```

## Data Types

### Department
```tsx
interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}
```

### Category
```tsx
interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}
```

### Supplier
```tsx
interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}
```

## API Requirements

API endpoint harus mengembalikan JSON dengan format:

```json
// Array langsung
[
  {
    "id": 1,
    "name": "Department A",
    "description": "Description",
    "is_active": true
  }
]

// Atau object dengan property data
{
  "data": [
    {
      "id": 1,
      "name": "Department A", 
      "description": "Description",
      "is_active": true
    }
  ]
}
```

### Query Parameters
- `search`: String pencarian (opsional)

Contoh: `/departments/api/search?search=finance`

## Dependencies

Komponen ini membutuhkan:
- `@radix-ui/react-popover`
- `cmdk`
- `lucide-react`
- `@/components/ui/button`
- `@/components/ui/command`
- `@/components/ui/popover`

## Notes

- Komponen otomatis filter hanya item yang `is_active: true`
- Pencarian menggunakan debouncing 300ms untuk performance
- Support untuk clear selection dengan opsi "Hapus pilihan"
- Loading state ditampilkan saat fetch data dari API

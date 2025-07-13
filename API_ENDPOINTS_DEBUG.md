# Test API Endpoints untuk Searchable Dropdowns

## Testing Manual

### 1. Test Department API
```bash
curl -X GET "http://localhost/departments/api/search?search=test" -H "Accept: application/json"
```

### 2. Test Category API  
```bash
curl -X GET "http://localhost/item-categories/api/search?search=test" -H "Accept: application/json"
```

### 3. Test Supplier API
```bash
curl -X GET "http://localhost/suppliers/api/search?search=test" -H "Accept: application/json"
```

## Expected Response Format

```json
{
  "data": [
    {
      "id": 1,
      "name": "Sample Name",
      "description": "Description",
      "is_active": true
    }
  ],
  "total": 1
}
```

## Common Issues

1. **404 Error**: Route tidak ditemukan - periksa web.php/routes
2. **403 Error**: Permission denied - periksa middleware permission
3. **500 Error**: Server error - periksa method search di repository
4. **Empty data**: Database kosong atau method search tidak mengembalikan data

## Debug Steps

1. Buka Developer Tools di browser (F12)
2. Buka tab Network
3. Klik pada searchable dropdown
4. Periksa request yang dibuat ke API endpoint
5. Periksa response dan status code

## Browser Console Logs

Searchable dropdown components sekarang memiliki console.log untuk debugging:
- URL yang dipanggil
- Status response
- Data yang diterima

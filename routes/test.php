<?php

use App\Http\Controllers\Akuntansi\BukuBesarController;
use Illuminate\Support\Facades\Route;

Route::get('/test-buku-besar', function() {
    $controller = new BukuBesarController();
    
    try {
        // Test basic query
        $detailJurnal = \App\Models\Akuntansi\DetailJurnal::with(['jurnal', 'daftarAkun'])
            ->limit(5)
            ->get();
            
        return response()->json([
            'success' => true,
            'message' => 'Buku besar controller ready',
            'sample_data' => $detailJurnal,
            'columns' => $detailJurnal->first() ? array_keys($detailJurnal->first()->toArray()) : []
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ]);
    }
});

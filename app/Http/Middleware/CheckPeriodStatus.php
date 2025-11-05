<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Akuntansi\ClosingPeriodSetting;
use App\Models\Akuntansi\ClosingPeriod;
use App\Models\Akuntansi\JournalRevisionLog;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class CheckPeriodStatus
{
    /**
     * Handle an incoming request.
     * Middleware ini akan intercept request edit/delete jurnal pada periode yang sudah closed
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Cek apakah module closing period diaktifkan
        if (!ClosingPeriodSetting::isModuleEnabled()) {
            return $next($request);
        }

        // Hanya check untuk method yang mengubah data (POST, PUT, PATCH, DELETE)
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return $next($request);
        }

        // Cek apakah ini request untuk jurnal
        $isJurnalRequest = $this->isJournalRequest($request);
        
        if (!$isJurnalRequest) {
            return $next($request);
        }

        // Get tanggal transaksi dari request
        $tanggalTransaksi = $this->getTransactionDate($request);
        
        if (!$tanggalTransaksi) {
            return $next($request);
        }

        // Cek apakah tanggal ada di periode yang closed
        $closedPeriod = ClosingPeriod::where('period_start', '<=', $tanggalTransaksi)
            ->where('period_end', '>=', $tanggalTransaksi)
            ->whereIn('status', ['soft_close', 'hard_close'])
            ->first();

        if (!$closedPeriod) {
            // Tidak ada periode closed, lanjutkan normal
            return $next($request);
        }

        // Jika HARD CLOSE, block langsung
        if ($closedPeriod->status === 'hard_close') {
            return back()->withErrors([
                'message' => "Periode {$closedPeriod->period_name} sudah di-hard close. Data tidak bisa diubah."
            ]);
        }

        // Jika SOFT CLOSE, cek apakah butuh approval
        $mode = ClosingPeriodSetting::getClosingMode();
        $requireApproval = ClosingPeriodSetting::get('require_approval_after_soft_close', true);
        
        if ($mode === 'soft_only' || $mode === 'soft_and_hard') {
            // Soft close: butuh alasan revisi
            $alasanRevisi = $request->input('revision_reason') ?? $request->input('alasan_revisi');
            
            if (empty($alasanRevisi) || strlen(trim($alasanRevisi)) < 20) {
                return response()->json([
                    'error' => true,
                    'message' => "Periode {$closedPeriod->period_name} sudah di-soft close. Anda harus memberikan alasan revisi (minimal 20 karakter).",
                    'require_revision_reason' => true,
                    'period_id' => $closedPeriod->id,
                    'period_name' => $closedPeriod->period_name,
                ], 403);
            }

            // Alasan revisi ada, inject data ke request untuk diproses di controller
            $request->merge([
                '_closing_period_id' => $closedPeriod->id,
                '_revision_reason' => $alasanRevisi,
                '_is_revision' => true,
                '_require_approval' => $requireApproval,
            ]);
        }

        return $next($request);
    }

    /**
     * Check if this is a journal-related request
     */
    protected function isJournalRequest(Request $request): bool
    {
        $path = $request->path();
        
        return str_contains($path, 'jurnal') || 
               str_contains($path, 'jurnal-penyesuaian') ||
               str_contains($path, 'journal');
    }

    /**
     * Get transaction date from request
     */
    protected function getTransactionDate(Request $request): ?Carbon
    {
        // Try different field names
        $dateFields = ['tanggal_transaksi', 'tanggal', 'transaction_date', 'date'];
        
        foreach ($dateFields as $field) {
            if ($request->has($field)) {
                try {
                    return Carbon::parse($request->input($field));
                } catch (\Exception $e) {
                    continue;
                }
            }
        }

        // Jika edit/delete, coba ambil dari route parameter
        if ($request->route('jurnal')) {
            $jurnal = $request->route('jurnal');
            if ($jurnal && isset($jurnal->tanggal_transaksi)) {
                return Carbon::parse($jurnal->tanggal_transaksi);
            }
        }

        if ($request->route('jurnalPenyesuaian')) {
            $jurnal = $request->route('jurnalPenyesuaian');
            if ($jurnal && isset($jurnal->tanggal_transaksi)) {
                return Carbon::parse($jurnal->tanggal_transaksi);
            }
        }

        return null;
    }
}

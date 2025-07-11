<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Akuntansi\MonthlyClosing;
use Carbon\Carbon;

class CheckMonthlyCutOff
{
    /**
     * Handle an incoming request.
     * Prevent transactions from being created/modified in closed periods
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip untuk routes tertentu (reports, monthly closing management, etc.)
        $exemptRoutes = [
            'monthly-closing.*',
            'reports.*',
            'approvals.*'
        ];

        foreach ($exemptRoutes as $pattern) {
            if ($request->routeIs($pattern)) {
                return $next($request);
            }
        }

        // Check jika request mengandung tanggal transaksi
        $transactionDate = $this->extractTransactionDate($request);
        
        if ($transactionDate) {
            $date = Carbon::parse($transactionDate);
            $year = $date->year;
            $month = $date->month;

            // Check apakah periode sudah di-close
            $closing = MonthlyClosing::forPeriod($year, $month)->closed()->first();
            
            if ($closing) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => "Periode {$closing->periode} sudah ditutup. Transaksi tidak dapat dibuat atau dimodifikasi.",
                        'error' => 'PERIOD_CLOSED',
                        'closed_period' => $closing->periode,
                        'closed_at' => $closing->closed_at
                    ], 422);
                }

                return redirect()->back()
                    ->with('error', "Periode {$closing->periode} sudah ditutup. Transaksi tidak dapat dibuat atau dimodifikasi.");
            }

            // Check cut-off date (jika ada cut-off yang sedang pending)
            $pendingClosing = MonthlyClosing::forPeriod($year, $month)
                ->whereIn('status', ['pending_approval', 'approved'])
                ->first();

            if ($pendingClosing && $date->lte($pendingClosing->tanggal_cut_off)) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => "Cut-off untuk periode {$pendingClosing->periode} sudah diberlakukan per {$pendingClosing->tanggal_cut_off->format('d/m/Y')}. Transaksi baru tidak dapat dibuat.",
                        'error' => 'CUT_OFF_ACTIVE',
                        'cut_off_date' => $pendingClosing->tanggal_cut_off->format('Y-m-d'),
                        'periode' => $pendingClosing->periode
                    ], 422);
                }

                return redirect()->back()
                    ->with('error', "Cut-off untuk periode {$pendingClosing->periode} sudah diberlakukan per {$pendingClosing->tanggal_cut_off->format('d/m/Y')}. Transaksi baru tidak dapat dibuat.");
            }
        }

        return $next($request);
    }

    /**
     * Extract transaction date from request
     */
    private function extractTransactionDate(Request $request)
    {
        // Common field names untuk tanggal transaksi
        $dateFields = [
            'tanggal_transaksi',
            'tanggal_jurnal',
            'transaction_date',
            'date'
        ];

        foreach ($dateFields as $field) {
            if ($request->has($field) && $request->get($field)) {
                return $request->get($field);
            }
        }

        return null;
    }
}

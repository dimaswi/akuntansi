<?php

namespace App\Http\Controllers\Akuntansi\Traits;

use App\Models\Akuntansi\JournalRevisionLog;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait HandlesRevisionLogs
{
    /**
     * Create revision log if request is marked as revision
     * 
     * @param Request $request
     * @param int $jurnalId
     * @param string $revisionType (edit|delete|unpost|reverse)
     * @param array|null $dataBefore
     * @param array|null $dataAfter
     * @return JournalRevisionLog|null
     */
    protected function createRevisionLog(
        Request $request, 
        int $jurnalId, 
        string $revisionType,
        ?array $dataBefore = null,
        ?array $dataAfter = null
    ): ?JournalRevisionLog {
        // Check if this is a revision request from middleware
        if (!$request->_is_revision) {
            return null;
        }

        // Get impact amount
        $impactAmount = $this->calculateImpactAmount($dataBefore, $dataAfter);

        // Create revision log
        $revisionLog = JournalRevisionLog::create([
            'jurnal_id' => $jurnalId,
            'closing_period_id' => $request->_closing_period_id,
            'revision_type' => $revisionType,
            'revision_reason' => $request->_revision_reason,
            'impact_amount' => $impactAmount,
            'data_before' => $dataBefore ? json_encode($dataBefore) : null,
            'data_after' => $dataAfter ? json_encode($dataAfter) : null,
            'requested_by' => Auth::id(),
            'request_date' => now(),
            'approval_status' => $request->_require_approval ? 'pending' : 'auto_approved',
            'approved_by' => !$request->_require_approval ? Auth::id() : null,
            'approval_date' => !$request->_require_approval ? now() : null,
        ]);

        // Send notification if approval required
        if ($request->_require_approval) {
            $notificationService = new NotificationService();
            
            // Get revision type label
            $revisionTypeLabel = match($revisionType) {
                'edit' => 'Edit',
                'delete' => 'Hapus',
                'unpost' => 'Unpost',
                'reverse' => 'Reverse',
                default => 'Revisi'
            };
            
            // Send notification - system will auto-filter based on each role's notification_settings
            $notificationService->sendToAllRoles(
                NotificationService::TYPE_REVISION_APPROVAL,
                [
                    'title' => 'Permintaan Approval Revisi',
                    'message' => Auth::user()->name . " meminta approval untuk {$revisionTypeLabel} jurnal. Alasan: {$request->_revision_reason}",
                    'action_url' => route('settings.revision-approvals.show', $revisionLog->id),
                    'data' => [
                        'revision_id' => $revisionLog->id,
                        'journal_id' => $jurnalId,
                        'revision_type' => $revisionType,
                        'impact_amount' => $impactAmount,
                        'requester' => Auth::user()->name
                    ]
                ]
            );
        }

        return $revisionLog;
    }

    /**
     * Calculate impact amount for revision
     * 
     * @param array|null $dataBefore
     * @param array|null $dataAfter
     * @return float
     */
    protected function calculateImpactAmount(?array $dataBefore, ?array $dataAfter): float
    {
        // For delete operations
        if ($dataBefore && !$dataAfter) {
            return abs($dataBefore['total_debit'] ?? 0);
        }

        // For create operations (shouldn't happen in revisions, but handle it)
        if (!$dataBefore && $dataAfter) {
            return abs($dataAfter['total_debit'] ?? 0);
        }

        // For edit operations - calculate the difference
        if ($dataBefore && $dataAfter) {
            $beforeTotal = abs($dataBefore['total_debit'] ?? 0);
            $afterTotal = abs($dataAfter['total_debit'] ?? 0);
            return abs($afterTotal - $beforeTotal);
        }

        return 0;
    }

    /**
     * Prepare jurnal data for revision log
     * 
     * @param \App\Models\Akuntansi\Jurnal $jurnal
     * @return array
     */
    protected function prepareJurnalDataForLog($jurnal): array
    {
        $jurnal->load('details.daftarAkun');

        return [
            'nomor_jurnal' => $jurnal->nomor_jurnal,
            'tanggal_transaksi' => $jurnal->tanggal_transaksi,
            'keterangan' => $jurnal->keterangan,
            'jenis_referensi' => $jurnal->jenis_referensi,
            'nomor_referensi' => $jurnal->nomor_referensi,
            'total_debit' => $jurnal->total_debit,
            'total_kredit' => $jurnal->total_kredit,
            'status' => $jurnal->status,
            'details' => $jurnal->details->map(function ($detail) {
                return [
                    'kode_akun' => $detail->daftarAkun->kode_akun,
                    'nama_akun' => $detail->daftarAkun->nama_akun,
                    'jumlah_debit' => $detail->jumlah_debit,
                    'jumlah_kredit' => $detail->jumlah_kredit,
                    'keterangan' => $detail->keterangan,
                ];
            })->toArray(),
        ];
    }

    /**
     * Check if revision is allowed without approval
     * 
     * @param Request $request
     * @return bool
     */
    protected function isAutoApprovedRevision(Request $request): bool
    {
        return $request->_is_revision && !$request->_require_approval;
    }

    /**
     * Check if revision requires approval
     * 
     * @param Request $request
     * @return bool
     */
    protected function requiresApproval(Request $request): bool
    {
        return $request->_is_revision && $request->_require_approval;
    }
}

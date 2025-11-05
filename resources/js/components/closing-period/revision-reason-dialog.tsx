import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RevisionReasonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (reason: string) => void;
    periodName?: string;
    actionType?: 'edit' | 'delete' | 'unpost' | 'reverse';
    isLoading?: boolean;
}

export function RevisionReasonDialog({
    open,
    onOpenChange,
    onSubmit,
    periodName,
    actionType = 'edit',
    isLoading = false,
}: RevisionReasonDialogProps) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const actionLabels = {
        edit: 'mengubah',
        delete: 'menghapus',
        unpost: 'membatalkan posting',
        reverse: 'mereverse',
    };

    const handleSubmit = () => {
        // Validate minimum length
        if (!reason || reason.trim().length < 20) {
            setError('Alasan revisi harus diisi minimal 20 karakter');
            return;
        }

        setError('');
        onSubmit(reason.trim());
    };

    const handleClose = () => {
        if (!isLoading) {
            setReason('');
            setError('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Alasan Revisi Periode Tertutup</DialogTitle>
                    <DialogDescription>
                        Periode <strong>{periodName || 'ini'}</strong> sudah di-soft close.
                        Untuk {actionLabels[actionType]} jurnal, Anda harus memberikan alasan yang jelas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Revisi ini akan dicatat dalam log dan mungkin memerlukan approval dari supervisor.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="revision-reason">
                            Alasan Revisi <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="revision-reason"
                            placeholder="Jelaskan alasan mengapa revisi ini diperlukan (minimal 20 karakter)..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError('');
                            }}
                            rows={5}
                            disabled={isLoading}
                            className={error ? 'border-red-500' : ''}
                        />
                        <p className="text-xs text-muted-foreground">
                            {reason.length} / 20 karakter minimum
                        </p>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>

                    <div className="rounded-md border bg-muted/50 p-3 text-sm">
                        <p className="font-medium mb-1">Catatan:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Alasan harus spesifik dan dapat dipertanggungjawabkan</li>
                            <li>Semua revisi tercatat dan dapat diaudit</li>
                            <li>Revisi mungkin perlu approval sesuai kebijakan perusahaan</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || reason.trim().length < 20}
                    >
                        {isLoading ? 'Memproses...' : 'Lanjutkan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

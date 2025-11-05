import { useState, FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TemplateSearchableDropdown } from '@/components/ui/template-searchable-dropdown';
import { BookOpenCheck, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
    id: number;
    template_name: string;
    period_type: string;
    cutoff_days: number;
    hard_close_days: number | null;
    description: string;
}

interface Props {
    templates: Template[];
    suggestedStart: string;
    suggestedEnd: string;
    errors?: Record<string, string>;
}

export default function CreateClosingPeriod({ templates, suggestedStart, suggestedEnd, errors }: Props) {
    const [formData, setFormData] = useState({
        period_name: '',
        period_type: 'monthly',
        period_start: suggestedStart,
        period_end: suggestedEnd,
        template_id: '',
        notes: '',
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        router.post(route('settings.closing-periods.store'), formData, {
            onSuccess: () => {
                toast.success('Periode berhasil dibuat');
            },
            onError: (errors) => {
                toast.error('Gagal membuat periode');
                console.error(errors);
            },
            onFinish: () => {
                setIsSaving(false);
            }
        });
    };

    const updateFormData = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const selectedTemplate = templates.find(t => t.id.toString() === formData.template_id);

    return (
        <AppLayout>
            <Head title="Buat Periode Tutup Buku" />

            <div className="p-6">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpenCheck className="h-4 w-4" />
                    <span>Periode Tutup Buku</span>
                    <span>/</span>
                    <span className="text-foreground">Buat Baru</span>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Buat Periode Tutup Buku</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Buat periode akuntansi baru dengan cut off date
                    </p>
                </div>

                {/* Info */}
                <div className="mb-6 flex items-start gap-3 rounded-md border bg-muted/50 p-4">
                    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                        <p>Periode tidak boleh overlap dengan periode yang sudah ada.</p>
                        <p>Cutoff date akan dihitung otomatis berdasarkan template yang dipilih.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Form Card */}
                    <div className="rounded-md border bg-card p-6 space-y-6">
                        {/* Period Name */}
                        <div className="space-y-2">
                            <Label htmlFor="period_name">
                                Nama Periode <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="period_name"
                                value={formData.period_name}
                                onChange={(e) => updateFormData('period_name', e.target.value)}
                                placeholder="Contoh: Januari 2024"
                                className={errors?.period_name ? 'border-destructive' : ''}
                            />
                            {errors?.period_name && (
                                <p className="text-sm text-destructive">{errors.period_name}</p>
                            )}
                        </div>

                        {/* Period Type */}
                        <div className="space-y-2">
                            <Label htmlFor="period_type">
                                Tipe Periode <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.period_type}
                                onValueChange={(value) => updateFormData('period_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Harian</SelectItem>
                                    <SelectItem value="weekly">Mingguan</SelectItem>
                                    <SelectItem value="monthly">Bulanan</SelectItem>
                                    <SelectItem value="quarterly">Kuartalan</SelectItem>
                                    <SelectItem value="yearly">Tahunan</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Period Start & End */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="period_start">
                                    Tanggal Mulai <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="period_start"
                                    type="date"
                                    value={formData.period_start}
                                    onChange={(e) => updateFormData('period_start', e.target.value)}
                                    className={errors?.period_start ? 'border-destructive' : ''}
                                />
                                {errors?.period_start && (
                                    <p className="text-sm text-destructive">{errors.period_start}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period_end">
                                    Tanggal Selesai <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="period_end"
                                    type="date"
                                    value={formData.period_end}
                                    onChange={(e) => updateFormData('period_end', e.target.value)}
                                    className={errors?.period_end ? 'border-destructive' : ''}
                                />
                                {errors?.period_end && (
                                    <p className="text-sm text-destructive">{errors.period_end}</p>
                                )}
                            </div>
                        </div>

                        {/* Template Selection - Searchable */}
                        <div className="space-y-2">
                            <Label htmlFor="template_id">
                                Template <span className="text-muted-foreground text-xs">(Opsional)</span>
                            </Label>
                            <TemplateSearchableDropdown
                                value={formData.template_id}
                                onValueChange={(value) => updateFormData('template_id', value || '')}
                                placeholder="Pilih template atau biarkan kosong"
                                templates={templates}
                            />
                            {selectedTemplate && (
                                <p className="text-sm text-muted-foreground">
                                    {selectedTemplate.description}
                                </p>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">
                                Catatan <span className="text-muted-foreground text-xs">(Opsional)</span>
                            </Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => updateFormData('notes', e.target.value)}
                                placeholder="Catatan tambahan tentang periode ini"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('settings.closing-periods.list'))}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Periode'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

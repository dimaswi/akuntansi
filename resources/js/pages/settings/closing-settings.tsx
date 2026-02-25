import { useState, FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
    Settings, 
    Calendar, 
    CheckCircle, 
    AlertCircle, 
    Bell,
    Shield,
    Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Setting {
    key: string;
    value: string;
    type: string;
    description: string;
    group: string;
}

interface ClosingSettingsProps {
    settings: Setting[];
}

interface FormData {
    [key: string]: string | boolean;
}

export default function ClosingSettings({ settings }: ClosingSettingsProps) {
    const [formData, setFormData] = useState<FormData>(() => {
        const initial: FormData = {};
        settings.forEach(setting => {
            if (setting.type === 'boolean') {
                initial[setting.key] = setting.value === 'true';
            } else {
                initial[setting.key] = setting.value;
            }
        });
        return initial;
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        router.put(route('settings.closing-periods.update'), formData, {
            onSuccess: () => {
                toast.success('Settings berhasil disimpan');
            },
            onError: (errors) => {
                toast.error('Gagal menyimpan settings');
                console.error(errors);
            },
            onFinish: () => {
                setIsSaving(false);
            }
        });
    };

    const getSetting = (key: string) => {
        return settings.find(s => s.key === key);
    };

    const getBooleanValue = (key: string): boolean => {
        return formData[key] as boolean;
    };

    const getStringValue = (key: string): string => {
        return formData[key] as string;
    };

    const updateSetting = (key: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Check if module is enabled
    const moduleEnabled = getBooleanValue('closing_module_enabled');

    return (
        <AppLayout>
            <Head title="Konfigurasi Global Tutup Buku" />

            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border bg-muted text-xs font-medium mb-3">
                        <Settings className="h-3 w-3" />
                        KONFIGURASI SISTEM
                    </div>
                    <h1 className="text-2xl font-semibold mb-2">
                        Konfigurasi Global Tutup Buku
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Pengaturan sistem untuk seluruh periode tutup buku. Atur sekali, berlaku untuk semua periode.
                    </p>
                </div>

                {/* Info Alert - Simple monochrome */}
                <div className="mb-6 rounded-md border bg-muted/50 p-5">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold mb-2">Perbedaan Konfigurasi vs Periode</h3>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>
                                    <strong>Halaman ini (Konfigurasi Global)</strong>: Atur aturan umum sistem tutup buku seperti 
                                    deadline, mode tutup buku, approval workflow. Dilakukan <strong>sekali</strong> atau jarang diubah.
                                </p>
                                <p>
                                    <strong>Periode Tutup Buku (Menu Akuntansi)</strong>: Membuat periode spesifik seperti 
                                    "Januari 2024", "Februari 2024". Dilakukan <strong>berulang setiap bulan</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* ===== GENERAL SETTINGS ===== */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Pengaturan Umum Sistem
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi dasar yang berlaku untuk semua periode tutup buku
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Module Enable/Disable */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="closing_module_enabled" className="text-base">
                                        Aktifkan Fitur Tutup Buku
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        {getSetting('closing_module_enabled')?.description}
                                    </p>
                                </div>
                                <Switch
                                    id="closing_module_enabled"
                                    checked={moduleEnabled}
                                    onCheckedChange={(checked) => updateSetting('closing_module_enabled', checked)}
                                />
                            </div>

                            <Separator />

                            {/* Closing Mode */}
                            <div className="space-y-3">
                                <Label className="text-base">Mode Tutup Buku</Label>
                                <p className="text-sm text-gray-500">
                                    {getSetting('closing_mode')?.description}
                                </p>
                                <RadioGroup
                                    value={getStringValue('closing_mode')}
                                    onValueChange={(value) => updateSetting('closing_mode', value)}
                                    disabled={!moduleEnabled}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <RadioGroupItem value="disabled" id="mode_disabled" />
                                        <Label htmlFor="mode_disabled" className="flex-1 cursor-pointer">
                                            <div className="font-medium">Nonaktif</div>
                                            <div className="text-sm text-gray-500">
                                                Fitur tutup buku tidak berjalan (safe mode)
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <RadioGroupItem value="soft_only" id="mode_soft" />
                                        <Label htmlFor="mode_soft" className="flex-1 cursor-pointer">
                                            <div className="font-medium">Soft Close Only (Recommended)</div>
                                            <div className="text-sm text-gray-500">
                                                Periode bisa di-close tapi masih bisa edit dengan alasan
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <RadioGroupItem value="soft_and_hard" id="mode_full" />
                                        <Label htmlFor="mode_full" className="flex-1 cursor-pointer">
                                            <div className="font-medium">Full Implementation</div>
                                            <div className="text-sm text-gray-500">
                                                Soft close + hard close (periode dikunci permanen)
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Auto Create Period */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="auto_create_period" className="text-base">
                                        Auto Create Periode
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        {getSetting('auto_create_period')?.description}
                                    </p>
                                </div>
                                <Switch
                                    id="auto_create_period"
                                    checked={getBooleanValue('auto_create_period')}
                                    onCheckedChange={(checked) => updateSetting('auto_create_period', checked)}
                                    disabled={!moduleEnabled}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ===== CUT OFF SETTINGS ===== */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Template Deadline Default
                            </CardTitle>
                            <CardDescription>
                                Nilai default untuk deadline soft close dan hard close (berlaku saat create periode baru)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Soft Close Days */}
                                <div className="space-y-2">
                                    <Label htmlFor="default_cutoff_days">
                                        Deadline Soft Close (hari)
                                    </Label>
                                    <Input
                                        id="default_cutoff_days"
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={getStringValue('default_cutoff_days')}
                                        onChange={(e) => updateSetting('default_cutoff_days', e.target.value)}
                                        disabled={!moduleEnabled}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {getSetting('default_cutoff_days')?.description}
                                    </p>
                                </div>

                                {/* Hard Close Days */}
                                <div className="space-y-2">
                                    <Label htmlFor="hard_close_days">
                                        Deadline Hard Close (hari)
                                    </Label>
                                    <Input
                                        id="hard_close_days"
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={getStringValue('hard_close_days')}
                                        onChange={(e) => updateSetting('hard_close_days', e.target.value)}
                                        disabled={!moduleEnabled}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {getSetting('hard_close_days')?.description}
                                    </p>
                                </div>

                                {/* Warning Days */}
                                <div className="space-y-2">
                                    <Label htmlFor="warning_days_before_cutoff">
                                        Reminder (hari sebelum deadline)
                                    </Label>
                                    <Input
                                        id="warning_days_before_cutoff"
                                        type="number"
                                        min="1"
                                        max="7"
                                        value={getStringValue('warning_days_before_cutoff')}
                                        onChange={(e) => updateSetting('warning_days_before_cutoff', e.target.value)}
                                        disabled={!moduleEnabled}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {getSetting('warning_days_before_cutoff')?.description}
                                    </p>
                                </div>

                                {/* Auto Soft Close */}
                                <div className="space-y-2 flex items-center">
                                    <div className="flex-1">
                                        <Label htmlFor="auto_soft_close">
                                            Auto Soft Close
                                        </Label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {getSetting('auto_soft_close')?.description}
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto_soft_close"
                                        checked={getBooleanValue('auto_soft_close')}
                                        onCheckedChange={(checked) => updateSetting('auto_soft_close', checked)}
                                        disabled={!moduleEnabled}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ===== APPROVAL SETTINGS ===== */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Workflow Approval Global
                            </CardTitle>
                            <CardDescription>
                                Aturan approval untuk revisi jurnal setelah soft close (berlaku semua periode)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Require Approval */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="require_approval_after_soft_close" className="text-base">
                                        Revisi Butuh Approval
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        {getSetting('require_approval_after_soft_close')?.description}
                                    </p>
                                </div>
                                <Switch
                                    id="require_approval_after_soft_close"
                                    checked={getBooleanValue('require_approval_after_soft_close')}
                                    onCheckedChange={(checked) => updateSetting('require_approval_after_soft_close', checked)}
                                    disabled={!moduleEnabled}
                                />
                            </div>

                            <Separator />

                            {/* Material Threshold */}
                            <div className="space-y-2">
                                <Label htmlFor="material_threshold">
                                    Material Threshold (Rp)
                                </Label>
                                <Input
                                    id="material_threshold"
                                    type="number"
                                    min="0"
                                    step="100000"
                                    value={getStringValue('material_threshold')}
                                    onChange={(e) => updateSetting('material_threshold', e.target.value)}
                                    disabled={!moduleEnabled}
                                />
                                <p className="text-xs text-gray-500">
                                    {getSetting('material_threshold')?.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ===== NOTIFICATION SETTINGS ===== */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifikasi & Reminder
                            </CardTitle>
                            <CardDescription>
                                Email reminder otomatis untuk mengingatkan deadline (berlaku semua periode)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Send Reminder */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="send_reminder_notifications" className="text-base">
                                        Kirim Reminder
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        {getSetting('send_reminder_notifications')?.description}
                                    </p>
                                </div>
                                <Switch
                                    id="send_reminder_notifications"
                                    checked={getBooleanValue('send_reminder_notifications')}
                                    onCheckedChange={(checked) => updateSetting('send_reminder_notifications', checked)}
                                    disabled={!moduleEnabled}
                                />
                            </div>

                            <Separator />

                            {/* Notification Email */}
                            <div className="space-y-2">
                                <Label htmlFor="notification_email">
                                    Email Notifikasi
                                </Label>
                                <Input
                                    id="notification_email"
                                    type="email"
                                    value={getStringValue('notification_email')}
                                    onChange={(e) => updateSetting('notification_email', e.target.value)}
                                    disabled={!moduleEnabled}
                                    placeholder="finance@company.com"
                                />
                                <p className="text-xs text-gray-500">
                                    {getSetting('notification_email')?.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ===== EMERGENCY SETTINGS ===== */}
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-5 w-5" />
                                Pengaturan Emergency
                            </CardTitle>
                            <CardDescription className="text-red-600">
                                Pengaturan untuk situasi darurat (hati-hati!)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Allow Reopen Hard Close */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="allow_reopen_hard_close" className="text-base">
                                        Izinkan Reopen Hard Close
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        {getSetting('allow_reopen_hard_close')?.description}
                                    </p>
                                </div>
                                <Switch
                                    id="allow_reopen_hard_close"
                                    checked={getBooleanValue('allow_reopen_hard_close')}
                                    onCheckedChange={(checked) => updateSetting('allow_reopen_hard_close', checked)}
                                    disabled={!moduleEnabled}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t pt-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('akuntansi.index'))}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

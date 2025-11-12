import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { 
    AlertCircle,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Clock,
    Download,
    FileBarChart,
    TrendingUp,
    XCircle,
    Package
} from "lucide-react";

interface Department {
    id: number;
    name: string;
    has_previous_month_opname: boolean;
    days_since_last_opname: number | null;
    last_opname_date: string | null;
    is_late: boolean;
    is_blocked: boolean;
    has_pending: boolean;
    severity: 'ok' | 'warning' | 'high' | 'critical';
    status_label: string;
    recent_history: OpnameHistory[];
}

interface OpnameHistory {
    opname_number: string;
    opname_date: string;
    total_items_counted: number;
    total_variance_value: number;
}

interface ComplianceStats {
    total_departments: number;
    compliant: number;
    late: number;
    blocked: number;
    pending: number;
    compliance_rate: number;
    critical_count: number;
    high_count: number;
    warning_count: number;
}

interface MonthlyTrend {
    month: string;
    total: number;
    completed: number;
    compliance_rate: number;
}

interface Props extends SharedData {
    departments: Department[];
    stats: ComplianceStats;
    monthlyTrend: MonthlyTrend[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Package className="h-4 w-4" />,
        href: '/inventory',
    },
    {
        title: 'Laporan',
        href: '#',
    },
    {
        title: 'Kepatuhan Opname',
        href: '#',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getSeverityBadge = (severity: string) => {
    switch (severity) {
        case 'ok':
            return <Badge className="bg-neutral-100 text-neutral-800 border-neutral-300">Normal</Badge>;
        case 'warning':
            return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Peringatan</Badge>;
        case 'high':
            return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Tinggi</Badge>;
        case 'critical':
            return <Badge className="bg-red-100 text-red-800 border-red-300">Kritis</Badge>;
        default:
            return <Badge variant="outline">{severity}</Badge>;
    }
};

const getStatusIcon = (severity: string) => {
    switch (severity) {
        case 'ok':
            return <CheckCircle2 className="h-4 w-4 text-neutral-600" />;
        case 'warning':
            return <AlertCircle className="h-4 w-4 text-yellow-600" />;
        case 'high':
            return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        case 'critical':
            return <XCircle className="h-4 w-4 text-red-600" />;
        default:
            return <Clock className="h-4 w-4" />;
    }
};

export default function OpnameComplianceReport() {
    const { departments, stats, monthlyTrend } = usePage<Props>().props;

    const handleExport = () => {
        router.visit('/reports/stock-opname-compliance/export');
    };

    // Group departments by severity
    const criticalDepts = departments.filter((d: Department) => d.severity === 'critical');
    const highDepts = departments.filter((d: Department) => d.severity === 'high');
    const warningDepts = departments.filter((d: Department) => d.severity === 'warning');
    const okDepts = departments.filter((d: Department) => d.severity === 'ok');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Kepatuhan Stock Opname" />
            <div className="p-4 space-y-4">
                {/* Header Card */}
                <Card className="border-neutral-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-neutral-900">
                                    <BarChart3 className="h-5 w-5" />
                                    Laporan Kepatuhan Stock Opname
                                </CardTitle>
                                <CardDescription className="text-neutral-600">
                                    Monitoring compliance stock opname bulanan per departemen
                                </CardDescription>
                            </div>
                            <Button 
                                variant="outline" 
                                className="gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                                onClick={handleExport}
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Critical Alert */}
                {(criticalDepts.length > 0 || highDepts.length > 0) && (
                    <Alert className="border-red-300 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800 text-sm">
                            <strong>Perhatian!</strong> Terdapat {criticalDepts.length} departemen dengan status kritis 
                            dan {highDepts.length} departemen dengan status tinggi yang perlu segera melakukan stock opname.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Statistics Cards - Compact Monochrome */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <Card className="border-neutral-200">
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-1">
                                <p className="text-xs text-neutral-500 font-medium">Total Departemen</p>
                                <p className="text-2xl font-bold text-neutral-900">{stats.total_departments}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-300 bg-neutral-50">
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-neutral-600" />
                                    <p className="text-xs text-neutral-600 font-medium">Compliant</p>
                                </div>
                                <p className="text-2xl font-bold text-neutral-900">{stats.compliant}</p>
                                <p className="text-xs text-neutral-500">{stats.compliance_rate}% rate</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-300 bg-yellow-50">
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 text-yellow-700" />
                                    <p className="text-xs text-yellow-700 font-medium">Warning</p>
                                </div>
                                <p className="text-2xl font-bold text-yellow-900">{stats.warning_count}</p>
                                <p className="text-xs text-yellow-600">Perlu segera</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-300 bg-orange-50">
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 text-orange-700" />
                                    <p className="text-xs text-orange-700 font-medium">High</p>
                                </div>
                                <p className="text-2xl font-bold text-orange-900">{stats.high_count}</p>
                                <p className="text-xs text-orange-600">Terlambat</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-300 bg-red-50">
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-red-700" />
                                    <p className="text-xs text-red-700 font-medium">Critical</p>
                                </div>
                                <p className="text-2xl font-bold text-red-900">{stats.critical_count}</p>
                                <p className="text-xs text-red-600">Sangat terlambat</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Trend Chart - Compact */}
                <Card className="border-neutral-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-neutral-900">
                            <TrendingUp className="h-4 w-4" />
                            Tren Compliance 6 Bulan Terakhir
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {monthlyTrend.map((trend: MonthlyTrend, index: number) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="text-xs font-medium text-neutral-600 w-16">{trend.month}</div>
                                    <div className="flex-1 h-6 bg-neutral-100 rounded-sm overflow-hidden">
                                        <div 
                                            className="h-full bg-neutral-800 transition-all"
                                            style={{ width: `${trend.compliance_rate}%` }}
                                        />
                                    </div>
                                    <div className="text-xs font-mono text-neutral-700 w-16 text-right">
                                        {trend.completed}/{trend.total}
                                    </div>
                                    <div className="text-xs font-medium text-neutral-800 w-12 text-right">
                                        {trend.compliance_rate}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Departments Table - Critical First */}
                <Card className="border-neutral-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-neutral-900">
                            <FileBarChart className="h-4 w-4" />
                            Status Departemen ({departments.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border border-neutral-200 rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-neutral-50 border-b border-neutral-200">
                                        <TableHead className="text-neutral-700 font-semibold">Departemen</TableHead>
                                        <TableHead className="text-neutral-700 font-semibold">Status</TableHead>
                                        <TableHead className="text-neutral-700 font-semibold">Severity</TableHead>
                                        <TableHead className="text-neutral-700 font-semibold">Opname Terakhir</TableHead>
                                        <TableHead className="text-neutral-700 font-semibold text-right">Hari Lewat</TableHead>
                                        <TableHead className="text-neutral-700 font-semibold">Blocked</TableHead>
                                        <TableHead className="text-neutral-700 font-semibold text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                                                Tidak ada data departemen
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <>
                                            {/* Critical - Red Background */}
                                            {criticalDepts.map((dept: Department) => (
                                                <TableRow key={dept.id} className="bg-red-50 hover:bg-red-100 border-b border-red-100">
                                                    <TableCell className="font-medium text-neutral-900">
                                                        {dept.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(dept.severity)}
                                                            <span className="text-sm text-neutral-700">{dept.status_label}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getSeverityBadge(dept.severity)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-neutral-700">
                                                        {dept.last_opname_date ? formatDate(dept.last_opname_date) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={`text-sm font-mono ${
                                                            dept.days_since_last_opname && dept.days_since_last_opname > 60 
                                                                ? 'text-red-700 font-bold' 
                                                                : 'text-neutral-700'
                                                        }`}>
                                                            {dept.days_since_last_opname !== null ? `${dept.days_since_last_opname} hari` : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.is_blocked ? (
                                                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                                                Blocked
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs border-neutral-300"
                                                            onClick={() => router.visit('/stock-opnames')}
                                                        >
                                                            Detail
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* High - Orange Background */}
                                            {highDepts.map((dept: Department) => (
                                                <TableRow key={dept.id} className="bg-orange-50 hover:bg-orange-100 border-b border-orange-100">
                                                    <TableCell className="font-medium text-neutral-900">
                                                        {dept.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(dept.severity)}
                                                            <span className="text-sm text-neutral-700">{dept.status_label}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getSeverityBadge(dept.severity)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-neutral-700">
                                                        {dept.last_opname_date ? formatDate(dept.last_opname_date) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-mono text-neutral-700">
                                                            {dept.days_since_last_opname !== null ? `${dept.days_since_last_opname} hari` : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.is_blocked ? (
                                                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                                                Blocked
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs border-neutral-300"
                                                            onClick={() => router.visit('/stock-opnames')}
                                                        >
                                                            Detail
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* Warning - Yellow Background */}
                                            {warningDepts.map((dept: Department) => (
                                                <TableRow key={dept.id} className="bg-yellow-50 hover:bg-yellow-100 border-b border-yellow-100">
                                                    <TableCell className="font-medium text-neutral-900">
                                                        {dept.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(dept.severity)}
                                                            <span className="text-sm text-neutral-700">{dept.status_label}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getSeverityBadge(dept.severity)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-neutral-700">
                                                        {dept.last_opname_date ? formatDate(dept.last_opname_date) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-mono text-neutral-700">
                                                            {dept.days_since_last_opname !== null ? `${dept.days_since_last_opname} hari` : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.is_blocked ? (
                                                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                                                Blocked
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs border-neutral-300"
                                                            onClick={() => router.visit('/stock-opnames')}
                                                        >
                                                            Detail
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {/* OK - Normal Background */}
                                            {okDepts.map((dept: Department) => (
                                                <TableRow key={dept.id} className="hover:bg-neutral-50 border-b border-neutral-100">
                                                    <TableCell className="font-medium text-neutral-900">
                                                        {dept.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(dept.severity)}
                                                            <span className="text-sm text-neutral-700">{dept.status_label}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getSeverityBadge(dept.severity)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-neutral-700">
                                                        {dept.last_opname_date ? formatDate(dept.last_opname_date) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-sm font-mono text-neutral-700">
                                                            {dept.days_since_last_opname !== null ? `${dept.days_since_last_opname} hari` : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.is_blocked ? (
                                                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                                                Blocked
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                                                                Active
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs border-neutral-300"
                                                            onClick={() => router.visit('/stock-opnames')}
                                                        >
                                                            Detail
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Information Footer */}
                <Card className="border-neutral-200 bg-neutral-50">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-neutral-600 mt-0.5" />
                            <div className="space-y-2 text-sm text-neutral-700">
                                <p className="font-medium">Informasi Severity Level:</p>
                                <ul className="space-y-1 text-xs">
                                    <li><strong>Normal:</strong> Opname bulan lalu sudah selesai</li>
                                    <li><strong>Warning:</strong> Melewati grace period (6-14 hari)</li>
                                    <li><strong>High:</strong> Terlambat 15-60 hari</li>
                                    <li><strong>Critical:</strong> Terlambat lebih dari 60 hari atau belum pernah opname</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

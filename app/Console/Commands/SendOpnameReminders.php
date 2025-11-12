<?php

namespace App\Console\Commands;

use App\Models\Inventory\StockOpname;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendOpnameReminders extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'opname:send-reminders';

    /**
     * The console command description.
     */
    protected $description = 'Send reminders to departments that haven\'t completed stock opname';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking departments for stock opname reminders...');
        
        $currentDay = Carbon::now()->day;
        $currentMonth = Carbon::now()->format('F Y');
        
        // Get departments without previous month opname
        $departments = StockOpname::getDepartmentsWithoutPreviousMonthOpname();
        
        if ($departments->isEmpty()) {
            $this->info('✅ All departments have completed their stock opname!');
            return 0;
        }
        
        $this->warn("⚠️  Found {$departments->count()} department(s) without opname:");
        
        foreach ($departments as $dept) {
            $this->line("   - {$dept['name']} (Severity: {$dept['severity']})");
            
            // Determine reminder type based on day of month
            $reminderType = $this->getReminderType($currentDay, $dept['severity']);
            
            if ($reminderType) {
                $this->sendReminder($dept, $reminderType, $currentMonth);
            }
        }
        
        $this->info('✅ Reminder notifications sent successfully!');
        return 0;
    }

    /**
     * Determine what type of reminder to send based on day of month
     */
    private function getReminderType(int $day, string $severity): ?string
    {
        // Early month reminders (Day 1-7)
        if ($day >= 1 && $day <= 7) {
            return 'early_month'; // Gentle reminder
        }
        
        // Mid-month reminders (Day 15)
        if ($day == 15 && in_array($severity, ['warning', 'high', 'critical'])) {
            return 'mid_month'; // Escalation
        }
        
        // End-month urgent (Day 25-31)
        if ($day >= 25) {
            return 'end_month'; // Urgent reminder
        }
        
        // Weekly reminders for critical cases (Every Monday)
        if (Carbon::now()->isDayOfWeek(Carbon::MONDAY) && $severity === 'critical') {
            return 'critical_weekly';
        }
        
        return null; // No reminder today
    }

    /**
     * Send reminder notification
     */
    private function sendReminder(array $department, string $reminderType, string $currentMonth): void
    {
        $messages = [
            'early_month' => [
                'title' => '📋 Reminder: Stock Opname Bulan Lalu Belum Selesai',
                'message' => "Department {$department['name']} belum menyelesaikan stock opname bulan sebelumnya. Mohon segera diselesaikan agar operasional tidak terganggu.",
                'urgency' => 'normal',
            ],
            'mid_month' => [
                'title' => '⚠️ PERINGATAN: Stock Opname Tertunda',
                'message' => "Department {$department['name']} BELUM menyelesaikan stock opname bulan lalu. Ini akan memblokir pembuatan Stock Request dan Transfer. Harap segera ditindaklanjuti!",
                'urgency' => 'high',
            ],
            'end_month' => [
                'title' => '🚨 URGENT: Stock Opname Harus Segera Diselesaikan!',
                'message' => "Department {$department['name']} BELUM menyelesaikan stock opname. DEADLINE: Akhir bulan ini! Department tidak dapat membuat permintaan stock sampai opname selesai.",
                'urgency' => 'urgent',
            ],
            'critical_weekly' => [
                'title' => '🔴 CRITICAL: Stock Opname Sangat Tertunda',
                'message' => "Department {$department['name']} SANGAT TERLAMBAT dalam stock opname (Terakhir: {$department['last_opname_date']}). Operasional department terganggu. Mohon SEGERA TINDAK LANJUT!",
                'urgency' => 'critical',
            ],
        ];

        $messageData = $messages[$reminderType];

        // Send to department users
        $this->notificationService->sendToDepartment(
            $department['id'],
            NotificationService::TYPE_STOCK_OPNAME_REMINDER,
            [
                'title' => $messageData['title'],
                'message' => $messageData['message'],
                'action_url' => route('stock-opnames.create'),
                'data' => [
                    'department_id' => $department['id'],
                    'department_name' => $department['name'],
                    'days_overdue' => $department['days_since_last_opname'],
                    'last_opname_date' => $department['last_opname_date'],
                    'severity' => $department['severity'],
                    'reminder_type' => $reminderType,
                ]
            ]
        );

        // Also notify logistics for high/critical cases
        if (in_array($reminderType, ['mid_month', 'end_month', 'critical_weekly'])) {
            $this->notificationService->sendToRoles(
                NotificationService::TYPE_STOCK_OPNAME_ESCALATION,
                ['logistics', 'super_admin'],
                [
                    'title' => "⚠️ Escalation: {$department['name']} Belum Opname",
                    'message' => "Department {$department['name']} belum menyelesaikan stock opname. Severity: {$department['severity']}. Terakhir opname: {$department['last_opname_date']}. Mohon tindak lanjut dengan department terkait.",
                    'action_url' => route('inventory.dashboard'),
                    'data' => [
                        'department_id' => $department['id'],
                        'department_name' => $department['name'],
                        'severity' => $department['severity'],
                    ]
                ]
            );
        }
    }
}

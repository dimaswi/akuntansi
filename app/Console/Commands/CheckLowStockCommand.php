<?php

namespace App\Console\Commands;

use App\Models\Inventory\Item;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class CheckLowStockCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'inventory:check-low-stock';

    /**
     * The console command description.
     */
    protected $description = 'Check for low stock items and send notifications';

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
        $this->info('Checking for low stock items...');

        // Get items dengan low stock
        $lowStockItems = Item::with(['category', 'stocks' => function ($query) {
                $query->whereNull('department_id'); // Central warehouse only
            }])
            ->active()
            ->lowStock()
            ->get();

        if ($lowStockItems->isEmpty()) {
            $this->info('No low stock items found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$lowStockItems->count()} low stock items.");

        // Group items by urgency
        $critical = [];  // Stock habis
        $low = [];       // Stock di bawah reorder level
        $belowSafety = []; // Stock di bawah safety stock

        foreach ($lowStockItems as $item) {
            $centralStock = $item->centralStock();
            if (!$centralStock) {
                continue;
            }

            $available = $centralStock->available_quantity;
            $status = $item->getStockStatus();

            $itemInfo = [
                'code' => $item->code,
                'name' => $item->name,
                'category' => $item->category->name ?? 'N/A',
                'available' => $available,
                'reorder_level' => $item->reorder_level,
                'safety_stock' => $item->safety_stock,
            ];

            if ($status === 'out_of_stock') {
                $critical[] = $itemInfo;
            } elseif ($status === 'low_stock') {
                $low[] = $itemInfo;
            } elseif ($status === 'below_safety') {
                $belowSafety[] = $itemInfo;
            }
        }

        // Send notifications
        if (!empty($critical)) {
            $this->sendCriticalAlert($critical);
            $this->error("CRITICAL: {count($critical)} items are OUT OF STOCK!");
        }

        if (!empty($low)) {
            $this->sendLowStockAlert($low);
            $this->warn("LOW STOCK: " . count($low) . " items below reorder level.");
        }

        if (!empty($belowSafety)) {
            $this->sendBelowSafetyAlert($belowSafety);
            $this->warn("BELOW SAFETY: " . count($belowSafety) . " items below safety stock.");
        }

        $this->info('Low stock check completed.');
        return Command::SUCCESS;
    }

    /**
     * Send critical alert for out of stock items
     */
    private function sendCriticalAlert(array $items): void
    {
        $itemList = array_map(function ($item) {
            return "{$item['code']} - {$item['name']} ({$item['category']})";
        }, $items);

        $message = "URGENT: " . count($items) . " barang HABIS!\n\n";
        $message .= implode("\n", array_slice($itemList, 0, 5));
        
        if (count($items) > 5) {
            $message .= "\n... dan " . (count($items) - 5) . " item lainnya";
        }

        $this->notificationService->sendToRoles(
            NotificationService::TYPE_LOW_STOCK_ALERT,
            ['logistics', 'manager', 'administrator'],
            [
                'title' => '🚨 STOK HABIS - Segera Lakukan Pembelian!',
                'message' => $message,
                'action_url' => route('items.index') . '?status=out_of_stock',
                'data' => [
                    'alert_type' => 'critical',
                    'items_count' => count($items),
                    'items' => $items,
                ],
            ]
        );
    }

    /**
     * Send low stock alert
     */
    private function sendLowStockAlert(array $items): void
    {
        $itemList = array_map(function ($item) {
            return "{$item['code']} - {$item['name']} (Sisa: {$item['available']}, Reorder: {$item['reorder_level']})";
        }, $items);

        $message = count($items) . " barang stok menipis (di bawah reorder level):\n\n";
        $message .= implode("\n", array_slice($itemList, 0, 10));
        
        if (count($items) > 10) {
            $message .= "\n... dan " . (count($items) - 10) . " item lainnya";
        }

        $this->notificationService->sendToRoles(
            NotificationService::TYPE_LOW_STOCK_ALERT,
            ['logistics', 'manager'],
            [
                'title' => '⚠️ Stok Menipis - Pertimbangkan Pembelian',
                'message' => $message,
                'action_url' => route('items.index') . '?status=low_stock',
                'data' => [
                    'alert_type' => 'low_stock',
                    'items_count' => count($items),
                    'items' => $items,
                ],
            ]
        );
    }

    /**
     * Send below safety stock alert
     */
    private function sendBelowSafetyAlert(array $items): void
    {
        $itemList = array_map(function ($item) {
            return "{$item['code']} - {$item['name']} (Sisa: {$item['available']}, Safety: {$item['safety_stock']})";
        }, $items);

        $message = count($items) . " barang di bawah safety stock:\n\n";
        $message .= implode("\n", array_slice($itemList, 0, 10));
        
        if (count($items) > 10) {
            $message .= "\n... dan " . (count($items) - 10) . " item lainnya";
        }

        $this->notificationService->sendToRoles(
            NotificationService::TYPE_LOW_STOCK_ALERT,
            ['logistics'],
            [
                'title' => 'ℹ️ Di Bawah Safety Stock',
                'message' => $message,
                'action_url' => route('items.index') . '?status=below_safety',
                'data' => [
                    'alert_type' => 'below_safety',
                    'items_count' => count($items),
                    'items' => $items,
                ],
            ]
        );
    }
}

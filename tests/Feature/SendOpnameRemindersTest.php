<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Inventory\StockOpname;
use App\Models\Inventory\Department;
use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SendOpnameRemindersTest extends TestCase
{
    use RefreshDatabase;

    public function test_sends_early_month_reminders_on_day_1()
    {
        // Set test date to day 1
        Carbon::setTestNow(Carbon::create(2025, 11, 1));

        // Create department and user
        $department = Department::factory()->create(['is_active' => true]);
        $user = User::factory()->create(['department_id' => $department->id]);

        // Run command
        $this->artisan('opname:send-reminders')
            ->expectsOutput('Checking departments for stock opname reminders...')
            ->assertExitCode(0);

        // Assert notification was created
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'type' => 'system',
        ]);

        Carbon::setTestNow(); // Reset
    }

    public function test_no_reminders_sent_on_day_12()
    {
        // Set test date to day 12 (no reminder day)
        Carbon::setTestNow(Carbon::create(2025, 11, 12));

        // Create department and user
        $department = Department::factory()->create(['is_active' => true]);
        $user = User::factory()->create(['department_id' => $department->id]);

        $notificationCountBefore = Notification::count();

        // Run command
        $this->artisan('opname:send-reminders')
            ->assertExitCode(0);

        // Assert no new notifications created
        $this->assertEquals($notificationCountBefore, Notification::count());

        Carbon::setTestNow(); // Reset
    }

    public function test_sends_mid_month_reminders_on_day_15_for_critical()
    {
        // Set test date to day 15
        Carbon::setTestNow(Carbon::create(2025, 11, 15));

        // Create department and user
        $department = Department::factory()->create(['is_active' => true]);
        $user = User::factory()->create(['department_id' => $department->id]);

        // Run command
        $this->artisan('opname:send-reminders')
            ->assertExitCode(0);

        // Assert notification was created (mid_month for critical severity)
        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
        ]);

        Carbon::setTestNow(); // Reset
    }
}

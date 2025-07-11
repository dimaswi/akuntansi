<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckCurrentUser extends Command
{
    protected $signature = 'check:current-user';
    protected $description = 'Check currently authenticated user in web session';

    public function handle()
    {
        // This command cannot access web session directly
        // We need to test through browser or API
        
        $this->info('This command checks the setup for web authentication.');
        $this->info('To test navigation:');
        $this->info('1. Login as user with NIP: 2023.01.02.04 (Manager User)');
        $this->info('2. Password should be the default from seeder');
        $this->info('3. Check if Approvals menu appears in navigation');
        
        // Show what user should have access to
        $this->info("\nUser should have these approval permissions:");
        $this->line("✓ approval.cash-transactions.approve");
        $this->line("✓ approval.journal-posting.approve");
        
        return 0;
    }
}

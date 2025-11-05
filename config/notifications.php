<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Notification Role Groups
    |--------------------------------------------------------------------------
    |
    | Define groups of roles that should receive specific types of notifications.
    | This makes it easy to manage which roles receive which notifications
    | without hardcoding role names in controllers.
    |
    */

    'role_groups' => [
        // Roles that should receive accounting notifications
        'accounting' => [
            'akuntansi',
            'manager',
            'administrator',
        ],

        // Roles that should receive closing period notifications
        'closing_period' => [
            'akuntansi',
            'manager',
            'administrator',
        ],

        // Roles that can approve revisions
        'revision_approvers' => [
            'manager',
            'administrator',
        ],

        // Roles for cash/bank transaction notifications
        'cash_bank' => [
            'akuntansi',
            'manager',
            'administrator',
        ],

        // All administrative roles
        'admin' => [
            'administrator',
            'admin',
        ],
    ],
];

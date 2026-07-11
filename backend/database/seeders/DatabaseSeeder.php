<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create roles
        $adminRole = \App\Models\Role::create(['name' => 'admin']);
        $managerRole = \App\Models\Role::create(['name' => 'manager']);
        $memberRole = \App\Models\Role::create(['name' => 'member']);

        // Create users
        \App\Models\User::create([
            'role_id' => $adminRole->id,
            'name' => 'Admin User',
            'email' => 'admin@cyphlab.com',
            'password' => bcrypt('password'),
        ]);

        \App\Models\User::create([
            'role_id' => $managerRole->id,
            'name' => 'Manager User',
            'email' => 'manager@cyphlab.com',
            'password' => bcrypt('password'),
        ]);

        \App\Models\User::create([
            'role_id' => $memberRole->id,
            'name' => 'Member User',
            'email' => 'member@cyphlab.com',
            'password' => bcrypt('password'),
        ]);
    }
}

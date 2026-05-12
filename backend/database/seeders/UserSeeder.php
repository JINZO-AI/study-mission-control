<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Default admin user for development
        User::firstOrCreate(
            ['email' => 'admin@study.com'],
            [
                'name'     => 'Admin',
                'email'    => 'admin@study.com',
                'password' => Hash::make('password'),
            ]
        );
    }
}

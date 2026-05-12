<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->create([
            'name'     => 'Mohamed Jawad',
            'email'    => 'admin@study.com',
            'password' => bcrypt('password'),
        ]);
    }
}

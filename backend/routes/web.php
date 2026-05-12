<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'app'    => 'Study Mission Control API',
        'version' => '2.0.0',
        'stack' => 'Laravel 11',
    ]);
});

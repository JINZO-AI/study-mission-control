<?php

namespace App\Http\Controllers;

use App\Services\StudyCalculator;
use Illuminate\Http\JsonResponse;

class DateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(StudyCalculator::KEY_DATES);
    }
}

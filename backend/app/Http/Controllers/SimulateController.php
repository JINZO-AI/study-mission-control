<?php

namespace App\Http\Controllers;

use App\Services\StudyCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SimulateController extends Controller
{
    public function __construct(private StudyCalculator $calc) {}

    public function simulate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subjects'         => 'required|array|min:1',
            'subjects.*.coeff' => 'required|numeric|min:0',
            'subjects.*.hasDS' => 'required|boolean',
            'subjects.*.hasCC' => 'required|boolean',
            'target'           => 'required|numeric|min:0|max:20',
        ]);

        $subjects = $data['subjects'];
        $target   = $data['target'];

        $ws = $wt = 0;
        foreach ($subjects as $s) {
            $g = $this->calc->calcGrade($s);
            if ($g !== null) {
                $ws += $g * $s['coeff'];
                $wt += $s['coeff'];
            }
        }

        $current = $wt > 0 ? $ws / $wt : null;

        return response()->json([
            'simulatedAverage' => $current !== null ? round($current, 2) : null,
            'onTarget'         => ($current ?? 0) >= $target,
            'gap'              => round(($current ?? 0) - $target, 2),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\StudyCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForecastController extends Controller
{
    public function __construct(private StudyCalculator $calc) {}

    public function forecast(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subjects'          => 'required|array|min:1',
            'subjects.*.id'     => 'required|string',
            'subjects.*.name'   => 'required|string',
            'subjects.*.coeff'  => 'required|numeric|min:0',
            'subjects.*.hasDS'  => 'required|boolean',
            'subjects.*.hasCC'  => 'required|boolean',
            'subjects.*.hasExam'=> 'required|boolean',
            'subjects.*.chapters'          => 'required|integer|min:0',
            'subjects.*.chaptersCompleted' => 'required|integer|min:0',
            'subjects.*.difficulty'        => 'required|in:easy,medium,hard,very_hard',
            'subjects.*.confidence'        => 'required|in:expert,good,neutral,weak,lost',
            'subjects.*.hoursStudied'      => 'sometimes|numeric|min:0',
            'schedule'     => 'required|array',
            'schedule.mon' => 'required|numeric|min:0',
            'schedule.tue' => 'required|numeric|min:0',
            'schedule.wed' => 'required|numeric|min:0',
            'schedule.thu' => 'required|numeric|min:0',
            'schedule.fri' => 'required|numeric|min:0',
            'schedule.sat' => 'required|numeric|min:0',
            'schedule.sun' => 'required|numeric|min:0',
            'target'       => 'required|numeric|min:0|max:20',
        ]);

        $subjects = $data['subjects'];
        $schedule = $data['schedule'];
        $target   = $data['target'];

        $today      = new \DateTime();
        $finals     = new \DateTime('2026-05-21');
        $dsDate     = new \DateTime('2026-03-30');
        $revDate    = new \DateTime('2026-05-18');
        $daysToFinals   = max(0, (int)$today->diff($finals)->days);
        $daysToDS       = max(0, (int)$today->diff($dsDate)->days);
        $daysToRevision = max(0, (int)$today->diff($revDate)->days);

        $weeklyHrs      = array_sum($schedule);
        $totalAvailable = round($weeklyHrs / 7 * $daysToFinals);

        $subjectAnalysis = [];
        foreach ($subjects as $s) {
            $hrs      = $this->calc->calcHoursNeeded($s);
            $reqExam  = $this->calc->calcRequiredExam($s, $target);
            $priority = $this->calc->priorityScore($s, $target);
            $grade    = $this->calc->calcGrade($s);

            $subjectAnalysis[] = [
                'id'                   => $s['id'],
                'name'                 => $s['name'],
                'coeff'                => $s['coeff'],
                'hoursNeeded'          => round($hrs, 1),
                'hoursStudied'         => $s['hoursStudied'] ?? 0,
                'requiredExamScore'    => round($reqExam, 2),
                'requiredExamFeasible' => $reqExam <= 20,
                'requiredExamSecured'  => $reqExam < 0,
                'currentGrade'         => $grade !== null ? round($grade, 2) : null,
                'priorityScore'        => round($priority, 2),
                'chaptersRemaining'    => max(0, $s['chapters'] - $s['chaptersCompleted']),
            ];
        }

        usort($subjectAnalysis, fn($a, $b) => $b['priorityScore'] <=> $a['priorityScore']);

        $totalHoursNeeded = array_sum(array_column($subjectAnalysis, 'hoursNeeded'));
        $dailyNeeded      = $daysToFinals > 0 ? $totalHoursNeeded / $daysToFinals : 0;

        $ws = $wt = 0;
        foreach ($subjects as $s) {
            $g   = $this->calc->calcGrade($s);
            $ws += ($g ?? $target) * $s['coeff'];
            $wt += $s['coeff'];
        }
        $projectedAvg = $wt > 0 ? $ws / $wt : 0;
        $currentAvg   = $this->calc->weightedAvg($subjects);

        return response()->json([
            'daysToDS'           => $daysToDS,
            'daysToFinals'       => $daysToFinals,
            'daysToRevision'     => $daysToRevision,
            'totalHoursNeeded'   => round($totalHoursNeeded, 1),
            'totalHoursAvailable'=> $totalAvailable,
            'hoursBalance'       => round($totalAvailable - $totalHoursNeeded, 1),
            'dailyHoursNeeded'   => round($dailyNeeded, 2),
            'weeklyHours'        => $weeklyHrs,
            'projectedAverage'   => round($projectedAvg, 2),
            'currentAverage'     => $currentAvg !== null ? round($currentAvg, 2) : null,
            'onTarget'           => $projectedAvg >= $target,
            'subjects'           => $subjectAnalysis,
        ]);
    }
}

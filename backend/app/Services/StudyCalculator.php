<?php

namespace App\Services;

class StudyCalculator
{
    const DIFF_MULT = [
        'easy'      => 0.60,
        'medium'    => 1.00,
        'hard'      => 1.45,
        'very_hard' => 1.90,
    ];

    const CONF_MULT = [
        'expert'  => 0.50,
        'good'    => 0.75,
        'neutral' => 1.00,
        'weak'    => 1.35,
        'lost'    => 1.80,
    ];

    const KEY_DATES = [
        'ds_start'       => '2026-03-30',
        'ds_end'         => '2026-04-04',
        'revision_start' => '2026-05-18',
        'finals_start'   => '2026-05-21',
        'finals_end'     => '2026-05-30',
    ];

    public function calcGrade(array $s): ?float
    {
        $ds   = $s['dsGrade']   ?? null;
        $cc   = $s['ccGrade']   ?? null;
        $exam = $s['examGrade'] ?? null;

        if ($s['hasDS'] && $s['hasCC']) {
            $ws = $wt = 0;
            if ($ds   !== null) { $ws += $ds;       $wt += 1; }
            if ($cc   !== null) { $ws += $cc;       $wt += 1; }
            if ($exam !== null) { $ws += $exam * 2; $wt += 2; }
            return $wt > 0 ? $ws / $wt : null;
        }

        if ($s['hasCC']) {
            $ws = $wt = 0;
            if ($cc   !== null) { $ws += $cc;       $wt += 1; }
            if ($exam !== null) { $ws += $exam * 2; $wt += 2; }
            return $wt > 0 ? $ws / $wt : null;
        }

        return $exam;
    }

    public function calcHoursNeeded(array $s): float
    {
        $diff      = self::DIFF_MULT[$s['difficulty']] ?? 1.0;
        $conf      = self::CONF_MULT[$s['confidence']] ?? 1.0;
        $remaining = max(0, $s['chapters'] - $s['chaptersCompleted']);
        return $remaining * 2.5 * $diff * $conf;
    }

    public function calcRequiredExam(array $s, float $target): float
    {
        $ds = $s['dsGrade'] ?? $target;
        $cc = $s['ccGrade'] ?? $target;

        if ($s['hasDS'] && $s['hasCC']) {
            return (4 * $target - $ds - $cc) / 2;
        }
        if ($s['hasCC']) {
            return (3 * $target - $cc) / 2;
        }
        return $target;
    }

    public function weightedAvg(array $subjects): ?float
    {
        $ws = $wt = 0;
        foreach ($subjects as $s) {
            $g = $this->calcGrade($s);
            if ($g !== null) {
                $ws += $g * $s['coeff'];
                $wt += $s['coeff'];
            }
        }
        return $wt > 0 ? $ws / $wt : null;
    }

    public function priorityScore(array $s, float $target): float
    {
        $g       = $this->calcGrade($s);
        $current = $g ?? 0;
        $gap     = max(0, $target - $current);
        return $gap * $s['coeff'] * (self::CONF_MULT[$s['confidence']] ?? 1.0);
    }
}

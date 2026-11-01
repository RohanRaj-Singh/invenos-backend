<?php

namespace App\Domains\Reports\Support;

use Carbon\CarbonImmutable;

final class DateRangeResolver
{
    public const DEFAULT = 'thisMonth';

    public const PRESETS = [
        'today', 'yesterday', 'thisWeek', 'lastWeek',
        'last7', 'last30', 'last90', 'last365',
        'thisMonth', 'lastMonth', 'thisQuarter', 'lastQuarter',
        'thisYear', 'custom',
    ];

    /**
     * @return array{preset:string, from:string, to:string}
     */
    public static function resolve(?string $preset, ?string $from, ?string $to, ?string $timezone = null): array
    {
        $tz = $timezone ?: self::businessTimezone();
        $now = CarbonImmutable::now($tz);

        if ($from || $to) {
            return [
                'preset' => 'custom',
                'from' => self::normalise($from, $tz) ?? $now->startOfMonth()->toDateString(),
                'to' => self::normalise($to, $tz) ?? $now->toDateString(),
            ];
        }

        $preset = in_array($preset, self::PRESETS, true) ? $preset : self::DEFAULT;

        if ($preset === 'custom') {
            return [
                'preset' => 'custom',
                'from' => $now->startOfMonth()->toDateString(),
                'to' => $now->toDateString(),
            ];
        }

        [$start, $end] = match ($preset) {
            'today' => [$now->startOfDay(), $now],
            'yesterday' => [$now->subDay()->startOfDay(), $now->subDay()->endOfDay()],
            'thisWeek' => [$now->startOfWeek(CarbonImmutable::MONDAY), $now],
            'lastWeek' => [
                $now->subWeek()->startOfWeek(CarbonImmutable::MONDAY),
                $now->subWeek()->endOfWeek(CarbonImmutable::SUNDAY),
            ],
            'last7' => [$now->subDays(6)->startOfDay(), $now],
            'last30' => [$now->subDays(29)->startOfDay(), $now],
            'last90' => [$now->subDays(89)->startOfDay(), $now],
            'last365' => [$now->subDays(364)->startOfDay(), $now],
            'thisMonth' => [$now->startOfMonth(), $now],
            'lastMonth' => [
                $now->subMonthNoOverflow()->startOfMonth(),
                $now->subMonthNoOverflow()->endOfMonth(),
            ],
            'thisQuarter' => [$now->startOfQuarter(), $now],
            'lastQuarter' => [
                $now->subQuarterNoOverflow()->startOfQuarter(),
                $now->subQuarterNoOverflow()->endOfQuarter(),
            ],
            'thisYear' => [$now->startOfYear(), $now],
        };

        return [
            'preset' => $preset,
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
        ];
    }

    public static function businessTimezone(): string
    {
        try {
            $tz = app(\App\Domains\Settings\Services\SettingService::class)->get()['business']['timezone'] ?? null;
        } catch (\Throwable) {
            $tz = null;
        }

        return $tz ?: (string) config('app.timezone', 'UTC');
    }

    private static function normalise(?string $date, string $tz): ?string
    {
        if (! $date) {
            return null;
        }

        try {
            return CarbonImmutable::parse($date, $tz)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}

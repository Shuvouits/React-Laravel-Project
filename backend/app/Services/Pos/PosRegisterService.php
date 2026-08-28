<?php

namespace App\Services\Pos;

use App\Models\PosRegisterSession;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosRegisterService
{
    public function current(
        array $context
    ): ?array {
        $session = PosRegisterSession::query()
            ->with([
                'location',
                'cashier',
            ])
            ->where(
                'location_id',
                $context['location_id']
            )
            ->where(
                'cashier_id',
                $context['user_id']
            )
            ->where(
                'status',
                'open'
            );

        $this->applyOwnerScope(
            $session,
            $context
        );

        $session = $session
            ->latest('opened_at')
            ->first();

        return $session
            ? $this->sessionData($session)
            : null;
    }

    public function open(
        array $context,
        array $data
    ): array {
        return DB::transaction(function () use (
            $context,
            $data
        ) {
            $existingQuery =
                PosRegisterSession::query()
                    ->where(
                        'location_id',
                        $context['location_id']
                    )
                    ->where(
                        'cashier_id',
                        $context['user_id']
                    )
                    ->where(
                        'status',
                        'open'
                    )
                    ->lockForUpdate();

            $this->applyOwnerScope(
                $existingQuery,
                $context
            );

            $existingSession =
                $existingQuery->first();

            if ($existingSession) {
                throw ValidationException::withMessages([
                    'register' => [
                        'You already have an open register at this location.',
                    ],
                ]);
            }

            $session =
                PosRegisterSession::create([
                    'vendor_id' =>
                        $context['vendor_id'],

                    'location_id' =>
                        $context['location_id'],

                    'cashier_id' =>
                        $context['user_id'],

                    'session_number' =>
                        $this->generateSessionNumber(),

                    'status' => 'open',

                    'opening_balance' =>
                        $data['opening_balance']
                        ?? 0,

                    'cash_sales' => 0,
                    'cash_refunds' => 0,

                    'opening_note' =>
                        $data['opening_note']
                        ?? null,

                    'opened_at' => now(),
                ]);

            $session->load([
                'location',
                'cashier',
            ]);

            return $this->sessionData(
                $session
            );
        });
    }

    public function close(
        array $context,
        int $sessionId,
        array $data
    ): array {
        return DB::transaction(function () use (
            $context,
            $sessionId,
            $data
        ) {
            $sessionQuery =
                PosRegisterSession::query()
                    ->where('id', $sessionId)
                    ->where(
                        'location_id',
                        $context['location_id']
                    )
                    ->where(
                        'cashier_id',
                        $context['user_id']
                    )
                    ->where(
                        'status',
                        'open'
                    )
                    ->lockForUpdate();

            $this->applyOwnerScope(
                $sessionQuery,
                $context
            );

            $session = $sessionQuery->first();

            if (!$session) {
                throw ValidationException::withMessages([
                    'register' => [
                        'An open register session was not found.',
                    ],
                ]);
            }

            $cashSales =
                $this->calculateCashSales(
                    $session->id
                );

            $cashRefunds =
                $this->calculateCashRefunds(
                    $session->id
                );

            $expectedBalance =
                (float) $session->opening_balance
                + $cashSales
                - $cashRefunds;

            $closingBalance =
                (float) $data['closing_balance'];

            $balanceDifference =
                $closingBalance
                - $expectedBalance;

            $session->update([
                'status' => 'closed',

                'cash_sales' =>
                    $cashSales,

                'cash_refunds' =>
                    $cashRefunds,

                'expected_balance' =>
                    $expectedBalance,

                'closing_balance' =>
                    $closingBalance,

                'balance_difference' =>
                    $balanceDifference,

                'closing_note' =>
                    $data['closing_note']
                    ?? null,

                'closed_at' => now(),
            ]);

            $session->load([
                'location',
                'cashier',
            ]);

            return $this->sessionData(
                $session
            );
        });
    }

   
    private function calculateCashSales(
    int $sessionId
): float {
    return round(
        (float) DB::table('pos_payments')
            ->join(
                'pos_sales',
                'pos_sales.id',
                '=',
                'pos_payments.pos_sale_id'
            )
            ->where(
                'pos_sales.register_session_id',
                $sessionId
            )
            ->whereIn(
                'pos_sales.status',
                [
                    'completed',
                    'refunded',
                ]
            )
            ->whereIn(
                'pos_payments.payment_method',
                [
                    'cash',
                    'pos_cash',
                ]
            )
            ->whereIn(
                'pos_payments.status',
                [
                    'succeeded',
                    'refunded',
                ]
            )
            ->sum('pos_payments.amount'),
        2
    );
}




  private function calculateCashRefunds(
    int $sessionId
): float {
    return round(
        (float) DB::table('pos_refunds')
            ->where(
                'register_session_id',
                $sessionId
            )
            ->where(
                'status',
                'completed'
            )
            ->whereIn(
                'payment_method',
                [
                    'cash',
                    'pos_cash',
                ]
            )
            ->sum('total'),
        2
    );
}

    private function generateSessionNumber(): string
    {
        do {
            $sessionNumber =
                'POSREG-'
                . now()->format('Ymd')
                . '-'
                . strtoupper(
                    Str::random(6)
                );
        } while (
            PosRegisterSession::query()
                ->where(
                    'session_number',
                    $sessionNumber
                )
                ->exists()
        );

        return $sessionNumber;
    }

    private function applyOwnerScope(
        $query,
        array $context
    ): void {
        if ($context['vendor_id'] === null) {
            $query->whereNull('vendor_id');

            return;
        }

        $query->where(
            'vendor_id',
            $context['vendor_id']
        );
    }



    private function sessionData(
    PosRegisterSession $session
): array {
    $currentExpectedBalance = round(
        (float) $session->opening_balance
        + (float) $session->cash_sales
        - (float) $session->cash_refunds,
        2
    );

    $expectedBalance = $session->expected_balance !== null
        ? (float) $session->expected_balance
        : $currentExpectedBalance;

    return [
        'id' => $session->id,

        'session_number' => $session->session_number,

        'status' => $session->status,

        'vendor_id' => $session->vendor_id,

        'location_id' => $session->location_id,

        'cashier_id' => $session->cashier_id,

        'opening_balance' => (float) $session->opening_balance,

        'cash_sales' => (float) $session->cash_sales,

        'cash_refunds' => (float) $session->cash_refunds,

        'expected_balance' => $expectedBalance,

        'closing_balance' => $session->closing_balance !== null
            ? (float) $session->closing_balance
            : null,

        'balance_difference' => $session->balance_difference !== null
            ? (float) $session->balance_difference
            : null,

        'opening_note' => $session->opening_note,

        'closing_note' => $session->closing_note,

        'opened_at' => $session->opened_at,

        'closed_at' => $session->closed_at,

        'location' => $session->location
            ? [
                'id' => $session->location->id,
                'name' => $session->location->name,
                'code' => $session->location->code,
            ]
            : null,

        'cashier' => $session->cashier
            ? [
                'id' => $session->cashier->id,
                'name' => $session->cashier->name,
                'email' => $session->cashier->email,
            ]
            : null,
    ];
}

   
}
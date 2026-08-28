<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminExpense;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminExpenseController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | EXPENSE LIST
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:255'],

            'category' => [
                'nullable',
                'string',
                'max:100',
            ],

            'paid_from' => [
                'nullable',
                'string',
                'max:100',
            ],

            'book' => [
                'nullable',
                Rule::in([
                    'both',
                    'own_store',
                    'marketplace',
                ]),
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'sort' => [
                'nullable',
                Rule::in([
                    'newest',
                    'oldest',
                    'amount_high',
                    'amount_low',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = AdminExpense::query()
            ->with([
                'creator:id,name,email',
            ]);

        /*
        |--------------------------------------------------------------------------
        | BOOK FILTER
        |--------------------------------------------------------------------------
        */

        if (
            $request->filled('book')
            && $request->book !== 'both'
        ) {
            $query->where(
                'book',
                $request->book
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim(
                $request->search
            );

            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where(
                        'description',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'paid_to',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'category',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'note',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CATEGORY FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category')) {
            $query->where(
                'category',
                $request->category
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PAID FROM FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('paid_from')) {
            $query->where(
                'paid_from',
                $request->paid_from
            );
        }

        /*
        |--------------------------------------------------------------------------
        | DATE FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('date_from')) {
            $query->whereDate(
                'expense_date',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'expense_date',
                '<=',
                $request->date_to
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        $this->applySorting(
            $query,
            $request->input(
                'sort',
                'newest'
            )
        );

        $expenses = $query->paginate(
            $request->integer(
                'per_page',
                20
            )
        );

        /*
        |--------------------------------------------------------------------------
        | TOTAL
        |--------------------------------------------------------------------------
        */

        $totalAmount = (clone $query)->sum(
            'amount'
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Expenses fetched successfully.',

            'summary' => [
                'total_amount' =>
                    round((float) $totalAmount, 2),

                'currency' => 'USD',
            ],

            'data' => $expenses,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STORE EXPENSE
    |--------------------------------------------------------------------------
    */

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateExpense(
            $request
        );

        $validated['created_by'] =
            $request->user()->id;

        $validated['currency'] =
            strtoupper(
                $validated['currency'] ?? 'USD'
            );

        $validated['repeats'] =
            $request->boolean('repeats');

        /*
        |--------------------------------------------------------------------------
        | REPEAT SETTINGS
        |--------------------------------------------------------------------------
        */

        if (!$validated['repeats']) {
            $validated['repeat_frequency'] = null;
            $validated['next_repeat_date'] = null;
        } elseif (
            empty($validated['next_repeat_date'])
            && !empty($validated['repeat_frequency'])
        ) {
            $validated['next_repeat_date'] =
                $this->calculateNextRepeatDate(
                    $validated['expense_date'],
                    $validated['repeat_frequency']
                );
        }

        /*
        |--------------------------------------------------------------------------
        | RECEIPT UPLOAD
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('receipt')) {
            $validated['receipt_path'] =
                $this->uploadReceipt(
                    $request->file('receipt')
                );
        }

        unset($validated['receipt']);

        $expense = AdminExpense::create(
            $validated
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Expense recorded successfully.',

            'data' => $expense->load(
                'creator:id,name,email'
            ),
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW EXPENSE
    |--------------------------------------------------------------------------
    */

    public function show(
        AdminExpense $adminExpense
    ): JsonResponse {
        return response()->json([
            'success' => true,

            'data' => $adminExpense->load(
                'creator:id,name,email'
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE EXPENSE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        AdminExpense $adminExpense
    ): JsonResponse {
        $validated = $this->validateExpense(
            $request
        );

        $validated['currency'] =
            strtoupper(
                $validated['currency'] ?? 'USD'
            );

        $validated['repeats'] =
            $request->boolean('repeats');

        /*
        |--------------------------------------------------------------------------
        | REPEAT SETTINGS
        |--------------------------------------------------------------------------
        */

        if (!$validated['repeats']) {
            $validated['repeat_frequency'] = null;
            $validated['next_repeat_date'] = null;
        } elseif (
            empty($validated['next_repeat_date'])
            && !empty($validated['repeat_frequency'])
        ) {
            $validated['next_repeat_date'] =
                $this->calculateNextRepeatDate(
                    $validated['expense_date'],
                    $validated['repeat_frequency']
                );
        }

        /*
        |--------------------------------------------------------------------------
        | REPLACE RECEIPT
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('receipt')) {
            $this->deleteStoredReceipt(
                $adminExpense->receipt_path
            );

            $validated['receipt_path'] =
                $this->uploadReceipt(
                    $request->file('receipt')
                );
        }

        unset($validated['receipt']);

        $adminExpense->update(
            $validated
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Expense updated successfully.',

            'data' => $adminExpense
                ->fresh()
                ->load('creator:id,name,email'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE EXPENSE
    |--------------------------------------------------------------------------
    */

    public function destroy(
        AdminExpense $adminExpense
    ): JsonResponse {
        $this->deleteStoredReceipt(
            $adminExpense->receipt_path
        );

        $adminExpense->delete();

        return response()->json([
            'success' => true,

            'message' =>
                'Expense deleted successfully.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE RECEIPT ONLY
    |--------------------------------------------------------------------------
    */

    public function deleteReceipt(
        AdminExpense $adminExpense
    ): JsonResponse {
        if (!$adminExpense->receipt_path) {
            return response()->json([
                'success' => true,

                'message' =>
                    'No receipt found.',
            ]);
        }

        $this->deleteStoredReceipt(
            $adminExpense->receipt_path
        );

        $adminExpense->update([
            'receipt_path' => null,
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'Receipt deleted successfully.',

            'data' => $adminExpense->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD EXPENSE CSV
    |--------------------------------------------------------------------------
    */

    public function download(
        Request $request
    ): StreamedResponse {
        $request->validate([
            'book' => [
                'nullable',
                Rule::in([
                    'both',
                    'own_store',
                    'marketplace',
                ]),
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'category' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $query = AdminExpense::query()
            ->orderByDesc('expense_date')
            ->orderByDesc('id');

        if (
            $request->filled('book')
            && $request->book !== 'both'
        ) {
            $query->where(
                'book',
                $request->book
            );
        }

        if ($request->filled('category')) {
            $query->where(
                'category',
                $request->category
            );
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'expense_date',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'expense_date',
                '<=',
                $request->date_to
            );
        }

        $fileName =
            'admin-expenses-'
            . now()->format('Y-m-d-His')
            . '.csv';

        return response()->streamDownload(
            function () use ($query) {
                $output = fopen(
                    'php://output',
                    'w'
                );

                /*
                |--------------------------------------------------------------------------
                | CSV HEADER
                |--------------------------------------------------------------------------
                */

                fputcsv($output, [
                    'Date',
                    'Description',
                    'Category',
                    'Paid From',
                    'Paid To',
                    'Book',
                    'Amount',
                    'Currency',
                    'Repeats',
                    'Repeat Frequency',
                    'Next Repeat Date',
                    'Receipt',
                    'Note',
                ]);

                /*
                |--------------------------------------------------------------------------
                | CSV ROWS
                |--------------------------------------------------------------------------
                */

                $query->chunkById(
                    500,
                    function ($expenses) use ($output) {
                        foreach ($expenses as $expense) {
                            fputcsv($output, [
                                optional(
                                    $expense->expense_date
                                )->format('Y-m-d'),

                                $expense->description,

                                $expense->category,

                                $expense->paid_from,

                                $expense->paid_to,

                                $expense->book,

                                $expense->amount,

                                $expense->currency,

                                $expense->repeats
                                    ? 'Yes'
                                    : 'No',

                                $expense
                                    ->repeat_frequency,

                                optional(
                                    $expense
                                        ->next_repeat_date
                                )->format('Y-m-d'),

                                $expense->receipt_path
                                    ? asset(
                                        $expense
                                            ->receipt_path
                                    )
                                    : null,

                                $expense->note,
                            ]);
                        }
                    }
                );

                fclose($output);
            },
            $fileName,
            [
                'Content-Type' =>
                    'text/csv; charset=UTF-8',

                'Cache-Control' =>
                    'no-store, no-cache',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    private function validateExpense(
        Request $request
    ): array {
        return $request->validate([
            'expense_date' => [
                'required',
                'date',
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0',
                'max:999999999999.99',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
            ],

            'description' => [
                'required',
                'string',
                'max:255',
            ],

            'category' => [
                'required',
                Rule::in([
                    'rent',
                    'salary',
                    'advertising',
                    'shipping',
                    'software',
                    'utilities',
                    'tax',
                    'maintenance',
                    'inventory',
                    'other',
                ]),
            ],

            'paid_from' => [
                'required',
                Rule::in([
                    'bank',
                    'cash',
                    'gateway',
                    'card',
                    'other',
                ]),
            ],

            'paid_to' => [
                'nullable',
                'string',
                'max:255',
            ],

            'book' => [
                'required',
                Rule::in([
                    'own_store',
                    'marketplace',
                ]),
            ],

            'receipt' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf',
                'max:5120',
            ],

            'repeats' => [
                'nullable',
                'boolean',
            ],

            'repeat_frequency' => [
                'nullable',
                'required_if:repeats,1',
                Rule::in([
                    'weekly',
                    'monthly',
                    'quarterly',
                    'yearly',
                ]),
            ],

            'next_repeat_date' => [
                'nullable',
                'date',
                'after:expense_date',
            ],

            'note' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | APPLY SORTING
    |--------------------------------------------------------------------------
    */

    private function applySorting(
        Builder $query,
        string $sort
    ): void {
        switch ($sort) {
            case 'oldest':
                $query
                    ->orderBy('expense_date')
                    ->orderBy('id');

                break;

            case 'amount_high':
                $query
                    ->orderByDesc('amount')
                    ->orderByDesc('expense_date');

                break;

            case 'amount_low':
                $query
                    ->orderBy('amount')
                    ->orderByDesc('expense_date');

                break;

            default:
                $query
                    ->orderByDesc('expense_date')
                    ->orderByDesc('id');

                break;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATE NEXT REPEAT DATE
    |--------------------------------------------------------------------------
    */

    private function calculateNextRepeatDate(
        string $expenseDate,
        string $frequency
    ): string {
        $date = Carbon::parse(
            $expenseDate
        );

        switch ($frequency) {
            case 'weekly':
                return $date
                    ->addWeek()
                    ->toDateString();

            case 'monthly':
                return $date
                    ->addMonthNoOverflow()
                    ->toDateString();

            case 'quarterly':
                return $date
                    ->addMonthsNoOverflow(3)
                    ->toDateString();

            case 'yearly':
                return $date
                    ->addYearNoOverflow()
                    ->toDateString();

            default:
                return $date->toDateString();
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPLOAD RECEIPT
    |--------------------------------------------------------------------------
    */

    private function uploadReceipt(
        $receipt
    ): string {
        $uploadPath = public_path(
            'uploads/admin-expenses/receipts'
        );

        /*
        |--------------------------------------------------------------------------
        | CREATE DIRECTORY
        |--------------------------------------------------------------------------
        */

        if (!File::exists($uploadPath)) {
            File::makeDirectory(
                $uploadPath,
                0755,
                true
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FILE NAME
        |--------------------------------------------------------------------------
        */

        $extension = strtolower(
            $receipt->getClientOriginalExtension()
        );

        $fileName =
            time()
            . '-'
            . Str::random(16)
            . '.'
            . $extension;

        /*
        |--------------------------------------------------------------------------
        | MOVE FILE
        |--------------------------------------------------------------------------
        */

        $receipt->move(
            $uploadPath,
            $fileName
        );

        return
            'uploads/admin-expenses/receipts/'
            . $fileName;
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE STORED RECEIPT
    |--------------------------------------------------------------------------
    */

    private function deleteStoredReceipt(
        ?string $receiptPath
    ): void {
        if (!$receiptPath) {
            return;
        }

        $fullPath = public_path(
            $receiptPath
        );

        if (File::exists($fullPath)) {
            File::delete(
                $fullPath
            );
        }
    }
}

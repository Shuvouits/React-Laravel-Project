<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\VendorExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VendorExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $perPage = min(
            max(
                (int) $request->input('per_page', 20),
                1
            ),
            100
        );

        $query = VendorExpense::query()
            ->where('vendor_id', $vendor->id);

        if ($request->filled('category')) {
            $query->where(
                'category',
                $request->category
            );
        }

        if ($request->filled('search')) {
            $search = trim(
                (string) $request->search
            );

            $query->where(function ($builder) use ($search) {
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
                    );
            });
        }

        $expenses = $query
            ->latest('expense_date')
            ->latest('id')
            ->paginate($perPage);

        $total = VendorExpense::query()
            ->where('vendor_id', $vendor->id)
            ->sum('amount');

        return response()->json([
            'expenses' => $expenses,
            'summary' => [
                'total_expenses' => round(
                    (float) $total,
                    2
                ),
                'currency' => 'USD',
            ],
            'categories' => $this->categories(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $validated = $this->validateExpense(
            $request
        );

        $validated['vendor_id'] = $vendor->id;
        $validated['currency'] = 'USD';

        $expense = VendorExpense::create(
            $validated
        );

        return response()->json([
            'message' => 'Expense recorded successfully.',
            'expense' => $expense,
        ], 201);
    }

    public function show(
        Request $request,
        int $id
    ): JsonResponse {
        $expense = $this->findExpense(
            $request,
            $id
        );

        return response()->json([
            'expense' => $expense,
        ]);
    }

    public function update(
        Request $request,
        int $id
    ): JsonResponse {
        $expense = $this->findExpense(
            $request,
            $id
        );

        $validated = $this->validateExpense(
            $request
        );

        $validated['currency'] = 'USD';

        $expense->update($validated);

        return response()->json([
            'message' => 'Expense updated successfully.',
            'expense' => $expense->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {
        $expense = $this->findExpense(
            $request,
            $id
        );

        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully.',
        ]);
    }

    public function download(
        Request $request
    ): StreamedResponse {
        $vendor = $this->vendor($request);

        $expenses = VendorExpense::query()
            ->where('vendor_id', $vendor->id)
            ->latest('expense_date')
            ->get();

        $fileName = sprintf(
            'vendor-expenses-%s.csv',
            now()->format('Y-m-d')
        );

        return response()->streamDownload(
            function () use ($expenses) {
                $file = fopen(
                    'php://output',
                    'w'
                );

                fputcsv($file, [
                    'Date',
                    'Description',
                    'Category',
                    'Paid To',
                    'Amount',
                    'Currency',
                ]);

                foreach ($expenses as $expense) {
                    fputcsv($file, [
                        $expense->expense_date
                            ->format('Y-m-d'),

                        $expense->description,
                        $expense->category,
                        $expense->paid_to,
                        $expense->amount,
                        $expense->currency,
                    ]);
                }

                fclose($file);
            },
            $fileName,
            [
                'Content-Type' =>
                    'text/csv; charset=UTF-8',
            ]
        );
    }

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
            ],
            'description' => [
                'required',
                'string',
                'max:255',
            ],
            'category' => [
                'required',
                Rule::in(
                    array_keys(
                        $this->categories()
                    )
                ),
            ],
            'paid_to' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);
    }

    private function findExpense(
        Request $request,
        int $id
    ): VendorExpense {
        $vendor = $this->vendor($request);

        return VendorExpense::query()
            ->where('vendor_id', $vendor->id)
            ->findOrFail($id);
    }

    private function vendor(
        Request $request
    ): Vendor {
        return Vendor::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->firstOrFail();
    }

    private function categories(): array
    {
        return [
            'rent' => 'Rent',
            'salaries' => 'Salaries',
            'advertising' => 'Advertising',
            'shipping' => 'Shipping',
            'supplies' => 'Supplies',
            'software' => 'Software',
            'utilities' => 'Utilities',
            'taxes' => 'Taxes',
            'professional_services' =>
                'Professional Services',
            'other' => 'Other',
        ];
    }
}

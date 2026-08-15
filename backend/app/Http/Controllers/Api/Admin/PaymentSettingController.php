<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentSettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = PaymentSetting::query()
            ->orderBy('sort_order')
            ->get();

        $gateways = $settings->map(function ($setting) {
            return $this->formatSetting($setting);
        });

        return response()->json([
            'success' => true,
            'active_count' => $settings
                ->where('is_enabled', true)
                ->count(),
            'gateways' => $gateways->values(),
        ]);
    }

    public function update(
        Request $request,
        string $gateway
    ): JsonResponse {
        $definitions = $this->gatewayDefinitions();

        if (!isset($definitions[$gateway])) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported payment gateway.',
            ], 404);
        }

        $definition = $definitions[$gateway];

        $rules = [
            'is_enabled' => [
                'sometimes',
                'boolean',
            ],

            'mode' => [
                'sometimes',
                'nullable',
                Rule::in($definition['modes']),
            ],
        ];

        foreach ($definition['fields'] as $field) {
            $rules[$field] = [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ];
        }

        $validated = $request->validate($rules);

        $setting = PaymentSetting::where(
            'gateway',
            $gateway
        )->firstOrFail();

        $config = $setting->config ?? [];

        foreach ($definition['fields'] as $field) {
            if (!array_key_exists($field, $validated)) {
                continue;
            }

            $value = $validated[$field];

            if (
                $value === null ||
                trim($value) === ''
            ) {
                continue;
            }

            $config[$field] = trim($value);
        }

        if (array_key_exists('is_enabled', $validated)) {
            $setting->is_enabled =
                $validated['is_enabled'];
        }

        if (array_key_exists('mode', $validated)) {
            $setting->mode =
                $validated['mode'];
        }

        $setting->config = $config;

        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment settings updated successfully.',
            'gateway' => $this->formatSetting($setting),
        ]);
    }

    private function formatSetting(
        PaymentSetting $setting
    ): array {
        $definitions = $this->gatewayDefinitions();

        $definition =
            $definitions[$setting->gateway] ?? null;

        if (!$definition) {
            return [
                'id' => $setting->id,
                'gateway' => $setting->gateway,
                'is_enabled' => $setting->is_enabled,
                'mode' => $setting->mode,
            ];
        }

        $config = $setting->config ?? [];

        $fields = [];

        foreach ($definition['fields'] as $field) {
            $value = $config[$field] ?? '';

            $fields[$field] = [
                'saved' => !empty($value),
                'value' => $value,
            ];
        }

        $configured = true;

        foreach ($definition['required'] as $field) {
            if (empty($config[$field])) {
                $configured = false;
                break;
            }
        }

        return [
            'id' => $setting->id,
            'gateway' => $setting->gateway,
            'name' => $definition['name'],
            'description' => $definition['description'],
            'is_enabled' => $setting->is_enabled,
            'mode' => $setting->mode,
            'configured' => $configured,
            'fields' => $fields,
        ];
    }

   
    private function gatewayDefinitions(): array
{
    return [
        'stripe' => [
            'name' => 'Stripe',
            'description' => 'Accept credit & debit cards globally',

            'modes' => [
                'test',
                'live',
            ],

            'fields' => [
                'publishable_key',
                'secret_key',
                'webhook_secret',
            ],

            'required' => [
                'publishable_key',
                'secret_key',
            ],
        ],

        'paypal' => [
            'name' => 'PayPal',
            'description' => 'Trusted global checkout & wallet',

            'modes' => [
                'sandbox',
                'live',
            ],

            'fields' => [
                'client_id',
                'client_secret',
                'webhook_id',
            ],

            'required' => [
                'client_id',
                'client_secret',
            ],
        ],

        'sslcommerz' => [
            'name' => 'SSLCommerz',
            'description' => 'Accept cards and mobile banking payments',

            'modes' => [
                'sandbox',
                'live',
            ],

            'fields' => [
                'store_id',
                'store_password',
            ],

            'required' => [
                'store_id',
                'store_password',
            ],
        ],
    ];
}


}
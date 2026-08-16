<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Services\Payments\StripePaymentService;
use Illuminate\Http\Request;
use Throwable;

class StripePaymentController extends Controller
{
    public function success(Request $request, StripePaymentService $stripePaymentService)
    {
        $sessionId = $request->query('session_id');

        $frontendUrl = rtrim(
            config('app.frontend_url', 'http://localhost:5173'),
            '/'
        );

        if (!$sessionId) {
            return redirect()->away(
                $frontendUrl
                . '/payment/error'
                . '?provider=stripe'
                . '&reason=missing_session'
            );
        }

        try {
            $order = $stripePaymentService->verifyCheckout($sessionId);

            return redirect()->away(
                $frontendUrl
                . '/payment/success'
                . '?provider=stripe'
                . '&verified=1'
                . '&session_id=' . urlencode($sessionId)
                . '&order=' . $order->id
            );
        } catch (Throwable $error) {
            report($error);

            return redirect()->away(
                $frontendUrl
                . '/payment/error'
                . '?provider=stripe'
                . '&reason=verification_failed'
            );
        }
    }
}
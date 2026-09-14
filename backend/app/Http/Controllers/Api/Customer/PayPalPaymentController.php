<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Services\Payments\PayPalPaymentService;
use App\Services\VendorFinanceService;
use Illuminate\Http\Request;
use Throwable;

class PayPalPaymentController extends Controller
{
    public function success(
        Request $request,
        PayPalPaymentService $paypalPaymentService,
        VendorFinanceService $vendorFinanceService
    ) {
        /*
         * PayPal sends its order ID
         * back as "token".
         */
        $paypalOrderId =
            $request->query(
                'token'
            );

        $frontendUrl =
            rtrim(
                config(
                    'app.frontend_url',
                    'http://localhost:5173'
                ),
                '/'
            );

        if (
            ! $paypalOrderId
        ) {
            return redirect()->away(
                $frontendUrl
                . '/payment/error'
                . '?provider=paypal'
                . '&reason=missing_order'
            );
        }

        try {
            $order =
                $paypalPaymentService
                    ->captureCheckout(
                        $paypalOrderId
                    );

            /*
             * Same finance process already
             * used by Stripe.
             */
            $vendorFinanceService
                ->recordPaidOrder(
                    $order
                );

            return redirect()->away(
                $frontendUrl
                . '/payment/success'
                . '?provider=paypal'
                . '&verified=1'
                . '&paypal_order_id='
                . urlencode(
                    $paypalOrderId
                )
                . '&order='
                . $order->id
            );
        } catch (Throwable $error) {
            report(
                $error
            );

            return redirect()->away(
                $frontendUrl
                . '/payment/error'
                . '?provider=paypal'
                . '&reason=capture_failed'
            );
        }
    }

    public function cancel(
        Request $request,
        PayPalPaymentService $paypalPaymentService
    ) {
        $transactionId =
            $request->integer(
                'transaction'
            );

        $frontendUrl =
            rtrim(
                config(
                    'app.frontend_url',
                    'http://localhost:5173'
                ),
                '/'
            );

        $order = null;

        if (
            $transactionId
        ) {
            try {
                $order =
                    $paypalPaymentService
                        ->cancelTransaction(
                            $transactionId
                        );
            } catch (Throwable $error) {
                report(
                    $error
                );
            }
        }

        $url =
            $frontendUrl
            . '/payment/cancelled'
            . '?provider=paypal';

        if (
            $order
        ) {
            $url .=
                '&order='
                . $order->id;
        }

        return redirect()->away(
            $url
        );
    }
}

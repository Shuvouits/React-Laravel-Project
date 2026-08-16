<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>
        Invoice {{ $order->order_no }}
    </title>

    <style>
        @page {
            margin: 32px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #222222;
            background: #ffffff;
        }

        .invoice {
            width: 100%;
        }

        .header {
            width: 100%;
            margin-bottom: 28px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
        }

        .brand {
            font-size: 25px;
            font-weight: bold;
            color: #2467d5;
        }

        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            text-align: right;
            color: #171717;
        }

        .invoice-meta {
            margin-top: 7px;
            line-height: 1.7;
            text-align: right;
            color: #666666;
        }

        .divider {
            border-top: 1px solid #dddddd;
            margin-bottom: 25px;
        }

        .info-table {
            width: 100%;
            margin-bottom: 28px;
            border-collapse: collapse;
        }

        .info-table td {
            width: 50%;
            vertical-align: top;
        }

        .info-table td:first-child {
            padding-right: 20px;
        }

        .section-label {
            margin-bottom: 8px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #777777;
        }

        .info-title {
            margin-bottom: 5px;
            font-size: 14px;
            font-weight: bold;
            color: #222222;
        }

        .info-text {
            line-height: 1.7;
            color: #555555;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
        }

        .items-table th {
            padding: 11px 10px;
            border-bottom: 1px solid #dddddd;
            background: #f7f8fa;
            font-size: 11px;
            text-align: left;
            color: #555555;
        }

        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #eeeeee;
            vertical-align: top;
        }

        .text-right {
            text-align: right !important;
        }

        .product-name {
            font-weight: bold;
            color: #222222;
        }

        .product-meta {
            margin-top: 4px;
            font-size: 10px;
            color: #777777;
        }

        .summary-wrapper {
            width: 100%;
            margin-top: 20px;
        }

        .summary-table {
            width: 310px;
            margin-left: auto;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 6px 0;
        }

        .summary-label {
            color: #666666;
        }

        .summary-value {
            text-align: right;
            font-weight: bold;
            color: #222222;
        }

        .summary-total td {
            padding-top: 11px;
            border-top: 1px solid #cccccc;
            font-size: 16px;
            font-weight: bold;
        }

        .payment-box {
            margin-top: 30px;
            padding: 14px 16px;
            border: 1px solid #dddddd;
            border-radius: 6px;
            background: #fafafa;
        }

        .payment-table {
            width: 100%;
            border-collapse: collapse;
        }

        .payment-table td {
            padding: 4px 0;
        }

        .payment-label {
            color: #777777;
        }

        .payment-value {
            text-align: right;
            font-weight: bold;
        }

        .status-paid {
            color: #15935a;
        }

        .status-pending {
            color: #b76b00;
        }

        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #dddddd;
            text-align: center;
            font-size: 10px;
            line-height: 1.7;
            color: #888888;
        }
    </style>
</head>

<body>

<div class="invoice">

    <div class="header">

        <table class="header-table">

            <tr>

                <td>
                    <div class="brand">
                        Storify
                    </div>
                </td>

                <td>
                    <div class="invoice-title">
                        INVOICE
                    </div>

                    <div class="invoice-meta">
                        Invoice: {{ $order->order_no }}
                        <br>

                        Date:
                        {{
                            optional(
                                $order->placed_at ??
                                $order->created_at
                            )->format('M d, Y')
                        }}
                    </div>
                </td>

            </tr>

        </table>

    </div>

    <div class="divider"></div>

    <table class="info-table">

        <tr>

            <td>

                <div class="section-label">
                    Bill To
                </div>

                @php
                    $billing =
                        $order->billingAddress;
                @endphp

                @if($billing)

                    <div class="info-title">
                        {{ $billing->first_name }}
                        {{ $billing->last_name }}
                    </div>

                    <div class="info-text">
                        {{ $billing->address_line1 }}

                        @if($billing->address_line2)
                            <br>
                            {{ $billing->address_line2 }}
                        @endif

                        <br>

                        {{ $billing->city }}

                        @if($billing->state)
                            , {{ $billing->state }}
                        @endif

                        @if($billing->postal_code)
                            {{ $billing->postal_code }}
                        @endif

                        <br>

                        {{ $billing->country }}

                        @if($billing->phone)
                            <br>
                            {{ $billing->phone }}
                        @endif
                    </div>

                @else

                    <div class="info-text">
                        No billing address available.
                    </div>

                @endif

            </td>

            <td>

                <div class="section-label">
                    Ship To
                </div>

                @php
                    $shipping =
                        $order->shippingAddress;
                @endphp

                @if($shipping)

                    <div class="info-title">
                        {{ $shipping->first_name }}
                        {{ $shipping->last_name }}
                    </div>

                    <div class="info-text">
                        {{ $shipping->address_line1 }}

                        @if($shipping->address_line2)
                            <br>
                            {{ $shipping->address_line2 }}
                        @endif

                        <br>

                        {{ $shipping->city }}

                        @if($shipping->state)
                            , {{ $shipping->state }}
                        @endif

                        @if($shipping->postal_code)
                            {{ $shipping->postal_code }}
                        @endif

                        <br>

                        {{ $shipping->country }}

                        @if($shipping->phone)
                            <br>
                            {{ $shipping->phone }}
                        @endif
                    </div>

                @else

                    <div class="info-text">
                        No shipping address available.
                    </div>

                @endif

            </td>

        </tr>

    </table>

    <table class="items-table">

        <thead>

        <tr>
            <th>
                Item
            </th>

            <th>
                SKU
            </th>

            <th class="text-right">
                Price
            </th>

            <th class="text-right">
                Qty
            </th>

            <th class="text-right">
                Total
            </th>
        </tr>

        </thead>

        <tbody>

        @foreach($order->items as $item)

            <tr>

                <td>

                    <div class="product-name">
                        {{ $item->product_name }}
                    </div>

                    @if($item->variant_name)

                        <div class="product-meta">
                            {{ $item->variant_name }}
                        </div>

                    @endif

                </td>

                <td>
                    {{ $item->sku ?: '-' }}
                </td>

                <td class="text-right">
                    ${{ number_format($item->unit_price, 2) }}
                </td>

                <td class="text-right">
                    {{ $item->quantity }}
                </td>

                <td class="text-right">
                    ${{ number_format($item->line_total, 2) }}
                </td>

            </tr>

        @endforeach

        </tbody>

    </table>

    <div class="summary-wrapper">

        <table class="summary-table">

            <tr>

                <td class="summary-label">
                    Subtotal
                </td>

                <td class="summary-value">
                    ${{ number_format($order->subtotal, 2) }}
                </td>

            </tr>

            <tr>

                <td class="summary-label">
                    Shipping
                </td>

                <td class="summary-value">
                    ${{ number_format($order->shipping_total, 2) }}
                </td>

            </tr>

            @if((float) $order->discount_total > 0)

                <tr>

                    <td class="summary-label">
                        Discount
                    </td>

                    <td class="summary-value">
                        -${{ number_format($order->discount_total, 2) }}
                    </td>

                </tr>

            @endif

            <tr>

                <td class="summary-label">
                    Tax
                </td>

                <td class="summary-value">
                    ${{ number_format($order->tax_total, 2) }}
                </td>

            </tr>

            <tr class="summary-total">

                <td>
                    Total
                </td>

                <td class="text-right">
                    ${{ number_format($order->grand_total, 2) }}
                </td>

            </tr>

        </table>

    </div>

    <div class="payment-box">

        <table class="payment-table">

            <tr>

                <td class="payment-label">
                    Payment Method
                </td>

                <td class="payment-value">
                    {{ strtoupper($order->payment_method ?? '-') }}
                </td>

            </tr>

            <tr>

                <td class="payment-label">
                    Payment Status
                </td>

                <td
                    class="payment-value
                    {{
                        $order->payment_status === 'paid'
                            ? 'status-paid'
                            : 'status-pending'
                    }}"
                >
                    {{ strtoupper($order->payment_status ?? 'pending') }}
                </td>

            </tr>

            <tr>

                <td class="payment-label">
                    Order Status
                </td>

                <td class="payment-value">
                    {{ strtoupper($order->status ?? '-') }}
                </td>

            </tr>

        </table>

    </div>

    <div class="footer">

        Thank you for shopping with Storify.
        <br>

        This invoice was generated electronically.

    </div>

</div>

</body>
</html>
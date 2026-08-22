<?php

namespace App\Http\Controllers\Api\Account;


use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Order;


class CustomerOrderController extends Controller
{

    public function show(Request $request, $id)
    {
        $user = $request->user();

        $order = $user->orders()
            ->with([
                'items.product.media',
                'items.variant.media',
                'shippingAddress',
                'billingAddress'
            ])
            ->findOrFail($id);


        $items = $order->items->map(function ($item) {

            $imageUrl = null;


            // Variant image
            if (
                $item->variant &&
                $item->variant->media
            ) {

                $imageUrl = asset(
                    $item->variant->media->file_path
                );
            }



            // Product image
            if (
                !$imageUrl &&
                $item->product &&
                $item->product->media->isNotEmpty()
            ) {

                $cover = $item->product->media
                    ->firstWhere('is_cover', true);


                $media = $cover
                    ?? $item->product->media->first();


                if ($media) {

                    $imageUrl = asset(
                        $media->file_path
                    );
                }
            }



            return [

                'id' => $item->id,


                'product_name' =>
                $item->product_name
                    ??
                    $item->product?->title,


                'image_url' => $imageUrl,


                'qty' => (int)$item->quantity,


                'price' => (float)$item->unit_price,


                'line_total' => (float)$item->line_total,

            ];
        });



        return response()->json([

            'success' => true,


            'order' => [

                'id' => $order->id,

                'order_no' => $order->order_no,

                'status' => $order->status,


                'placed_at' => $order->created_at,


                'shipping_address' => $order->shippingAddress,


                'billing_address' => $order->billingAddress,


                'payment' => [

                    'method' => $order->payment_method,

                    'status' => $order->payment_status,

                ],


                'items' => $items,


                'subtotal' => (float)$order->subtotal,


                'shipping' => (float)($order->shipping_total ?? 0),


                'tax' => (float)($order->tax_total ?? 0),


                'total' => (float)($order->grand_total ?? 0),

            ]

        ]);
    }

    public function index(Request $request)
{
    $user = $request->user();


    $orders = $user->orders()
        ->latest()
        ->get()
        ->map(function($order){

            return [

                'id'=>$order->id,

                'order_no'=>$order->order_no,

                'status'=>$order->status,

                'payment_status'=>$order->payment_status,

                'total'=>(float)$order->grand_total,

                'currency'=>$order->currency ?? 'USD',

                'placed_at'=>$order->created_at,

            ];

        });



    return response()->json([

        'success'=>true,

        'orders'=>$orders

    ]);
}



public function cancel(Request $request, $id)
{

    $user = $request->user();


    $order = $user->orders()
        ->findOrFail($id);



    if(
        in_array($order->status, [
            'delivered',
            'cancelled'
        ])
    ){

        return response()->json([

            'success'=>false,

            'message'=>
            'This order cannot be cancelled.'

        ],422);

    }



    $order->update([

        'status'=>'cancelled'

    ]);



    return response()->json([

        'success'=>true,

        'message'=>
        'Order cancelled successfully.',


        'order'=>[

            'id'=>$order->id,

            'status'=>$order->status

        ]

    ]);

}



public function invoice(Request $request,$id)
{

    $user = $request->user();



    $order = $user->orders()

        ->with([
            'items.product',
            'shippingAddress',
            'billingAddress'
        ])

        ->findOrFail($id);



    $pdf = Pdf::loadView(
        'invoice.customer-order',
        compact('order')
    );



    return $pdf->download(
        $order->order_no.'.pdf'
    );


}









}

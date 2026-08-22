<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Vendor;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

use App\Models\MessageAttachment;
use Illuminate\Support\Facades\File;

use Illuminate\Support\Str;

class VendorInboxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $filter = $request->get('filter', 'all');
        $search = trim(
            $request->get('search', '')
        );

        $query = Conversation::query()
            ->where('vendor_id', $vendor->id)
            ->with([
                'customer:id,name,first_name,last_name,email,photo',
                'product:id,name,slug',
                'order:id,order_no',
                'assignee:id,name,email',
                'latestMessage.sender:id,name,role',
            ])
            ->withCount('messages');


        if ($filter === 'unread') {
            $query->where(
                'vendor_unread_count',
                '>',
                0
            );
        }


        if (
            in_array(
                $filter,
                [
                    'open',
                    'pending',
                    'resolved',
                ],
                true
            )
        ) {
            $query->where(
                'status',
                $filter
            );
        }


        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                $query
                    ->where(
                        'subject',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'customer',
                        function ($customerQuery) use ($search) {
                            $customerQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    )
                    ->orWhereHas(
                        'product',
                        function ($productQuery) use ($search) {
                            $productQuery->where(
                                'name',
                                'like',
                                "%{$search}%"
                            );
                        }
                    )
                    ->orWhereHas(
                        'order',
                        function ($orderQuery) use ($search) {
                            $orderQuery->where(
                                'order_no',
                                'like',
                                "%{$search}%"
                            );
                        }
                    );
            });
        }


        $conversations = $query
            ->orderByRaw(
                'CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END'
            )
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->paginate(
                min(
                    max(
                        (int) $request->get(
                            'per_page',
                            20
                        ),
                        1
                    ),
                    50
                )
            );


        $conversations->getCollection()->transform(
            fn ($conversation) =>
                $this->formatConversation(
                    $conversation
                )
        );


        return response()->json([
            'success' => true,

            'stats' => $this->stats(
                $vendor->id
            ),

            'conversations' => $conversations,
        ]);
    }


    public function show(
        Request $request,
        int $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $conversation = Conversation::query()
            ->where(
                'vendor_id',
                $vendor->id
            )
            ->with([
                'customer:id,name,first_name,last_name,email,phone,photo',
                'product',
                'order:id,order_no,status,total,currency',
                'assignee:id,name,email',

                'messages' => function ($query) {
                    $query
                        ->with([
                            'sender:id,name,first_name,last_name,email,role,photo',
                            'attachments',
                        ])
                        ->orderBy('created_at')
                        ->orderBy('id');
                },
            ])
            ->findOrFail($id);


        /*
        |--------------------------------------------------------------------------
        | MARK CUSTOMER MESSAGES AS READ
        |--------------------------------------------------------------------------
        */

        ConversationMessage::query()
            ->where(
                'conversation_id',
                $conversation->id
            )
            ->where(
                'sender_user_id',
                '!=',
                $request->user()->id
            )
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);


        if (
            $conversation->vendor_unread_count > 0
        ) {
            $conversation->update([
                'vendor_unread_count' => 0,
            ]);
        }


        $conversation->refresh();


        return response()->json([
            'success' => true,

            'conversation' =>
                $this->formatConversationDetails(
                    $conversation
                ),
        ]);
    }


    public function sendMessage(
    Request $request,
    int $id
): JsonResponse {

    $vendor = $this->vendor($request);


    $validated = $request->validate([

        'message' => [
            'nullable',
            'string',
            'max:10000',
        ],


        'attachment' => [
            'nullable',
            'file',
            'max:10240',
        ],

    ]);





    $conversation = Conversation::query()
        ->where(
            'vendor_id',
            $vendor->id
        )
        ->findOrFail($id);





    $hasFile = $request->hasFile(
        'attachment'
    );





    if(
        !$hasFile &&
        empty(trim($validated['message'] ?? ''))
    ){

        return response()->json([

            'success' => false,

            'message' => 'Message or attachment required.'

        ],422);

    }






    $message = DB::transaction(

        function () use (
            $request,
            $validated,
            $conversation,
            $hasFile
        ) {


            $message = ConversationMessage::create([


                'conversation_id' =>

                    $conversation->id,


                'sender_user_id' =>

                    $request->user()->id,


                'message' =>

                    $hasFile

                        ? 'Attachment'

                        : trim(
                            $validated['message']
                        ),



                'message_type' =>

                    $hasFile

                        ? 'attachment'

                        : 'text',



                'read_at' => null,


            ]);






            if($hasFile){


                $file = $request->file(
                    'attachment'
                );



                $uploadPath = public_path(
                    'uploads/messages'
                );



                if(!File::exists($uploadPath)){


                    File::makeDirectory(

                        $uploadPath,

                        0755,

                        true

                    );

                }




                $fileName =

                    time()
                    . '-'
                    . Str::random(12)
                    . '.'
                    . $file->getClientOriginalExtension();




                $fileType =

                    $file->getClientMimeType();



                $fileSize =

                    $file->getSize();




                $file->move(

                    $uploadPath,

                    $fileName

                );





                MessageAttachment::create([


                    'conversation_message_id' =>

                        $message->id,


                    'file_name' =>

                        $file->getClientOriginalName(),


                    'file_path' =>

                        'uploads/messages/'.$fileName,


                    'file_type' =>

                        $fileType,


                    'file_size' =>

                        $fileSize,


                ]);

            }






            $conversation->update([


                'customer_unread_count' =>

                    $conversation
                        ->customer_unread_count + 1,



                'last_message_at' =>

                    now(),


                'status' =>

                    $conversation->status === 'resolved'

                        ? 'open'

                        : $conversation->status,


                'resolved_at' =>

                    $conversation->status === 'resolved'

                        ? null

                        : $conversation->resolved_at,


            ]);






            return $message;

        }

    );






    $message->load([

        'sender:id,name,first_name,last_name,email,role,photo',

        'attachments',

    ]);






    return response()->json([

        'success' => true,


        'message' =>

            'Message sent successfully.',


        'conversation_message' =>

            $this->formatMessage(
                $message
            ),


    ],201);

}


    public function updateStatus(
        Request $request,
        int $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $validated = $request->validate([
            'status' => [
                'required',

                Rule::in([
                    'open',
                    'pending',
                    'resolved',
                ]),
            ],
        ]);


        $conversation = Conversation::query()
            ->where(
                'vendor_id',
                $vendor->id
            )
            ->findOrFail($id);


        $conversation->update([
            'status' =>
                $validated['status'],

            'resolved_at' =>
                $validated['status'] ===
                'resolved'
                    ? now()
                    : null,
        ]);


        return response()->json([
            'success' => true,

            'message' =>
                'Conversation status updated successfully.',

            'conversation' => [
                'id' =>
                    $conversation->id,

                'status' =>
                    $conversation->status,

                'resolved_at' =>
                    $conversation->resolved_at,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VENDOR
    |--------------------------------------------------------------------------
    */

   private function vendor(Request $request): Vendor
{
    $user = $request->user();

    if (!$user || $user->role !== 'vendor') {
        abort(403, 'Vendor access required.');
    }

    $vendor = Vendor::query()
        ->where('user_id', $user->id)
        ->first();

    if ($vendor) {
        return $vendor;
    }

    $storeName = trim($user->name ?: 'Vendor Store');

    return Vendor::create([
        'user_id' => $user->id,
        'store_name' => $storeName,
        'slug' => Str::slug($storeName . '-' . $user->id),
        'status' => 'approved',
    ]);
}


    /*
    |--------------------------------------------------------------------------
    | INBOX STATS
    |--------------------------------------------------------------------------
    */

    private function stats(
        int $vendorId
    ): array {
        $base = Conversation::query()
            ->where(
                'vendor_id',
                $vendorId
            );


        return [
            'all' =>
                (clone $base)->count(),

            'unread' =>
                (clone $base)
                    ->where(
                        'vendor_unread_count',
                        '>',
                        0
                    )
                    ->count(),

            'open' =>
                (clone $base)
                    ->where(
                        'status',
                        'open'
                    )
                    ->count(),

            'pending' =>
                (clone $base)
                    ->where(
                        'status',
                        'pending'
                    )
                    ->count(),

            'resolved' =>
                (clone $base)
                    ->where(
                        'status',
                        'resolved'
                    )
                    ->count(),

            'unread_messages' =>
                (int) (
                    (clone $base)
                        ->sum(
                            'vendor_unread_count'
                        )
                ),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | CONVERSATION LIST FORMAT
    |--------------------------------------------------------------------------
    */

    private function formatConversation(
        Conversation $conversation
    ): array {
        $customer =
            $conversation->customer;

        $product =
            $conversation->product;

        $order =
            $conversation->order;

        $latestMessage =
            $conversation->latestMessage;


        return [
            'id' =>
                $conversation->id,

            'subject' =>
                $conversation->subject,

            'channel' =>
                $conversation->channel,

            'status' =>
                $conversation->status,

            'vendor_unread_count' =>
                $conversation
                    ->vendor_unread_count,

            'customer_unread_count' =>
                $conversation
                    ->customer_unread_count,

            'last_message_at' =>
                $conversation
                    ->last_message_at,

            'resolved_at' =>
                $conversation
                    ->resolved_at,

            'messages_count' =>
                $conversation
                    ->messages_count
                ?? 0,

            'customer' =>
                $customer
                    ? [
                        'id' =>
                            $customer->id,

                        'name' =>
                            $customer->name,

                        'email' =>
                            $customer->email,

                        'photo' =>
                            $customer->photo,

                        'photo_url' =>
                            $this->photoUrl(
                                $customer->photo
                            ),
                    ]
                    : null,

            'product' =>
                $product
                    ? [
                        'id' =>
                            $product->id,

                        'name' =>
                            $product->name,

                        'slug' =>
                            $product->slug,
                    ]
                    : null,

            'order' =>
                $order
                    ? [
                        'id' =>
                            $order->id,

                        'order_no' =>
                            $order->order_no,
                    ]
                    : null,

            'assignee' =>
                $conversation->assignee
                    ? [
                        'id' =>
                            $conversation
                                ->assignee
                                ->id,

                        'name' =>
                            $conversation
                                ->assignee
                                ->name,

                        'email' =>
                            $conversation
                                ->assignee
                                ->email,
                    ]
                    : null,

            'latest_message' =>
                $latestMessage
                    ? [
                        'id' =>
                            $latestMessage->id,

                        'message' =>
                            $latestMessage->message,

                        'message_type' =>
                            $latestMessage
                                ->message_type,

                        'sender_user_id' =>
                            $latestMessage
                                ->sender_user_id,

                        'created_at' =>
                            $latestMessage
                                ->created_at,
                    ]
                    : null,
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | CONVERSATION DETAILS FORMAT
    |--------------------------------------------------------------------------
    */

    private function formatConversationDetails(
        Conversation $conversation
    ): array {
        $customer =
            $conversation->customer;

        $product =
            $conversation->product;

        $order =
            $conversation->order;


        return [
            'id' =>
                $conversation->id,

            'subject' =>
                $conversation->subject,

            'channel' =>
                $conversation->channel,

            'status' =>
                $conversation->status,

            'vendor_unread_count' =>
                $conversation
                    ->vendor_unread_count,

            'customer_unread_count' =>
                $conversation
                    ->customer_unread_count,

            'last_message_at' =>
                $conversation
                    ->last_message_at,

            'resolved_at' =>
                $conversation
                    ->resolved_at,

            'customer' =>
                $customer
                    ? [
                        'id' =>
                            $customer->id,

                        'name' =>
                            $customer->name,

                        'email' =>
                            $customer->email,

                        'phone' =>
                            $customer->phone,

                        'photo' =>
                            $customer->photo,

                        'photo_url' =>
                            $this->photoUrl(
                                $customer->photo
                            ),
                    ]
                    : null,

            'product' =>
                $product
                    ? [
                        'id' =>
                            $product->id,

                        'name' =>
                            $product->name
                            ?? null,

                        'slug' =>
                            $product->slug
                            ?? null,

                        'sku' =>
                            $product->sku
                            ?? null,
                    ]
                    : null,

            'order' =>
                $order
                    ? [
                        'id' =>
                            $order->id,

                        'order_no' =>
                            $order->order_no,

                        'status' =>
                            $order->status,

                        'total' =>
                            $order->total,

                        'currency' =>
                            $order->currency,
                    ]
                    : null,

            'assignee' =>
                $conversation->assignee
                    ? [
                        'id' =>
                            $conversation
                                ->assignee
                                ->id,

                        'name' =>
                            $conversation
                                ->assignee
                                ->name,

                        'email' =>
                            $conversation
                                ->assignee
                                ->email,
                    ]
                    : null,

            'messages' =>
                $conversation
                    ->messages
                    ->map(
                        fn ($message) =>
                            $this->formatMessage(
                                $message
                            )
                    )
                    ->values(),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | MESSAGE FORMAT
    |--------------------------------------------------------------------------
    */

    private function formatMessage(
        ConversationMessage $message
    ): array {
        return [
            'id' =>
                $message->id,

            'conversation_id' =>
                $message
                    ->conversation_id,

            'sender_user_id' =>
                $message
                    ->sender_user_id,

            'message' =>
                $message->message,

            'message_type' =>
                $message
                    ->message_type,

            'read_at' =>
                $message->read_at,

            'created_at' =>
                $message->created_at,

            'sender' =>
                $message->sender
                    ? [
                        'id' =>
                            $message
                                ->sender
                                ->id,

                        'name' =>
                            $message
                                ->sender
                                ->name,

                        'role' =>
                            $message
                                ->sender
                                ->role,

                        'photo_url' =>
                            $this->photoUrl(
                                $message
                                    ->sender
                                    ->photo
                            ),
                    ]
                    : null,

            'attachments' =>
                $message
                    ->attachments
                    ->map(
                        function ($attachment) {
                            return [
                                'id' =>
                                    $attachment->id,

                                'file_name' =>
                                    $attachment
                                        ->file_name,

                                'file_type' =>
                                    $attachment
                                        ->file_type,

                                'file_size' =>
                                    $attachment
                                        ->file_size,

                                'file_url' =>
                                    $attachment
                                        ->file_url,
                            ];
                        }
                    )
                    ->values(),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | USER PHOTO URL
    |--------------------------------------------------------------------------
    */

    private function photoUrl(
        ?string $photo
    ): ?string {
        if (!$photo) {
            return null;
        }

        if (
            str_starts_with(
                $photo,
                'http://'
            ) ||
            str_starts_with(
                $photo,
                'https://'
            )
        ) {
            return $photo;
        }


        return asset(
            ltrim(
                $photo,
                '/'
            )
        );
    }
}

<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\Vendor;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;


class CustomerMessageController extends Controller
{


    /**
     * Get approved vendors for customer message
     */
    public function vendors()
    {
        $vendors = Vendor::with('user')
            ->where('status', 'approved')
            ->get()
            ->map(function ($vendor) {

                return [

                    'id' => $vendor->id,

                    'store_name' => $vendor->store_name,

                    'slug' => $vendor->slug,

                    'logo_url' => $vendor->logo
                        ? asset($vendor->logo)
                        : null,

                    'owner' => [

                        'id' => $vendor->user->id,

                        'name' => $vendor->user->name

                    ]

                ];

            });


        return response()->json([

            'status' => true,

            'vendors' => $vendors

        ]);
    }






    /**
     * Customer inbox conversations
     */

   public function index(Request $request)
{
    $customer = $request->user();


    $conversations = Conversation::with([
        'vendor',
        'latestMessage'
    ])
    ->where(
        'customer_id',
        $customer->id
    )
    ->latest('last_message_at')
    ->get();



    $conversations->each(function($conversation){

        if($conversation->vendor){

            $conversation->vendor->logo_url =

                $conversation->vendor->logo

                ? url($conversation->vendor->logo)

                : null;

        }

    });



    return response()->json([

        'status'=>true,

        'conversations'=>$conversations

    ]);
}







    /**
     * Start new conversation
     */
    public function start(Request $request)
    {

        $validated = $request->validate([


            'vendor_id' => [

                'required',

                'exists:vendors,id'

            ],


            'subject' => [

                'nullable',

                'string'

            ],


            'message' => [

                'required',

                'string'

            ]


        ]);



        $customer = $request->user();



        $vendor = Vendor::findOrFail(
            $validated['vendor_id']
        );



        // prevent customer messaging own store

        if(
            $vendor->user_id == $customer->id
        ){

            return response()->json([

                'status'=>false,

                'message'=>'You cannot message your own store.'

            ],422);

        }




        $conversation = Conversation::create([


            'vendor_id' => $vendor->id,


            'customer_id' => $customer->id,


            'subject' => $validated['subject']
                ?? 'New Message',


            'channel' => 'customer',


            'status' => 'open',


            'customer_unread_count' => 0,


            'vendor_unread_count' => 1,


            'last_message_at' => now()


        ]);






        ConversationMessage::create([


            'conversation_id' => $conversation->id,


            'sender_user_id' => $customer->id,


            'message' => $validated['message'],


            'message_type' => 'text'


        ]);






        return response()->json([


            'status' => true,


            'message' => 'Message sent successfully.',


            'conversation_id' => $conversation->id


        ],201);

    }








    /**
     * Conversation details
     */
    public function show(
        Request $request,
        $id
    )
    {


        $conversation = Conversation::with([

            'vendor',

            'messages.sender',

            'messages.attachments'

        ])
        ->where(
            'customer_id',
            $request->user()->id
        )
        ->findOrFail($id);



        // mark customer unread as read

        $conversation->update([

            'customer_unread_count'=>0

        ]);



        $conversation
            ->messages()
            ->whereNull('read_at')
            ->where(
                'sender_user_id',
                '!=',
                $request->user()->id
            )
            ->update([

                'read_at'=>now()

            ]);




        return response()->json([

            'status'=>true,

            'conversation'=>$conversation

        ]);

    }









    /**
     * Customer reply message
     */

   public function sendMessage(
    Request $request,
    $id
)
{
    $request->validate([

        'message' => [
            'nullable',
            'string'
        ],

        'attachment' => [
            'nullable',
            'file',
            'max:10240'
        ]

    ]);



    $customer = $request->user();



    $conversation = Conversation::where(
        'customer_id',
        $customer->id
    )
    ->findOrFail($id);





    $hasFile = $request->hasFile(
        'attachment'
    );





    if(
        !$hasFile &&
        !$request->filled('message')
    ){

        return response()->json([

            'status' => false,

            'message' => 'Message or attachment required.'

        ],422);

    }





    $message = ConversationMessage::create([


        'conversation_id' => $conversation->id,


        'sender_user_id' => $customer->id,


        'message' => $hasFile

            ? 'Attachment'

            : $request->message,



        'message_type' => $hasFile

            ? 'attachment'

            : 'text'


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





        $fileType = $file->getClientMimeType();

        $fileSize = $file->getSize();





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


        'vendor_unread_count' =>

            $conversation->vendor_unread_count + 1,


        'last_message_at' =>

            now()


    ]);







    return response()->json([


        'status' => true,


        'message' => $message->load(
            'attachments'
        )


    ]);

}


}

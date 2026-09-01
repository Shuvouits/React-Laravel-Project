<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\SalesAiConversation;
use App\Models\SalesAiMessage;
use App\Models\SalesAiSetting;
use App\Services\SalesAi\SalesAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;
use Illuminate\Support\Facades\Cache;


class SalesAiController extends Controller
{
    public function config(): JsonResponse
    {
        $settings = $this->getSettings();

        return response()->json([
            'status' => true,
            'active' =>
                (bool) $settings->is_active,

            'chatbot' => [
                'name' =>
                    $settings->bot_name,

                'welcome_message' =>
                    $settings
                        ->welcome_message,

                'input_placeholder' =>
                    $settings
                        ->input_placeholder,

                'starter_suggestions' =>
                    $settings
                        ->starter_suggestions
                    ?: [],

                'theme' =>
                    $settings->theme
                    ?: [],
            ],
        ]);
    }

    public function startConversation(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'page_url' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'locale' => [
                'nullable',
                'string',
                'max:20',
            ],
            'guest_token' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $settings = $this->getSettings();

        if (!$settings->is_active) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Sales AI is currently unavailable.',
            ], 503);
        }

        $user = $this->resolveUser();

        $guestToken = null;

        if (!$user) {
            $guestToken =
                $validated['guest_token']
                ?? $request->header(
                    'X-Sales-AI-Guest-Token'
                )
                ?? Str::random(64);
        }

        $conversation =
            SalesAiConversation::create([
                'uuid' =>
                    (string) Str::uuid(),

                'user_id' =>
                    $user?->id,

                'guest_token' =>
                    $guestToken,

                'status' => 'active',

                'locale' =>
                    $validated['locale']
                    ?? 'en',

                'page_url' =>
                    $validated['page_url']
                    ?? null,

                'last_message_at' =>
                    now(),

                'metadata' => [
                    'user_agent' =>
                        Str::limit(
                            (string) $request
                                ->userAgent(),
                            500,
                            ''
                        ),
                ],
            ]);

        return response()->json([
            'status' => true,

            'conversation' => [
                'uuid' =>
                    $conversation->uuid,

                'guest_token' =>
                    $user
                        ? null
                        : $guestToken,

                'status' =>
                    $conversation->status,

                'locale' =>
                    $conversation->locale,

                'created_at' =>
                    $conversation
                        ->created_at,
            ],

            'welcome_message' =>
                $settings->welcome_message,

            'starter_suggestions' =>
                $settings
                    ->starter_suggestions
                ?: [],
        ], 201);
    }

   public function chat(
    Request $request,
    SalesAiService $salesAiService
): JsonResponse {
    $validated = $request->validate([
        'conversation_uuid' => [
            'required',
            'uuid',
        ],

        'guest_token' => [
            'nullable',
            'string',
            'max:100',
        ],

        'message' => [
            'required',
            'string',
            'min:1',
            'max:2000',
        ],

        'request_id' => [
            'nullable',
            'string',
            'max:100',
        ],

        'page_url' => [
            'nullable',
            'string',
            'max:2000',
        ],

        'page_context' => [
            'nullable',
            'array',
        ],

        'page_context.page_type' => [
            'nullable',
            'string',
            'max:50',
        ],

        'page_context.product' => [
            'nullable',
            'array',
        ],

        'page_context.product.id' => [
            'nullable',
            'integer',
        ],

        'page_context.product.title' => [
            'nullable',
            'string',
            'max:255',
        ],

        'page_context.product.slug' => [
            'nullable',
            'string',
            'max:255',
        ],

        'locale' => [
            'nullable',
            'string',
            'max:20',
        ],
    ]);

    $settings = $this->getSettings();

    if (!$settings->is_active) {
        return response()->json([
            'status' => false,

            'message' =>
                'Sales AI is currently unavailable.',
        ], 503);
    }

    $user = $this->resolveUser();

    $conversation =
        SalesAiConversation::query()
            ->where(
                'uuid',
                $validated[
                    'conversation_uuid'
                ]
            )
            ->first();

    if (
        !$conversation ||
        !$this->canAccessConversation(
            $request,
            $conversation,
            $user,
            $validated[
                'guest_token'
            ] ?? null
        )
    ) {
        return response()->json([
            'status' => false,

            'message' =>
                'Conversation not found.',
        ], 404);
    }

    if (
        $conversation->status !==
        'active'
    ) {
        return response()->json([
            'status' => false,

            'message' =>
                'This conversation has been closed.',
        ], 422);
    }

    $limitResponse =
        $this->checkDailyLimit(
            $conversation,
            $settings,
            $user
        );

    if ($limitResponse) {
        return $limitResponse;
    }

    $requestId = trim(
        (string) (
            $validated['request_id']
            ?? ''
        )
    );

    if ($requestId === '') {
        $requestId =
            (string) Str::uuid();
    }

    /*
     * একই conversation-এ একসঙ্গে কেবল
     * একটি chat request চলতে পারবে।
     */
    $lock = Cache::lock(
        'sales-ai-chat-' .
        $conversation->id,
        120
    );

    if (!$lock->get()) {
        return response()->json([
            'status' => false,

            'request_id' =>
                $requestId,

            'message' =>
                'Another message is still being processed. Please wait for it to finish.',
        ], 409);
    }

    try {
        $messageText = trim(
            $validated['message']
        );

        $conversationUpdates = [
            'last_message_at' =>
                now(),
        ];

        if (
            !empty(
                $validated['page_url']
            )
        ) {
            $conversationUpdates[
                'page_url'
            ] = $validated['page_url'];
        }

        if (
            !empty(
                $validated['locale']
            )
        ) {
            $conversationUpdates[
                'locale'
            ] = $validated['locale'];
        }

        $conversation->update(
            $conversationUpdates
        );

        /*
         * Request-এর page context তৈরি হবে।
         */
        $pageContext =
            $validated['page_context']
            ?? $this->buildPageContext(
                $validated['page_url']
                ?? null
            );

        $userMessage =
            SalesAiMessage::create([
                'sales_ai_conversation_id' =>
                    $conversation->id,

                'role' =>
                    'user',

                'content' =>
                    $messageText,

                'content_type' =>
                    'text',

                'tool_payload' => [
                    'request_id' =>
                        $requestId,

                    'page_context' =>
                        $pageContext,
                ],
            ]);

        try {
            $result =
                $salesAiService->generate(
                    conversation:
                        $conversation,

                    settings:
                        $settings,

                    currentMessage:
                        $messageText,

                    pageContext:
                        $pageContext
                );

            $formattedUserMessage =
                $this->formatMessage(
                    $userMessage
                );

            $formattedAssistantMessage =
                $this->formatMessage(
                    $result['message']
                );

            $formattedUserMessage[
                'request_id'
            ] = $requestId;

            $formattedAssistantMessage[
                'request_id'
            ] = $requestId;

            return response()->json([
                'status' =>
                    true,

                'request_id' =>
                    $requestId,

                'conversation' => [
                    'uuid' =>
                        $conversation->uuid,

                    'status' =>
                        $conversation->status,
                ],

                'user_message' =>
                    $formattedUserMessage,

                'assistant_message' =>
                    $formattedAssistantMessage,

                'reply' =>
                    $result['reply'],

                'content_type' =>
                    $result['content_type'],

                'structured_data' =>
                    $result[
                        'structured_data'
                    ],

                'model' =>
                    $result['model']
                    ?? null,

                'usage' =>
                    $result['usage']
                    ?? null,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            $publicMessage =
                'I am having trouble connecting right now. Please try again in a moment.';

            $assistantMessage =
                SalesAiMessage::create([
                    'sales_ai_conversation_id' =>
                        $conversation->id,

                    'role' =>
                        'assistant',

                    'content' =>
                        $publicMessage,

                    'content_type' =>
                        'error',

                    'error_message' =>
                        $exception->getMessage(),

                    'tool_payload' => [
                        'request_id' =>
                            $requestId,
                    ],
                ]);

            $formattedAssistantMessage =
                $this->formatMessage(
                    $assistantMessage
                );

            $formattedAssistantMessage[
                'request_id'
            ] = $requestId;

            return response()->json([
                'status' =>
                    false,

                'request_id' =>
                    $requestId,

                'message' =>
                    $publicMessage,

                'assistant_message' =>
                    $formattedAssistantMessage,
            ], 502);
        }
    } finally {
        $lock->release();
    }
}

    public function messages(
        Request $request,
        string $conversationUuid
    ): JsonResponse {
        $user = $this->resolveUser();

        $conversation =
            SalesAiConversation::query()
                ->where(
                    'uuid',
                    $conversationUuid
                )
                ->first();

        if (
            !$conversation ||
            !$this->canAccessConversation(
                $request,
                $conversation,
                $user,
                $request->query(
                    'guest_token'
                )
            )
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Conversation not found.',
            ], 404);
        }

        $messages = $conversation
            ->messages()
            ->whereIn(
                'role',
                [
                    'user',
                    'assistant',
                ]
            )
            ->whereNotIn(
                'content_type',
                [
                    'tool_request',
                ]
            )
            ->latest('id')
            ->limit(50)
            ->get()
            ->reverse()
            ->values()
            ->map(
                fn (
                    SalesAiMessage $message
                ) =>
                    $this->formatMessage(
                        $message
                    )
            );

        return response()->json([
            'status' => true,

            'conversation' => [
                'uuid' =>
                    $conversation->uuid,

                'status' =>
                    $conversation->status,

                'locale' =>
                    $conversation->locale,
            ],

            'messages' => $messages,
        ]);
    }

    public function closeConversation(
        Request $request,
        string $conversationUuid
    ): JsonResponse {
        $user = $this->resolveUser();

        $conversation =
            SalesAiConversation::query()
                ->where(
                    'uuid',
                    $conversationUuid
                )
                ->first();

        if (
            !$conversation ||
            !$this->canAccessConversation(
                $request,
                $conversation,
                $user,
                $request->input(
                    'guest_token'
                )
            )
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Conversation not found.',
            ], 404);
        }

        $conversation->update([
            'status' => 'closed',
            'last_message_at' => now(),
        ]);

        return response()->json([
            'status' => true,
            'message' =>
                'Conversation closed successfully.',
        ]);
    }

    private function canAccessConversation(
        Request $request,
        SalesAiConversation $conversation,
        $user,
        ?string $providedGuestToken
    ): bool {
        if ($conversation->user_id) {
            return (
                $user &&
                (int) $conversation->user_id ===
                    (int) $user->id
            );
        }

        $guestToken =
            $providedGuestToken
            ?: $request->header(
                'X-Sales-AI-Guest-Token'
            );

        if (
            !$guestToken ||
            !$conversation->guest_token
        ) {
            return false;
        }

        return hash_equals(
            (string) $conversation
                ->guest_token,
            (string) $guestToken
        );
    }

    private function checkDailyLimit(
        SalesAiConversation $conversation,
        SalesAiSetting $settings,
        $user
    ): ?JsonResponse {
        if ($user) {
            $dailyLimit = max(
                1,
                (int) $settings
                    ->authenticated_daily_limit
            );

            $usedMessages =
                SalesAiMessage::query()
                    ->where(
                        'role',
                        'user'
                    )
                    ->whereDate(
                        'created_at',
                        today()
                    )
                    ->whereHas(
                        'conversation',
                        function (
                            $query
                        ) use ($user) {
                            $query->where(
                                'user_id',
                                $user->id
                            );
                        }
                    )
                    ->count();
        } else {
            $dailyLimit = max(
                1,
                (int) $settings
                    ->guest_daily_limit
            );

            $usedMessages =
                SalesAiMessage::query()
                    ->where(
                        'role',
                        'user'
                    )
                    ->whereDate(
                        'created_at',
                        today()
                    )
                    ->whereHas(
                        'conversation',
                        function (
                            $query
                        ) use (
                            $conversation
                        ) {
                            $query->where(
                                'guest_token',
                                $conversation
                                    ->guest_token
                            );
                        }
                    )
                    ->count();
        }

        if (
            $usedMessages <
            $dailyLimit
        ) {
            return null;
        }

        return response()->json([
            'status' => false,

            'message' =>
                'You have reached today’s Sales AI message limit. Please try again tomorrow.',

            'limit' => [
                'daily_limit' =>
                    $dailyLimit,

                'used' =>
                    $usedMessages,

                'remaining' => 0,
            ],
        ], 429);
    }

    private function resolveUser()
    {
        try {
            return Auth::guard(
                'sanctum'
            )->user();
        } catch (Throwable) {
            return null;
        }
    }

    private function formatMessage(
        SalesAiMessage $message
    ): array {
        return [
            'id' => $message->id,
            'role' => $message->role,
            'content' =>
                $message->content,
            'content_type' =>
                $message->content_type,
            'structured_data' =>
                $message
                    ->structured_data,
            'created_at' =>
                $message->created_at,
        ];
    }

    private function getSettings(): SalesAiSetting
    {
        return SalesAiSetting::query()
            ->firstOrCreate(
                [],
                [
                    'bot_name' =>
                        'Sales AI',

                    'welcome_message' =>
                        'Hi! I can help you find products, compare options, add items to your cart, and check order status.',

                    'input_placeholder' =>
                        'Type a message...',

                    'temperature' =>
                        0.30,

                    'max_tokens' =>
                        1200,

                    'product_search_limit' =>
                        6,

                    'guest_daily_limit' =>
                        30,

                    'authenticated_daily_limit' =>
                        100,

                    'starter_suggestions' => [
                        'Show me products on sale',
                        'Help me find a product',
                        'Compare products',
                        'Check my order status',
                    ],

                    'theme' => [
                        'primary_color' =>
                            '#3424F4',

                        'secondary_color' =>
                            '#A34CF4',

                        'text_color' =>
                            '#171717',

                        'panel_background' =>
                            '#FFFFFF',

                        'launcher_position' =>
                            'right',
                    ],

                    'is_active' => true,
                ]
            );
    }


    private function buildPageContext(
    ?string $pageUrl
): array {
    $pageUrl = trim(
        (string) $pageUrl
    );

    if ($pageUrl === '') {
        return [];
    }

    $path = parse_url(
        $pageUrl,
        PHP_URL_PATH
    );

    $path = is_string($path)
        ? trim($path, '/')
        : '';

    if ($path === '') {
        return [
            'page_type' =>
                'home',
        ];
    }

    if (
        preg_match(
            '#(?:^|/)products/([^/]+)$#i',
            $path,
            $matches
        )
    ) {
        return [
            'page_type' =>
                'product',

            'product' => [
                'slug' =>
                    urldecode(
                        $matches[1]
                    ),
            ],
        ];
    }

    if (
        preg_match(
            '#(?:^|/)collections/([^/]+)$#i',
            $path,
            $matches
        )
    ) {
        return [
            'page_type' =>
                'collection',

            'collection_slug' =>
                urldecode(
                    $matches[1]
                ),
        ];
    }

    if (
        preg_match(
            '#(?:^|/)categories/([^/]+)$#i',
            $path,
            $matches
        )
    ) {
        return [
            'page_type' =>
                'category',

            'category_slug' =>
                urldecode(
                    $matches[1]
                ),
        ];
    }

    if ($path === 'products') {
        return [
            'page_type' =>
                'product_catalog',
        ];
    }

    if ($path === 'contact') {
        return [
            'page_type' =>
                'contact',
        ];
    }

    return [
        'page_type' =>
            'page',

        'path' =>
            $path,
    ];
}



}
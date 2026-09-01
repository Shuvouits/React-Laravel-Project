<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ContactMessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:190',
            ],
            'status' => [
                'nullable',
                Rule::in([
                    'new',
                    'in_progress',
                    'resolved',
                    'spam',
                ]),
            ],
            'is_read' => [
                'nullable',
                Rule::in([
                    '0',
                    '1',
                ]),
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:5',
                'max:100',
            ],
        ]);

        $query = ContactMessage::query()
            ->latest('created_at');

        if (!empty($validated['search'])) {
            $search = trim(
                $validated['search']
            );

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where(
                        'name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'company',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'subject',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'message',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        if (!empty($validated['status'])) {
            $query->where(
                'status',
                $validated['status']
            );
        }

        if (isset($validated['is_read'])) {
            $query->where(
                'is_read',
                (bool) $validated['is_read']
            );
        }

        $messages = $query->paginate(
            $validated['per_page'] ?? 15
        );

        return response()->json([
            'status' => true,
            'messages' => $messages,
            'stats' => $this->getStats(),
        ]);
    }

    public function show(
        ContactMessage $contactMessage
    ): JsonResponse {
        if (!$contactMessage->is_read) {
            $contactMessage->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'status' => true,
            'message' => $contactMessage->fresh(),
            'stats' => $this->getStats(),
        ]);
    }

    public function markAsRead(
        ContactMessage $contactMessage
    ): JsonResponse {
        $contactMessage->update([
            'is_read' => true,
            'read_at' =>
                $contactMessage->read_at ?: now(),
        ]);

        return response()->json([
            'status' => true,
            'message' =>
                'Message marked as read.',
            'contact_message' =>
                $contactMessage->fresh(),
            'stats' => $this->getStats(),
        ]);
    }

    public function markAsUnread(
        ContactMessage $contactMessage
    ): JsonResponse {
        $contactMessage->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return response()->json([
            'status' => true,
            'message' =>
                'Message marked as unread.',
            'contact_message' =>
                $contactMessage->fresh(),
            'stats' => $this->getStats(),
        ]);
    }

    public function updateStatus(
        Request $request,
        ContactMessage $contactMessage
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([
                    'new',
                    'in_progress',
                    'resolved',
                    'spam',
                ]),
            ],
        ]);

        $contactMessage->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'status' => true,
            'message' =>
                'Message status updated successfully.',
            'contact_message' =>
                $contactMessage->fresh(),
            'stats' => $this->getStats(),
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        return response()->json([
            'status' => true,
            'unread_count' =>
                ContactMessage::query()
                    ->where('is_read', false)
                    ->count(),
        ]);
    }

    public function destroy(
        ContactMessage $contactMessage
    ): JsonResponse {
        $contactMessage->delete();

        return response()->json([
            'status' => true,
            'message' =>
                'Contact message deleted successfully.',
            'stats' => $this->getStats(),
        ]);
    }

    private function getStats(): array
    {
        return [
            'total' =>
                ContactMessage::query()->count(),

            'unread' =>
                ContactMessage::query()
                    ->where('is_read', false)
                    ->count(),

            'new' =>
                ContactMessage::query()
                    ->where('status', 'new')
                    ->count(),

            'in_progress' =>
                ContactMessage::query()
                    ->where(
                        'status',
                        'in_progress'
                    )
                    ->count(),

            'resolved' =>
                ContactMessage::query()
                    ->where(
                        'status',
                        'resolved'
                    )
                    ->count(),

            'spam' =>
                ContactMessage::query()
                    ->where('status', 'spam')
                    ->count(),
        ];
    }
}
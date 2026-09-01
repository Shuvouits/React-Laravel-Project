<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\ContactPageSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function show(): JsonResponse
    {
        $contactPage = $this->getContactPage();

        return response()->json([
            'status' => true,
            'active' => (bool) $contactPage->is_active,
            'contact_page' => $this->formatContactPage($contactPage),
        ]);
    }

    public function storeMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:120',
            ],
            'company' => [
                'nullable',
                'string',
                'max:150',
            ],
            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],
            'email' => [
                'required',
                'email',
                'max:190',
            ],
            'subject' => [
                'required',
                'string',
                'max:190',
            ],
            'message' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $contactMessage = ContactMessage::create([
            ...$validated,
            'status' => 'new',
            'is_read' => false,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Your message has been sent successfully.',
            'contact_message' => [
                'id' => $contactMessage->id,
                'status' => $contactMessage->status,
                'created_at' => $contactMessage->created_at,
            ],
        ], 201);
    }

    private function getContactPage(): ContactPageSetting
    {
        return ContactPageSetting::query()->firstOrCreate(
            [],
            $this->defaultContactPageData()
        );
    }

    private function formatContactPage(
        ContactPageSetting $contactPage
    ): array {
        $hero = $contactPage->hero ?: [];

        $backgroundImage = $hero['background_image'] ?? null;

        $hero['background_image_url'] = $backgroundImage
            ? asset($backgroundImage)
            : null;

        return [
            'hero' => $hero,
            'contact_information' =>
                $contactPage->contact_information,
            'form_content' =>
                $contactPage->form_content,
            'map_content' =>
                $contactPage->map_content,
        ];
    }

    private function defaultContactPageData(): array
    {
        return [
            'hero' => [
                'key' => 'hero',
                'type' => 'hero',
                'editor_title' => 'Contact Hero',
                'title' => 'Contact Us',
                'subtitle' => 'Have a question about an order, product, vendor, or account? Our team is ready to help you find the right answer.',
                'background_image' => null,
                'overlay_opacity' => 65,
            ],

            'contact_information' => [
                'key' => 'contact_information',
                'type' => 'contact_information',
                'editor_title' => 'Contact Information',
                'title' => 'Get in Touch',
                'description' => 'Reach us through the details below, or send a message and we will get back to you as soon as possible.',

                'address_title' => 'Head Office',
                'address' => '123 Main Street, New York, NY 10001',

                'email_title' => 'Email Us',
                'email' => 'support@storify.com',

                'phone_title' => 'Call Us',
                'phone' => '+1 555-0100',

                'hours_title' => 'Support Hours',
                'hours' => 'Sunday to Thursday, 9:00 AM - 6:00 PM',
            ],

            'form_content' => [
                'key' => 'form_content',
                'type' => 'form_content',
                'editor_title' => 'Contact Form',
                'title' => 'Send us a message',
                'description' => 'Share the details and our support team will route your message to the right person.',

                'name_label' => 'Name',
                'name_placeholder' => 'Your name',

                'company_label' => 'Company',
                'company_placeholder' => 'Company',

                'phone_label' => 'Phone',
                'phone_placeholder' => 'Phone',

                'email_label' => 'Email',
                'email_placeholder' => 'Email',

                'subject_label' => 'Subject',
                'subject_placeholder' => 'Subject',

                'message_label' => 'Message',
                'message_placeholder' => 'How can we help?',

                'button_text' => 'Send Message',
                'success_message' => 'Thank you. Your message has been sent successfully.',
            ],

            'map_content' => [
                'key' => 'map_content',
                'type' => 'map_content',
                'editor_title' => 'Store Map',
                'title' => 'Visit Our Store',
                'description' => 'Use the map below to find our office location and plan your visit.',
                'map_embed_url' => '',
                'google_maps_url' => '',
                'link_text' => 'Open in Google Maps',
            ],

            'is_active' => true,
        ];
    }
}

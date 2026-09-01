<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactPageSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;

class ContactPageSettingController extends Controller
{
    private array $allowedSections = [
        'hero',
        'contact_information',
        'form_content',
        'map_content',
    ];

    public function show(): JsonResponse
    {
        $contactPage = $this->getContactPage();

        return $this->contactPageResponse(
            $contactPage
        );
    }

    public function update(
        Request $request,
        string $sectionKey
    ): JsonResponse {
        if (!in_array(
            $sectionKey,
            $this->allowedSections,
            true
        )) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid contact page section.',
            ], 404);
        }

        $contactPage = $this->getContactPage();

        $validated = $this->validateSection(
            $request,
            $sectionKey
        );

        $currentSection =
            $contactPage->{$sectionKey} ?: [];

        $updatedSection = array_merge(
            $currentSection,
            $validated,
            [
                'key' => $sectionKey,
            ]
        );

        $contactPage->update([
            $sectionKey => $updatedSection,
        ]);

        return $this->contactPageResponse(
            $contactPage->fresh(),
            'Contact page section updated successfully.'
        );
    }

    public function updateHeroImage(
        Request $request
    ): JsonResponse {
        $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);

        $contactPage = $this->getContactPage();
        $hero = $contactPage->hero ?: [];

        $this->deleteLocalImage(
            $hero['background_image'] ?? null
        );

        $image = $request->file('image');

        $directory = public_path(
            'uploads/contact'
        );

        if (!File::exists($directory)) {
            File::makeDirectory(
                $directory,
                0755,
                true
            );
        }

        $filename = time()
            . '-'
            . uniqid()
            . '.'
            . $image->getClientOriginalExtension();

        $image->move(
            $directory,
            $filename
        );

        $hero['key'] = 'hero';
        $hero['background_image'] =
            'uploads/contact/' . $filename;

        $contactPage->update([
            'hero' => $hero,
        ]);

        return $this->contactPageResponse(
            $contactPage->fresh(),
            'Hero background image updated successfully.'
        );
    }

    public function removeHeroImage(): JsonResponse
    {
        $contactPage = $this->getContactPage();
        $hero = $contactPage->hero ?: [];

        $this->deleteLocalImage(
            $hero['background_image'] ?? null
        );

        $hero['key'] = 'hero';
        $hero['background_image'] = null;

        $contactPage->update([
            'hero' => $hero,
        ]);

        return $this->contactPageResponse(
            $contactPage->fresh(),
            'Hero background image removed successfully.'
        );
    }

    public function updateStatus(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $contactPage = $this->getContactPage();

        $contactPage->update([
            'is_active' => $validated['is_active'],
        ]);

        return $this->contactPageResponse(
            $contactPage->fresh(),
            'Contact page status updated successfully.'
        );
    }

    private function validateSection(
        Request $request,
        string $sectionKey
    ): array {
        if ($sectionKey === 'hero') {
            return $request->validate([
                'title' => [
                    'required',
                    'string',
                    'max:150',
                ],
                'subtitle' => [
                    'nullable',
                    'string',
                    'max:500',
                ],
                'overlay_opacity' => [
                    'nullable',
                    'integer',
                    'min:0',
                    'max:100',
                ],
            ]);
        }

        if ($sectionKey === 'contact_information') {
            return $request->validate([
                'title' => [
                    'required',
                    'string',
                    'max:150',
                ],
                'description' => [
                    'nullable',
                    'string',
                    'max:500',
                ],
                'address_title' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'address' => [
                    'required',
                    'string',
                    'max:500',
                ],
                'email_title' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'email' => [
                    'required',
                    'email',
                    'max:190',
                ],
                'phone_title' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'phone' => [
                    'required',
                    'string',
                    'max:50',
                ],
                'hours_title' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'hours' => [
                    'required',
                    'string',
                    'max:300',
                ],
            ]);
        }

        if ($sectionKey === 'form_content') {
            return $request->validate([
                'title' => [
                    'required',
                    'string',
                    'max:150',
                ],
                'description' => [
                    'nullable',
                    'string',
                    'max:500',
                ],
                'name_label' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'name_placeholder' => [
                    'nullable',
                    'string',
                    'max:150',
                ],
                'company_label' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'company_placeholder' => [
                    'nullable',
                    'string',
                    'max:150',
                ],
                'phone_label' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'phone_placeholder' => [
                    'nullable',
                    'string',
                    'max:150',
                ],
                'email_label' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'email_placeholder' => [
                    'nullable',
                    'string',
                    'max:150',
                ],
                'subject_label' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'subject_placeholder' => [
                    'nullable',
                    'string',
                    'max:150',
                ],
                'message_label' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'message_placeholder' => [
                    'nullable',
                    'string',
                    'max:150',
                ],
                'button_text' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'success_message' => [
                    'required',
                    'string',
                    'max:300',
                ],
            ]);
        }

        return $request->validate([
            'title' => [
                'required',
                'string',
                'max:150',
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
            ],
            'map_embed_url' => [
                'nullable',
                'url',
                'max:2000',
            ],
            'google_maps_url' => [
                'nullable',
                'url',
                'max:2000',
            ],
            'link_text' => [
                'required',
                'string',
                'max:100',
            ],
        ]);
    }

    private function getContactPage(): ContactPageSetting
    {
        return ContactPageSetting::query()->firstOrCreate(
            [],
            $this->defaultContactPageData()
        );
    }

    private function contactPageResponse(
        ContactPageSetting $contactPage,
        ?string $message = null
    ): JsonResponse {
        $hero = $contactPage->hero ?: [];

        $backgroundImage =
            $hero['background_image'] ?? null;

        $hero['background_image_url'] =
            $backgroundImage
                ? asset($backgroundImage)
                : null;

        return response()->json([
            'status' => true,
            'message' => $message,
            'active' => (bool) $contactPage->is_active,
            'contact_page' => [
                'hero' => $hero,
                'contact_information' =>
                    $contactPage->contact_information,
                'form_content' =>
                    $contactPage->form_content,
                'map_content' =>
                    $contactPage->map_content,
            ],
        ]);
    }

    private function deleteLocalImage(
        ?string $path
    ): void {
        if (!$path) {
            return;
        }

        if (!str_starts_with(
            $path,
            'uploads/contact/'
        )) {
            return;
        }

        $fullPath = public_path($path);

        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
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

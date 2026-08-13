<?php

namespace App\Notifications;

use App\Models\Vendor;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VendorApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Vendor $vendor
    ) {
    }

    // Notification channel
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    // Email content
    public function toMail(object $notifiable): MailMessage
    {
        $activationUrl = URL::temporarySignedRoute(
            'vendor.activate',
            now()->addHours(24),
            [
                'user' => $notifiable->id,
            ]
        );

        return (new MailMessage)
            ->subject('Your Storify Vendor Account Has Been Approved')
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line('Your vendor application for "' . $this->vendor->store_name . '" has been approved.')
            ->line('Activate your vendor account to continue.')
            ->action('Activate Vendor Account', $activationUrl)
            ->line('This activation link will expire in 24 hours.')
            ->line('If you did not request this vendor account, you can ignore this email.');
    }
}

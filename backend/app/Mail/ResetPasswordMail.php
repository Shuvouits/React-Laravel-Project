<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public User $user,
        public string $resetUrl,
        public int $expiresInMinutes = 60
    ) {
        //
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject:
                'Reset your Storify password'
        );
    }

    public function content(): Content
    {
        return new Content(
            view:
                'emails.auth.reset-password'
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

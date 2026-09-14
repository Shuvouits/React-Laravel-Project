<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Reset your password</title>
</head>

<body
    style="
        margin: 0;
        padding: 0;
        background: #f5f7fa;
        font-family: Arial, Helvetica, sans-serif;
        color: #171717;
    "
>

<table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
        width: 100%;
        background: #f5f7fa;
        padding: 40px 16px;
    "
>
    <tr>
        <td align="center">

            <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                    max-width: 560px;
                    background: #ffffff;
                    border: 1px solid #e6e8ec;
                    border-radius: 16px;
                    overflow: hidden;
                "
            >

                <tr>
                    <td
                        style="
                            padding: 28px 32px 20px;
                            border-bottom: 1px solid #eeeeee;
                        "
                    >

                        <div
                            style="
                                font-size: 24px;
                                font-weight: 700;
                                color: #2065D1;
                            "
                        >
                            Storify
                        </div>

                    </td>
                </tr>

                <tr>
                    <td
                        style="
                            padding: 32px;
                        "
                    >

                        <h1
                            style="
                                margin: 0 0 14px;
                                font-size: 22px;
                                line-height: 1.3;
                                color: #171717;
                            "
                        >
                            Reset your password
                        </h1>

                        <p
                            style="
                                margin: 0 0 18px;
                                font-size: 14px;
                                line-height: 1.7;
                                color: #666666;
                            "
                        >
                            Hi {{ $user->first_name ?: $user->name ?: 'there' }},
                        </p>

                        <p
                            style="
                                margin: 0 0 24px;
                                font-size: 14px;
                                line-height: 1.7;
                                color: #666666;
                            "
                        >
                            We received a request to reset the password for your Storify account.
                            Click the button below to choose a new password.
                        </p>

                        <table
                            role="presentation"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                        >
                            <tr>
                                <td
                                    style="
                                        border-radius: 8px;
                                        background: #2065D1;
                                    "
                                >

                                    <a
                                        href="{{ $resetUrl }}"
                                        target="_blank"
                                        style="
                                            display: inline-block;
                                            padding: 13px 22px;
                                            color: #ffffff;
                                            text-decoration: none;
                                            font-size: 14px;
                                            font-weight: 600;
                                        "
                                    >
                                        Reset password
                                    </a>

                                </td>
                            </tr>
                        </table>

                        <p
                            style="
                                margin: 24px 0 0;
                                font-size: 12px;
                                line-height: 1.7;
                                color: #888888;
                            "
                        >
                            This link expires in
                            {{ $expiresInMinutes }} minutes.
                        </p>

                        <p
                            style="
                                margin: 12px 0 0;
                                font-size: 12px;
                                line-height: 1.7;
                                color: #888888;
                            "
                        >
                            If you did not request a password reset,
                            you can safely ignore this email.
                        </p>

                    </td>
                </tr>

                <tr>
                    <td
                        style="
                            padding: 20px 32px;
                            background: #fafafa;
                            border-top: 1px solid #eeeeee;
                            font-size: 11px;
                            color: #999999;
                        "
                    >
                        © {{ date('Y') }} Storify. All rights reserved.
                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>

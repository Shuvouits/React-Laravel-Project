<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Exception;

class OpenRouterService
{
    /*
    |--------------------------------------------------------------------------
    | GENERATE BRAND CONTENT
    |--------------------------------------------------------------------------
    */

    public function generateBrandContent(array $data): array
    {
        $apiKey = config('services.openrouter.key');

        $model = config(
            'services.openrouter.model',
            'openrouter/free'
        );

        $url = config(
            'services.openrouter.url',
            'https://openrouter.ai/api/v1/chat/completions'
        );


        /*
        |--------------------------------------------------------------------------
        | CHECK API KEY
        |--------------------------------------------------------------------------
        */

        if (!$apiKey) {
            throw new Exception(
                'OpenRouter API key is not configured.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | INPUT DATA
        |--------------------------------------------------------------------------
        */

        $name = $data['name'] ?? '';

        $website = $data['website'] ?? '';

        $existingDescription =
            $data['description'] ?? '';


        /*
        |--------------------------------------------------------------------------
        | PROMPT
        |--------------------------------------------------------------------------
        */

        $prompt = <<<PROMPT
You are an ecommerce content assistant.

Create professional brand content for an ecommerce marketplace.

Brand name:
{$name}

Official website:
{$website}

Existing description:
{$existingDescription}

Generate the following:

1. A concise professional brand description.
   Maximum 500 characters.
   Do not invent unsupported claims, awards, statistics, founding dates, or guarantees.

2. SEO page title.
   Maximum 70 characters.
   Make it natural and useful for search users.

3. Meta description.
   Maximum 160 characters.
   Clearly describe the brand without keyword stuffing.

4. URL slug.
   Lowercase, short, hyphen-separated.

Return ONLY valid JSON.

Use exactly this structure:

{
  "description": "Brand description here",
  "seo_title": "SEO title here",
  "seo_description": "Meta description here",
  "slug": "brand-slug"
}

Do not include markdown.
Do not include code fences.
Do not include explanations outside the JSON.
PROMPT;


        /*
        |--------------------------------------------------------------------------
        | OPENROUTER REQUEST
        |--------------------------------------------------------------------------
        */

        $response = Http::withHeaders([

            'Authorization' =>
                'Bearer ' . $apiKey,

            'Content-Type' =>
                'application/json',

            'Accept' =>
                'application/json',

            /*
            |--------------------------------------------------------------------------
            | OPTIONAL OPENROUTER HEADERS
            |--------------------------------------------------------------------------
            */

            'HTTP-Referer' =>
                config('app.url'),

            'X-Title' =>
                config(
                    'app.name',
                    'Storify'
                ),

        ])
        ->timeout(60)
        ->post($url, [

            'model' => $model,

            'messages' => [

                [
                    'role' => 'system',

                    'content' =>
                        'You generate concise, accurate ecommerce brand content and always return valid JSON.',
                ],

                [
                    'role' => 'user',

                    'content' => $prompt,
                ],

            ],

            /*
            |--------------------------------------------------------------------------
            | KEEP OUTPUT CONSISTENT
            |--------------------------------------------------------------------------
            */

            'temperature' => 0.4,

            'max_tokens' => 700,

        ]);


        /*
        |--------------------------------------------------------------------------
        | API ERROR
        |--------------------------------------------------------------------------
        */

        if (!$response->successful()) {

            $message =
                $response->json(
                    'error.message'
                )
                ??
                $response->body()
                ??
                'OpenRouter request failed.';


            throw new Exception(
                $message
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GET AI CONTENT
        |--------------------------------------------------------------------------
        */

        $content =
            $response->json(
                'choices.0.message.content'
            );


        if (!$content) {

            throw new Exception(
                'OpenRouter returned an empty response.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | REMOVE POSSIBLE MARKDOWN CODE FENCES
        |--------------------------------------------------------------------------
        */

        $content = trim($content);

        $content = preg_replace(
            '/^```(?:json)?\s*/i',
            '',
            $content
        );

        $content = preg_replace(
            '/\s*```$/',
            '',
            $content
        );


        /*
        |--------------------------------------------------------------------------
        | DECODE JSON
        |--------------------------------------------------------------------------
        */

        $generated =
            json_decode(
                $content,
                true
            );


        /*
        |--------------------------------------------------------------------------
        | FALLBACK: FIND JSON OBJECT
        |--------------------------------------------------------------------------
        */

        if (
            !is_array($generated)
        ) {

            preg_match(
                '/\{.*\}/s',
                $content,
                $matches
            );


            if (!empty($matches[0])) {

                $generated =
                    json_decode(
                        $matches[0],
                        true
                    );

            }

        }


        if (!is_array($generated)) {

            throw new Exception(
                'AI returned an invalid response format.'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CLEAN DATA
        |--------------------------------------------------------------------------
        */

        $description =
            trim(
                $generated['description']
                ?? ''
            );


        $seoTitle =
            trim(
                $generated['seo_title']
                ?? ''
            );


        $seoDescription =
            trim(
                $generated[
                    'seo_description'
                ]
                ?? ''
            );


        $slug =
            Str::slug(
                $generated['slug']
                ?? $name
            );


        /*
        |--------------------------------------------------------------------------
        | ENFORCE FIELD LENGTHS
        |--------------------------------------------------------------------------
        */

        return [

            'description' =>
                Str::limit(
                    $description,
                    500,
                    ''
                ),

            'seo_title' =>
                Str::limit(
                    $seoTitle,
                    70,
                    ''
                ),

            'seo_description' =>
                Str::limit(
                    $seoDescription,
                    160,
                    ''
                ),

            'slug' =>
                $slug,

        ];
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CollectionAIController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GENERATE COLLECTION CONTENT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/ai/collection-content
    |
    | target:
    |
    | description
    | seo
    | all
    |
    */

    public function generate(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([

                'title' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'description' => [
                    'nullable',
                    'string',
                    'max:3000',
                ],

                'collection_type' => [
                    'nullable',
                    'string',
                    'max:50',
                ],

                'product_names' => [
                    'nullable',
                    'array',
                ],

                'product_names.*' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'prompt' => [
                    'nullable',
                    'string',
                    'max:1500',
                ],

                'tone' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'target' => [
                    'required',

                    'in:description,seo,all',
                ],

            ]);


        /*
        |--------------------------------------------------------------------------
        | OPENROUTER
        |--------------------------------------------------------------------------
        */

        $apiKey =
            config(
                'services.openrouter.key'
            );


        $model =
            config(
                'services.openrouter.model',
                'openrouter/free'
            );


        if (! $apiKey) {

            return response()->json([

                'status' => false,

                'message' =>
                    'OpenRouter API key is not configured.',

            ], 500);
        }


        /*
        |--------------------------------------------------------------------------
        | DATA
        |--------------------------------------------------------------------------
        */

        $title =
            trim(
                $validated['title']
            );


        $description =
            trim(
                $validated[
                    'description'
                ]
                ?? ''
            );


        $collectionType =
            trim(
                $validated[
                    'collection_type'
                ]
                ?? 'manual'
            );


        $productNames =
            $validated[
                'product_names'
            ]
            ?? [];


        $customPrompt =
            trim(
                $validated[
                    'prompt'
                ]
                ?? ''
            );


        $tone =
            trim(
                $validated[
                    'tone'
                ]
                ?? 'default'
            );


        $target =
            $validated['target'];


        /*
        |--------------------------------------------------------------------------
        | PROMPTS
        |--------------------------------------------------------------------------
        */

        $systemPrompt =
            $this->buildSystemPrompt(
                $target
            );


        $userPrompt =
            $this->buildUserPrompt(

                title:
                    $title,

                description:
                    $description,

                collectionType:
                    $collectionType,

                productNames:
                    $productNames,

                customPrompt:
                    $customPrompt,

                tone:
                    $tone,

                target:
                    $target

            );


        try {

            /*
            |--------------------------------------------------------------------------
            | REQUEST
            |--------------------------------------------------------------------------
            */

            $response =
                Http::withHeaders([

                    'Authorization' =>
                        'Bearer '
                        . $apiKey,

                    'Content-Type' =>
                        'application/json',

                    'HTTP-Referer' =>
                        config(
                            'app.url'
                        ),

                    'X-Title' =>
                        config(
                            'app.name',
                            'Storify'
                        ),

                ])
                ->timeout(60)
                ->post(

                    'https://openrouter.ai/api/v1/chat/completions',

                    [

                        'model' =>
                            $model,

                        'messages' => [

                            [
                                'role' =>
                                    'system',

                                'content' =>
                                    $systemPrompt,
                            ],

                            [
                                'role' =>
                                    'user',

                                'content' =>
                                    $userPrompt,
                            ],

                        ],

                        'temperature' =>
                            0.6,

                    ]

                );


            /*
            |--------------------------------------------------------------------------
            | PROVIDER ERROR
            |--------------------------------------------------------------------------
            */

            if (
                ! $response->successful()
            ) {

                return response()->json([

                    'status' => false,

                    'message' =>
                        $response->json(
                            'error.message'
                        )
                        ??
                        'OpenRouter failed to generate collection content.',

                    'provider_status' =>
                        $response->status(),

                ], 502);
            }


            /*
            |--------------------------------------------------------------------------
            | CONTENT
            |--------------------------------------------------------------------------
            */

            $content =
                $response->json(
                    'choices.0.message.content'
                );


            if (! $content) {

                return response()->json([

                    'status' => false,

                    'message' =>
                        'AI returned an empty response.',

                ], 502);
            }


            /*
            |--------------------------------------------------------------------------
            | JSON
            |--------------------------------------------------------------------------
            */

            $generated =
                $this->parseAIJson(
                    $content
                );


            if (
                ! is_array(
                    $generated
                )
            ) {

                return response()->json([

                    'status' => false,

                    'message' =>
                        'AI returned an invalid response format.',

                ], 502);
            }


            /*
            |--------------------------------------------------------------------------
            | NORMALIZE
            |--------------------------------------------------------------------------
            */

            $data =
                $this->normalizeGeneratedData(

                    generated:
                        $generated,

                    collectionTitle:
                        $title,

                    target:
                        $target

                );


            return response()->json([

                'status' => true,

                'message' =>
                    'Collection content generated successfully.',

                'data' =>
                    $data,

            ]);

        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to generate collection content at this time.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SYSTEM PROMPT
    |--------------------------------------------------------------------------
    */

    private function buildSystemPrompt(
        string $target
    ): string {

        $base = <<<PROMPT
You are an ecommerce content assistant inside a store management dashboard.

Create concise, shopper-friendly collection content.

Important rules:

1. Return valid JSON only.
2. Do not use markdown.
3. Do not wrap the response in code fences.
4. Do not add commentary before or after the JSON.
5. Never invent unsupported prices, statistics, guarantees, certifications, awards, or claims.
6. Do not keyword stuff.
7. Use clear ecommerce language.
8. Keep the copy useful to shoppers.
9. Avoid repetitive wording.
10. Do not fabricate details about products that were not provided.
PROMPT;


        /*
        |--------------------------------------------------------------------------
        | DESCRIPTION
        |--------------------------------------------------------------------------
        */

        if (
            $target ===
            'description'
        ) {

            return $base . <<<PROMPT


Generate only the ecommerce collection description.

Return exactly:

{
    "description": "..."
}

Requirements:

- Write a concise collection description.
- Explain what shoppers can expect from the collection.
- Use natural language.
- Avoid unnecessary sales hype.
- Do not begin with "Welcome to".
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */

        if (
            $target ===
            'seo'
        ) {

            return $base . <<<PROMPT


Generate SEO content for this ecommerce collection.

Return exactly:

{
    "seo_title": "...",
    "seo_description": "...",
    "slug": "..."
}

Requirements:

- SEO title maximum 70 characters.
- SEO description maximum 160 characters.
- Slug must be lowercase and hyphen-separated.
- Clearly communicate the collection topic.
- Avoid keyword stuffing.
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | ALL
        |--------------------------------------------------------------------------
        */

        return $base . <<<PROMPT


Generate complete ecommerce collection content.

Return exactly:

{
    "description": "...",
    "seo_title": "...",
    "seo_description": "...",
    "slug": "..."
}

Requirements:

Description:
- Clear and useful to shoppers.
- Concise.
- No unsupported claims.

SEO title:
- Maximum 70 characters.

SEO description:
- Maximum 160 characters.

Slug:
- Lowercase.
- Concise.
- Hyphen-separated.
PROMPT;
    }


    /*
    |--------------------------------------------------------------------------
    | USER PROMPT
    |--------------------------------------------------------------------------
    */

    private function buildUserPrompt(
        string $title,
        string $description,
        string $collectionType,
        array $productNames,
        string $customPrompt,
        string $tone,
        string $target
    ): string {

        $toneText =
            $this->getToneInstruction(
                $tone
            );


        $prompt = <<<PROMPT
Collection title: {$title}

Collection type: {$collectionType}

Requested target: {$target}

Tone: {$toneText}
PROMPT;


        /*
        |--------------------------------------------------------------------------
        | CURRENT DESCRIPTION
        |--------------------------------------------------------------------------
        */

        if (
            $description !== ''
        ) {

            $prompt .= <<<PROMPT


Existing description:
{$description}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | SELECTED PRODUCTS
        |--------------------------------------------------------------------------
        */

        if (
            ! empty(
                $productNames
            )
        ) {

            $safeNames =
                collect(
                    $productNames
                )
                ->filter()
                ->take(20)
                ->implode(', ');


            if (
                $safeNames !== ''
            ) {

                $prompt .= <<<PROMPT


Products currently selected in this collection:
{$safeNames}

Use these product names only as contextual clues. Do not invent features or specifications.
PROMPT;

            }

        }


        /*
        |--------------------------------------------------------------------------
        | CUSTOM PROMPT
        |--------------------------------------------------------------------------
        */

        if (
            $customPrompt !== ''
        ) {

            $prompt .= <<<PROMPT


Additional user instruction:
{$customPrompt}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | FINAL
        |--------------------------------------------------------------------------
        */

        $prompt .= <<<PROMPT


Generate the requested collection content now.
Return valid JSON only.
PROMPT;


        return $prompt;
    }


    /*
    |--------------------------------------------------------------------------
    | TONE
    |--------------------------------------------------------------------------
    */

    private function getToneInstruction(
        string $tone
    ): string {

        return match (
            strtolower(
                trim(
                    $tone
                )
            )
        ) {

            'friendly' =>
                'Friendly, approachable, and easy to understand.',

            'professional' =>
                'Professional, polished, and clear.',

            'luxury' =>
                'Premium and refined without exaggerated claims.',

            'playful' =>
                'Light, energetic, and engaging while remaining useful.',

            'supportive' =>
                'Helpful, reassuring, and straightforward.',

            default =>
                'Natural, concise, and professional ecommerce language.',

        };
    }


    /*
    |--------------------------------------------------------------------------
    | PARSE AI JSON
    |--------------------------------------------------------------------------
    */

    private function parseAIJson(
        string $content
    ): ?array {

        $content =
            trim(
                $content
            );


        /*
        |--------------------------------------------------------------------------
        | REMOVE CODE FENCE
        |--------------------------------------------------------------------------
        */

        $content =
            preg_replace(
                '/^```(?:json)?\s*/i',
                '',
                $content
            );


        $content =
            preg_replace(
                '/\s*```$/',
                '',
                $content
            );


        $content =
            trim(
                $content
            );


        /*
        |--------------------------------------------------------------------------
        | DIRECT JSON
        |--------------------------------------------------------------------------
        */

        $decoded =
            json_decode(
                $content,
                true
            );


        if (
            json_last_error()
            ===
            JSON_ERROR_NONE
        ) {

            return $decoded;

        }


        /*
        |--------------------------------------------------------------------------
        | EXTRACT JSON OBJECT
        |--------------------------------------------------------------------------
        */

        $start =
            strpos(
                $content,
                '{'
            );


        $end =
            strrpos(
                $content,
                '}'
            );


        if (
            $start === false ||
            $end === false ||
            $end <= $start
        ) {

            return null;

        }


        $json =
            substr(
                $content,
                $start,
                $end - $start + 1
            );


        $decoded =
            json_decode(
                $json,
                true
            );


        if (
            json_last_error()
            !==
            JSON_ERROR_NONE
        ) {

            return null;

        }


        return $decoded;
    }


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE GENERATED DATA
    |--------------------------------------------------------------------------
    */

    private function normalizeGeneratedData(
        array $generated,
        string $collectionTitle,
        string $target
    ): array {

        $data = [];


        /*
        |--------------------------------------------------------------------------
        | DESCRIPTION
        |--------------------------------------------------------------------------
        */

        if (
            in_array(
                $target,
                [
                    'description',
                    'all',
                ],
                true
            )
        ) {

            $data['description'] =
                trim(
                    (string)
                    (
                        $generated[
                            'description'
                        ]
                        ?? ''
                    )
                );

        }


        /*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */

        if (
            in_array(
                $target,
                [
                    'seo',
                    'all',
                ],
                true
            )
        ) {

            $seoTitle =
                trim(
                    (string)
                    (
                        $generated[
                            'seo_title'
                        ]
                        ??
                        $collectionTitle
                    )
                );


            $seoDescription =
                trim(
                    (string)
                    (
                        $generated[
                            'seo_description'
                        ]
                        ?? ''
                    )
                );


            $slug =
                trim(
                    (string)
                    (
                        $generated[
                            'slug'
                        ]
                        ??
                        $collectionTitle
                    )
                );


            $data['seo_title'] =
                Str::limit(
                    $seoTitle,
                    70,
                    ''
                );


            $data['seo_description'] =
                Str::limit(
                    $seoDescription,
                    160,
                    ''
                );


            $data['slug'] =
                Str::slug(
                    $slug
                );

        }


        return $data;
    }
}

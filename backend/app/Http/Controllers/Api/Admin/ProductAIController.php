<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Http;

use Illuminate\Support\Str;

class ProductAIController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GENERATE PRODUCT CONTENT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/ai/product-content
    |
    | target:
    |
    | summary
    | description
    | specifications
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

                'summary' => [
                    'nullable',
                    'string',
                    'max:3000',
                ],

                'description' => [
                    'nullable',
                    'string',
                ],

                'specifications' => [
                    'nullable',
                    'string',
                ],

                'category_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'brand_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'type' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'tags' => [
                    'nullable',
                    'array',
                ],

                'tags.*' => [
                    'string',
                    'max:100',
                ],

                'variant_names' => [
                    'nullable',
                    'array',
                ],

                'variant_names.*' => [
                    'string',
                    'max:255',
                ],

                'prompt' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],

                'tone' => [
                    'nullable',
                    'string',
                    'max:100',
                ],

                'target' => [
                    'required',

                    'in:summary,description,specifications,seo,all',
                ],

            ]);


        /*
        |--------------------------------------------------------------------------
        | OPENROUTER CONFIG
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


        $summary =
            trim(
                $validated[
                    'summary'
                ]
                ?? ''
            );


        $description =
            trim(
                $validated[
                    'description'
                ]
                ?? ''
            );


        $specifications =
            trim(
                $validated[
                    'specifications'
                ]
                ?? ''
            );


        $category =
            trim(
                $validated[
                    'category_name'
                ]
                ?? ''
            );


        $brand =
            trim(
                $validated[
                    'brand_name'
                ]
                ?? ''
            );


        $type =
            trim(
                $validated['type']
                ?? ''
            );


        $tags =
            $validated['tags']
            ?? [];


        $variantNames =
            $validated[
                'variant_names'
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
            $validated[
                'target'
            ];


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

                summary:
                    $summary,

                description:
                    $description,

                specifications:
                    $specifications,

                category:
                    $category,

                brand:
                    $brand,

                type:
                    $type,

                tags:
                    $tags,

                variantNames:
                    $variantNames,

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
            | OPENROUTER REQUEST
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
                ->timeout(90)
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
                            0.55,

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
                        'OpenRouter failed to generate product content.',

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
            | PARSE JSON
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

                    productTitle:
                        $title,

                    target:
                        $target

                );


            return response()->json([

                'status' => true,

                'message' =>
                    'Product content generated successfully.',

                'data' =>
                    $data,

            ]);

        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to generate product content at this time.',

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
You are an ecommerce product content assistant inside a store management dashboard.

Your job is to create useful, accurate, conversion-friendly product content based only on the information provided by the user.

Rules:

1. Return valid JSON only.
2. Do not use Markdown code fences.
3. Do not add commentary outside the JSON object.
4. Never invent unsupported specifications, dimensions, materials, certifications, warranties, prices, performance claims, awards, ingredients, compatibility, or technical features.
5. If a specific fact is not provided, do not fabricate it.
6. Avoid keyword stuffing.
7. Avoid generic filler.
8. Use clear ecommerce language.
9. Keep wording natural and shopper-friendly.
10. Do not make medical, legal, safety, or performance claims unless explicitly provided.
11. Do not repeat the product title excessively.
12. Preserve factual information supplied by the user.
PROMPT;


        /*
        |--------------------------------------------------------------------------
        | SUMMARY
        |--------------------------------------------------------------------------
        */

        if (
            $target ===
            'summary'
        ) {

            return $base . <<<PROMPT


Generate only the short product summary.

Return exactly:

{
    "summary": "..."
}

Requirements:

- 1 to 3 concise sentences.
- Explain what the product is and its main appeal.
- Suitable for the summary field near the top of a product page.
- Do not use HTML.
PROMPT;

        }


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


Generate only the full ecommerce product description.

Return exactly:

{
    "description": "..."
}

Requirements:

- Return simple HTML inside the description string.
- Allowed tags: <p>, <h2>, <h3>, <ul>, <li>, <strong>.
- No style attributes.
- No scripts.
- No links unless explicitly supplied.
- Begin with useful product information rather than filler.
- Use short paragraphs.
- Use bullet points only when they add value.
- Do not invent specifications.
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | SPECIFICATIONS
        |--------------------------------------------------------------------------
        */

        if (
            $target ===
            'specifications'
        ) {

            return $base . <<<PROMPT


Generate only the specifications section.

Return exactly:

{
    "specifications": "..."
}

Requirements:

- Return simple HTML.
- Allowed tags: <p>, <h3>, <ul>, <li>, <strong>.
- Only include specifications clearly supported by the supplied product information.
- Never guess dimensions, materials, model numbers, capacity, weight, compatibility, or technical measurements.
- If very little specification information is supplied, create a minimal factual section instead of inventing details.
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


Generate ecommerce SEO fields.

Return exactly:

{
    "seo_title": "...",
    "seo_description": "...",
    "slug": "..."
}

Requirements:

- SEO title maximum 70 characters.
- SEO description maximum 160 characters.
- Clearly describe the product.
- Slug must be lowercase and hyphen-separated.
- Do not keyword stuff.
- Do not use vague calls such as "Discover", "Explore", or "Learn more".
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | ALL
        |--------------------------------------------------------------------------
        */

        return $base . <<<PROMPT


Generate the complete ecommerce product content set.

Return exactly:

{
    "summary": "...",
    "description": "...",
    "specifications": "...",
    "seo_title": "...",
    "seo_description": "...",
    "slug": "..."
}

Requirements:

Summary:
- 1 to 3 concise sentences.
- Plain text.

Description:
- Useful ecommerce description.
- Simple HTML using only <p>, <h2>, <h3>, <ul>, <li>, <strong>.
- Do not invent unsupported product details.

Specifications:
- Simple HTML.
- Include factual specifications only.

SEO title:
- Maximum 70 characters.

SEO description:
- Maximum 160 characters.

Slug:
- Lowercase.
- Hyphen-separated.
- Concise.
PROMPT;
    }


    /*
    |--------------------------------------------------------------------------
    | USER PROMPT
    |--------------------------------------------------------------------------
    */

    private function buildUserPrompt(
        string $title,
        string $summary,
        string $description,
        string $specifications,
        string $category,
        string $brand,
        string $type,
        array $tags,
        array $variantNames,
        string $customPrompt,
        string $tone,
        string $target
    ): string {

        $toneInstruction =
            $this->toneInstruction(
                $tone
            );


        $prompt = <<<PROMPT
Product title:
{$title}

Requested content:
{$target}

Tone:
{$toneInstruction}
PROMPT;


        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        if ($category !== '') {

            $prompt .= <<<PROMPT


Category:
{$category}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | BRAND
        |--------------------------------------------------------------------------
        */

        if ($brand !== '') {

            $prompt .= <<<PROMPT


Brand:
{$brand}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | PRODUCT TYPE
        |--------------------------------------------------------------------------
        */

        if ($type !== '') {

            $prompt .= <<<PROMPT


Product type:
{$type}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | TAGS
        |--------------------------------------------------------------------------
        */

        if (! empty($tags)) {

            $tagString =
                collect(
                    $tags
                )
                ->filter()
                ->take(20)
                ->implode(', ');


            if ($tagString !== '') {

                $prompt .= <<<PROMPT


Tags:
{$tagString}
PROMPT;

            }

        }


        /*
        |--------------------------------------------------------------------------
        | VARIANTS
        |--------------------------------------------------------------------------
        */

        if (
            ! empty(
                $variantNames
            )
        ) {

            $variantString =
                collect(
                    $variantNames
                )
                ->filter()
                ->take(50)
                ->implode(', ');


            if (
                $variantString !== ''
            ) {

                $prompt .= <<<PROMPT


Available variants:
{$variantString}
PROMPT;

            }

        }


        /*
        |--------------------------------------------------------------------------
        | EXISTING SUMMARY
        |--------------------------------------------------------------------------
        */

        if ($summary !== '') {

            $prompt .= <<<PROMPT


Existing summary:
{$summary}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | EXISTING DESCRIPTION
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
        | EXISTING SPECIFICATIONS
        |--------------------------------------------------------------------------
        */

        if (
            $specifications !== ''
        ) {

            $prompt .= <<<PROMPT


Existing specifications:
{$specifications}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | CUSTOM USER PROMPT
        |--------------------------------------------------------------------------
        */

        if (
            $customPrompt !== ''
        ) {

            $prompt .= <<<PROMPT


Additional instruction from the store administrator:
{$customPrompt}
PROMPT;

        }


        $prompt .= <<<PROMPT


Generate the requested product content now.
Return valid JSON only.
PROMPT;


        return $prompt;
    }


    /*
    |--------------------------------------------------------------------------
    | TONE
    |--------------------------------------------------------------------------
    */

    private function toneInstruction(
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
                'Professional, polished, concise, and informative.',

            'luxury' =>
                'Premium, refined, and confident without exaggerated claims.',

            'playful' =>
                'Light, energetic, and engaging while remaining useful.',

            'supportive' =>
                'Helpful, reassuring, and straightforward.',

            'technical' =>
                'Precise and informative while remaining readable for shoppers.',

            default =>
                'Natural, professional, concise ecommerce language.',

        };
    }


    /*
    |--------------------------------------------------------------------------
    | PARSE JSON RESPONSE
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
        | REMOVE POSSIBLE MARKDOWN FENCE
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
        | EXTRACT FIRST JSON OBJECT
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
    | NORMALIZE GENERATED CONTENT
    |--------------------------------------------------------------------------
    */

    private function normalizeGeneratedData(
        array $generated,
        string $productTitle,
        string $target
    ): array {

        $data = [];


        /*
        |--------------------------------------------------------------------------
        | SUMMARY
        |--------------------------------------------------------------------------
        */

        if (
            in_array(
                $target,
                [
                    'summary',
                    'all',
                ],
                true
            )
        ) {

            $data['summary'] =
                trim(
                    (string)
                    (
                        $generated[
                            'summary'
                        ]
                        ?? ''
                    )
                );

        }


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
        | SPECIFICATIONS
        |--------------------------------------------------------------------------
        */

        if (
            in_array(
                $target,
                [
                    'specifications',
                    'all',
                ],
                true
            )
        ) {

            $data['specifications'] =
                trim(
                    (string)
                    (
                        $generated[
                            'specifications'
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
                        $productTitle
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
                        $productTitle
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

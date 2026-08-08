<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CategoryAIController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GENERATE CATEGORY CONTENT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/ai/category-content
    |
    | target:
    |
    | description
    | seo
    | tags
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

        $validated = $request->validate([

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'parent_category' => [
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
                'in:description,seo,tags,all',
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
        | REQUEST DATA
        |--------------------------------------------------------------------------
        */

        $name =
            trim(
                $validated['name']
            );


        $description =
            trim(
                $validated['description']
                ?? ''
            );


        $parentCategory =
            trim(
                $validated['parent_category']
                ?? ''
            );


        $customPrompt =
            trim(
                $validated['prompt']
                ?? ''
            );


        $tone =
            trim(
                $validated['tone']
                ?? 'default'
            );


        $target =
            $validated['target'];


        /*
        |--------------------------------------------------------------------------
        | BUILD SYSTEM PROMPT
        |--------------------------------------------------------------------------
        */

        $systemPrompt =
            $this->buildSystemPrompt(
                $target
            );


        /*
        |--------------------------------------------------------------------------
        | BUILD USER PROMPT
        |--------------------------------------------------------------------------
        */

        $userPrompt =
            $this->buildUserPrompt(

                name:
                    $name,

                description:
                    $description,

                parentCategory:
                    $parentCategory,

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
                        'Bearer ' .
                        $apiKey,

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

                        /*
                        |--------------------------------------------------------------------------
                        | LOWER TEMPERATURE
                        |--------------------------------------------------------------------------
                        |
                        | E-commerce content-এর জন্য consistent result.
                        |
                        */

                        'temperature' =>
                            0.6,

                    ]

                );


            /*
            |--------------------------------------------------------------------------
            | OPENROUTER ERROR
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
                        'OpenRouter failed to generate category content.',

                    'provider_status' =>
                        $response->status(),

                ], 502);
            }


            /*
            |--------------------------------------------------------------------------
            | GET AI RESPONSE
            |--------------------------------------------------------------------------
            */

            $content =
                $response->json(
                    'choices.0.message.content'
                );


            if (
                ! $content
            ) {

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
            | NORMALIZE GENERATED CONTENT
            |--------------------------------------------------------------------------
            */

            $data =
                $this->normalizeGeneratedData(
                    generated:
                        $generated,

                    categoryName:
                        $name,

                    target:
                        $target
                );


            /*
            |--------------------------------------------------------------------------
            | SUCCESS
            |--------------------------------------------------------------------------
            */

            return response()->json([

                'status' => true,

                'message' =>
                    'Category content generated successfully.',

                'data' =>
                    $data,

            ]);

        } catch (\Throwable $error) {

            /*
            |--------------------------------------------------------------------------
            | SERVER ERROR
            |--------------------------------------------------------------------------
            */

            report(
                $error
            );


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to generate category content at this time.',

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

        $basePrompt = <<<PROMPT
You are an ecommerce content assistant inside a product management dashboard.

Your job is to generate concise, professional, useful ecommerce category content.

Important rules:

1. Return valid JSON only.
2. Never include markdown.
3. Never wrap the JSON in code fences.
4. Never include explanations before or after the JSON.
5. Do not invent unsupported claims, statistics, guarantees, prices, certifications, or company history.
6. Avoid keyword stuffing.
7. Use natural ecommerce language.
8. Keep content useful for shoppers and search engines.
9. Avoid repetitive wording.
10. The category name must remain accurate.
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

            return $basePrompt . <<<PROMPT

Generate only a category description.

Return exactly:

{
    "description": "..."
}

Description requirements:

- Maximum 500 characters.
- Explain what shoppers can expect in this category.
- Do not sound like an advertisement.
- Do not begin with generic phrases such as "Welcome to".
- Do not repeat the category name unnecessarily.
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

            return $basePrompt . <<<PROMPT

Generate SEO information for the ecommerce category.

Return exactly:

{
    "seo_title": "...",
    "seo_description": "...",
    "slug": "..."
}

Requirements:

- SEO title: maximum 70 characters.
- SEO description: maximum 160 characters.
- Slug: lowercase, concise, hyphen-separated.
- SEO description should clearly explain the category.
- Avoid keyword stuffing.
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | TAGS
        |--------------------------------------------------------------------------
        */

        if (
            $target ===
            'tags'
        ) {

            return $basePrompt . <<<PROMPT

Generate useful internal category tags.

Return exactly:

{
    "tags": [
        "tag one",
        "tag two",
        "tag three"
    ]
}

Requirements:

- Generate between 3 and 8 tags.
- Keep tags short.
- Tags must be directly relevant to the category.
- Do not include duplicate tags.
- Do not include hashtags.
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | ALL
        |--------------------------------------------------------------------------
        */

        return $basePrompt . <<<PROMPT

Generate complete ecommerce category content.

Return exactly:

{
    "description": "...",
    "seo_title": "...",
    "seo_description": "...",
    "slug": "...",
    "tags": [
        "tag one",
        "tag two",
        "tag three"
    ]
}

Requirements:

Description:
- Maximum 500 characters.
- Shopper-friendly.
- Explain the category naturally.

SEO title:
- Maximum 70 characters.

SEO description:
- Maximum 160 characters.

Slug:
- Lowercase.
- Hyphen-separated.
- Concise.

Tags:
- 3 to 8 directly relevant tags.
PROMPT;

    }


    /*
    |--------------------------------------------------------------------------
    | USER PROMPT
    |--------------------------------------------------------------------------
    */

    private function buildUserPrompt(
        string $name,
        string $description,
        string $parentCategory,
        string $customPrompt,
        string $tone,
        string $target
    ): string {

        /*
        |--------------------------------------------------------------------------
        | TONE
        |--------------------------------------------------------------------------
        */

        $toneInstruction =
            $this->getToneInstruction(
                $tone
            );


        /*
        |--------------------------------------------------------------------------
        | CATEGORY CONTEXT
        |--------------------------------------------------------------------------
        */

        $prompt = <<<PROMPT
Category name: {$name}

Target: {$target}

Tone: {$toneInstruction}
PROMPT;


        /*
        |--------------------------------------------------------------------------
        | PARENT
        |--------------------------------------------------------------------------
        */

        if (
            $parentCategory !== ''
        ) {

            $prompt .= <<<PROMPT


Parent category: {$parentCategory}
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


Existing category description:
{$description}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | CUSTOM USER INSTRUCTION
        |--------------------------------------------------------------------------
        */

        if (
            $customPrompt !== ''
        ) {

            $prompt .= <<<PROMPT


Additional instruction from the user:
{$customPrompt}
PROMPT;

        }


        /*
        |--------------------------------------------------------------------------
        | FINAL INSTRUCTION
        |--------------------------------------------------------------------------
        */

        $prompt .= <<<PROMPT


Generate the requested ecommerce category content now.
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
                $tone
            )
        ) {

            'friendly' =>
                'Friendly, approachable, and clear.',

            'professional' =>
                'Professional, polished, and trustworthy.',

            'luxury' =>
                'Premium, refined, and sophisticated without exaggeration.',

            'playful' =>
                'Light, energetic, and playful while remaining useful.',

            'supportive' =>
                'Helpful, reassuring, and easy to understand.',

            default =>
                'Natural, clear, concise ecommerce language.',

        };
    }


    /*
    |--------------------------------------------------------------------------
    | PARSE AI JSON
    |--------------------------------------------------------------------------
    |
    | Some models may still return:
    |
    | ```json
    | {...}
    | ```
    |
    | This removes the code fence safely.
    |
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
        | REMOVE MARKDOWN CODE BLOCK
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
        | FIRST JSON ATTEMPT
        |--------------------------------------------------------------------------
        */

        $decoded =
            json_decode(
                $content,
                true
            );


        if (
            json_last_error() ===
            JSON_ERROR_NONE
        ) {

            return $decoded;
        }


        /*
        |--------------------------------------------------------------------------
        | TRY TO EXTRACT JSON OBJECT
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
            json_last_error() !==
            JSON_ERROR_NONE
        ) {

            return null;
        }


        return $decoded;
    }


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE RESPONSE
    |--------------------------------------------------------------------------
    */

    private function normalizeGeneratedData(
        array $generated,
        string $categoryName,
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

            $description =
                trim(
                    (string)
                    (
                        $generated['description']
                        ?? ''
                    )
                );


            $data['description'] =
                Str::limit(
                    $description,
                    500,
                    ''
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
                        $generated['seo_title']
                        ??
                        $categoryName
                    )
                );


            $seoDescription =
                trim(
                    (string)
                    (
                        $generated['seo_description']
                        ?? ''
                    )
                );


            $slug =
                trim(
                    (string)
                    (
                        $generated['slug']
                        ??
                        $categoryName
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


        /*
        |--------------------------------------------------------------------------
        | TAGS
        |--------------------------------------------------------------------------
        */

        if (
            in_array(
                $target,
                [
                    'tags',
                    'all',
                ],
                true
            )
        ) {

            $tags =
                $generated['tags']
                ?? [];


            if (
                ! is_array(
                    $tags
                )
            ) {

                $tags = [];

            }


            $tags =
                collect(
                    $tags
                )
                ->map(
                    fn ($tag) =>
                        trim(
                            (string)
                            $tag
                        )
                )
                ->filter()
                ->unique(
                    fn ($tag) =>
                        strtolower(
                            $tag
                        )
                )
                ->take(8)
                ->values()
                ->all();


            $data['tags'] =
                $tags;

        }


        return $data;
    }
}

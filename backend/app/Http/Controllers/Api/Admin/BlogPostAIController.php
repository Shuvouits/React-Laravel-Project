<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class BlogPostAIController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],
            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],
            'excerpt' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'content' => [
                'nullable',
                'string',
            ],
            'category_names' => [
                'nullable',
                'array',
                'max:20',
            ],
            'category_names.*' => [
                'nullable',
                'string',
                'max:255',
            ],
            'tags' => [
                'nullable',
                'array',
                'max:30',
            ],
            'tags.*' => [
                'nullable',
                'string',
                'max:100',
            ],
            'keywords' => [
                'nullable',
                'array',
                'max:30',
            ],
            'keywords.*' => [
                'nullable',
                'string',
                'max:100',
            ],
            'prompt' => [
                'nullable',
                'string',
                'max:3000',
            ],
            'tone' => [
                'nullable',
                'string',
                'max:100',
            ],
            'audience' => [
                'nullable',
                'string',
                'max:255',
            ],
            'target' => [
                'required',
                'in:title,excerpt,content,seo,tags,all',
            ],
        ]);

        $apiKey = config('services.openrouter.key');

        $model = config(
            'services.openrouter.model',
            'openrouter/free'
        );

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'status' => false,
                'message' => 'OpenRouter API key is not configured.',
            ], 500);
        }

        $title = trim($validated['title']);
        $slug = trim($validated['slug'] ?? '');
        $excerpt = trim($validated['excerpt'] ?? '');
        $content = trim($validated['content'] ?? '');
        $categoryNames = $validated['category_names'] ?? [];

        $keywords = array_values(
            array_unique(
                array_filter([
                    ...($validated['tags'] ?? []),
                    ...($validated['keywords'] ?? []),
                ])
            )
        );

        $customPrompt = trim(
            $validated['prompt'] ?? ''
        );

        $tone = trim(
            $validated['tone'] ?? 'professional'
        );

        $audience = trim(
            $validated['audience']
                ?? 'online shoppers and general readers'
        );

        $target = $validated['target'];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config(
                    'app.name',
                    'Storify'
                ),
            ])
                ->acceptJson()
                ->timeout(180)
                ->retry(2, 1200)
                ->post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    [
                        'model' => $model,
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => $this->buildSystemPrompt(
                                    $target
                                ),
                            ],
                            [
                                'role' => 'user',
                                'content' => $this->buildUserPrompt(
                                    title: $title,
                                    slug: $slug,
                                    excerpt: $excerpt,
                                    content: $content,
                                    categoryNames: $categoryNames,
                                    keywords: $keywords,
                                    customPrompt: $customPrompt,
                                    tone: $tone,
                                    audience: $audience,
                                    target: $target
                                ),
                            ],
                        ],
                        'temperature' => 0.6,
                        'max_tokens' => $this->getMaxTokens(
                            $target
                        ),
                    ]
                );

            $this->validateResponse($response);

            $finishReason = $response->json(
                'choices.0.finish_reason'
            );

            if ($finishReason === 'length') {
                throw new RuntimeException(
                    'AI response was cut off because it was too long. Please use a shorter prompt and try again.'
                );
            }

            $responseContent = $response->json(
                'choices.0.message.content'
            );

            $generated = $this->parseAIJson(
                $responseContent
            );

            if (!is_array($generated)) {
                throw new RuntimeException(
                    'AI returned an invalid JSON response. Please try again.'
                );
            }

            $result = $this->normalizeResult(
                generated: $generated,
                originalTitle: $title,
                target: $target
            );

            return response()->json([
                'success' => true,
                'status' => true,
                'message' => 'Blog content generated successfully.',
                'data' => $result,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'status' => false,
                'message' => $exception->getMessage()
                    ?: 'Unable to generate blog content at this time.',
            ], 500);
        }
    }

    private function buildSystemPrompt(string $target): string
    {
        $basePrompt = <<<PROMPT
You are a professional ecommerce blog writer and SEO editor.

Write clear, accurate, useful English content for an ecommerce blog.

Important rules:

1. Return one valid JSON object only.
2. Never include Markdown code fences.
3. Never include explanations before or after the JSON.
4. Escape every double quote used inside a JSON string.
5. Do not include raw line breaks that make the JSON invalid.
6. Do not invent statistics, studies, quotes, guarantees, prices, certifications, or company history.
7. Avoid keyword stuffing and repetitive wording.
8. Do not mention artificial intelligence or content generation.
9. Match the requested tone and audience.
10. Do not return fields that are not included in the requested JSON structure.
PROMPT;

        if ($target === 'title') {
            return $basePrompt . <<<'PROMPT'

Generate an improved blog post title and URL slug.

Return exactly this structure:

{
    "title": "Improved blog post title",
    "slug": "improved-blog-post-slug"
}

Requirements:

- Keep the title accurate and engaging.
- Keep the title below 70 characters where practical.
- The slug must be lowercase and hyphen-separated.
- Do not add extra JSON fields.
PROMPT;
        }

        if ($target === 'excerpt') {
            return $basePrompt . <<<'PROMPT'

Generate a concise blog post excerpt.

Return exactly this structure:

{
    "excerpt": "Blog post excerpt"
}

Requirements:

- Write between 60 and 120 words.
- Summarize the main benefit or subject of the post.
- Keep it useful for previews and search snippets.
- Do not include HTML or Markdown.
- Do not add extra JSON fields.
PROMPT;
        }

        if ($target === 'content') {
            return $basePrompt . <<<'PROMPT'

Generate the main blog article content.

Return exactly this structure:

{
    "content": "<p>Article content...</p>"
}

Article requirements:

- Write approximately 800 to 1200 words.
- The content value must contain valid HTML for a TipTap editor.
- Use <p> tags for paragraphs.
- Use <h2> and <h3> tags for useful sections.
- Use <ul>, <ol>, and <li> when lists improve readability.
- Use <strong> and <em> sparingly.
- Do not include an H1 because the post title is already the H1.
- Do not include Markdown.
- Do not include <html>, <head>, <body>, <script>, <style>, iframe, form, object, or embed tags.
- Keep paragraphs concise.
- Escape double quotes inside the JSON string.
- Do not add extra JSON fields.
PROMPT;
        }

        if ($target === 'seo') {
            return $basePrompt . <<<'PROMPT'

Generate SEO information for the blog post.

Return exactly this structure:

{
    "seo_title": "SEO page title",
    "meta_description": "SEO meta description",
    "slug": "blog-post-slug"
}

Requirements:

- SEO title must not exceed 70 characters.
- Meta description must not exceed 160 characters.
- The meta description should directly explain the post.
- The slug must be lowercase, concise, and hyphen-separated.
- Avoid keyword stuffing.
- Do not add extra JSON fields.
PROMPT;
        }

        if ($target === 'tags') {
            return $basePrompt . <<<'PROMPT'

Generate relevant blog post tags.

Return exactly this structure:

{
    "tags": [
        "tag one",
        "tag two",
        "tag three"
    ]
}

Requirements:

- Generate between 3 and 8 tags.
- Keep each tag short and relevant.
- Do not use hashtags.
- Do not return duplicate tags.
- Do not add extra JSON fields.
PROMPT;
        }

        return $basePrompt . <<<'PROMPT'

Generate complete content for the blog post.

Return exactly this structure:

{
    "title": "Blog post title",
    "slug": "blog-post-slug",
    "excerpt": "Blog post excerpt",
    "content": "<p>Article content...</p>",
    "seo_title": "SEO page title",
    "meta_description": "SEO meta description",
    "tags": [
        "tag one",
        "tag two",
        "tag three"
    ]
}

Requirements:

Title:
- Accurate, useful, and engaging.
- Preferably below 70 characters.

Slug:
- Lowercase, concise, and hyphen-separated.

Excerpt:
- Write between 60 and 120 words.
- Do not include HTML or Markdown.

Content:
- Write approximately 700 to 1000 words.
- Use valid TipTap-compatible HTML.
- Use <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, and <em> where appropriate.
- Do not include an H1.
- Do not use Markdown.
- Escape double quotes inside the JSON string.

SEO title:
- Maximum 70 characters.

Meta description:
- Maximum 160 characters.
- Directly explain the article.

Tags:
- Generate 3 to 8 short, relevant tags.
PROMPT;
    }

    private function buildUserPrompt(
        string $title,
        string $slug,
        string $excerpt,
        string $content,
        array $categoryNames,
        array $keywords,
        string $customPrompt,
        string $tone,
        string $audience,
        string $target
    ): string {
        $categories = count($categoryNames)
            ? implode(', ', $categoryNames)
            : 'No category selected';

        $keywordText = count($keywords)
            ? implode(', ', $keywords)
            : 'No specific tags or keywords supplied';

        $existingSlug = $slug !== ''
            ? $slug
            : Str::slug($title);

        $existingExcerpt = $excerpt !== ''
            ? $excerpt
            : 'No excerpt written yet';

        $existingContent = $content !== ''
            ? Str::limit(
                trim(strip_tags($content)),
                4000,
                ''
            )
            : 'No article content written yet';

        $instruction = $customPrompt !== ''
            ? $customPrompt
            : 'Create useful content that matches the title and reader intent.';

        return <<<PROMPT
Blog post title:
{$title}

Current URL slug:
{$existingSlug}

Requested generation target:
{$target}

Selected categories:
{$categories}

Existing tags or target keywords:
{$keywordText}

Preferred tone:
{$tone}

Target audience:
{$audience}

Existing excerpt:
{$existingExcerpt}

Existing article content:
{$existingContent}

Additional instruction from the user:
{$instruction}

Generate the requested blog post content now.
Return valid JSON only.
PROMPT;
    }

    private function getMaxTokens(string $target): int
    {
        return match ($target) {
            'content' => 7000,
            'all' => 7000,
            'excerpt' => 1600,
            'seo' => 1600,
            'title' => 1000,
            'tags' => 1000,
            default => 1600,
        };
    }

    private function validateResponse(Response $response): void
    {
        if ($response->successful()) {
            return;
        }

        $message = $response->json('error.message')
            ?? $response->json('message')
            ?? 'OpenRouter failed to generate blog content.';

        throw new RuntimeException($message);
    }

    private function parseAIJson(mixed $content): ?array
    {
        if (
            !is_string($content) ||
            trim($content) === ''
        ) {
            throw new RuntimeException(
                'AI returned an empty response.'
            );
        }

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

        $content = trim($content);

        $decoded = json_decode(
            $content,
            true
        );

        if (
            json_last_error() === JSON_ERROR_NONE &&
            is_array($decoded)
        ) {
            return $decoded;
        }

        $start = strpos($content, '{');
        $end = strrpos($content, '}');

        if (
            $start === false ||
            $end === false ||
            $end <= $start
        ) {
            return null;
        }

        $json = substr(
            $content,
            $start,
            $end - $start + 1
        );

        $decoded = json_decode(
            $json,
            true
        );

        if (
            json_last_error() !== JSON_ERROR_NONE ||
            !is_array($decoded)
        ) {
            return null;
        }

        return $decoded;
    }

    private function normalizeResult(
        array $generated,
        string $originalTitle,
        string $target
    ): array {
        $data = [
            'target' => $target,
        ];

        if (
            in_array(
                $target,
                ['title', 'all'],
                true
            )
        ) {
            $title = trim(
                (string) (
                    $generated['title']
                    ?? $originalTitle
                )
            );

            if ($title === '') {
                $title = $originalTitle;
            }

            $data['title'] = Str::limit(
                $title,
                255,
                ''
            );

            $data['slug'] = Str::limit(
                Str::slug(
                    (string) (
                        $generated['slug']
                        ?? $title
                    )
                ),
                255,
                ''
            );
        }

        if (
            in_array(
                $target,
                ['excerpt', 'all'],
                true
            )
        ) {
            $excerpt = trim(
                (string) (
                    $generated['excerpt']
                    ?? ''
                )
            );

            $data['excerpt'] = Str::limit(
                $excerpt,
                500,
                ''
            );
        }

        if (
            in_array(
                $target,
                ['content', 'all'],
                true
            )
        ) {
            $content = trim(
                (string) (
                    $generated['content']
                    ?? ''
                )
            );

            $data['content'] =
                $this->sanitizeGeneratedHtml(
                    $content
                );
        }

        if (
            in_array(
                $target,
                ['seo', 'all'],
                true
            )
        ) {
            $seoTitle = trim(
                (string) (
                    $generated['seo_title']
                    ?? $originalTitle
                )
            );

            $metaDescription = trim(
                (string) (
                    $generated['meta_description']
                    ?? ''
                )
            );

            $slug = trim(
                (string) (
                    $generated['slug']
                    ?? $originalTitle
                )
            );

            $data['seo_title'] = Str::limit(
                $seoTitle,
                70,
                ''
            );

            $data['meta_description'] = Str::limit(
                $metaDescription,
                320,
                ''
            );

            $data['slug'] = Str::limit(
                Str::slug($slug),
                255,
                ''
            );
        }

        if (
            in_array(
                $target,
                ['tags', 'all'],
                true
            )
        ) {
            $data['tags'] = $this->normalizeTags(
                $generated['tags'] ?? []
            );
        }

        return $data;
    }

    private function normalizeTags(mixed $tags): array
    {
        if (is_string($tags)) {
            $tags = explode(',', $tags);
        }

        if (!is_array($tags)) {
            return [];
        }

        return collect($tags)
            ->map(function ($tag) {
                return Str::limit(
                    trim(
                        strip_tags(
                            (string) $tag
                        )
                    ),
                    60,
                    ''
                );
            })
            ->filter()
            ->unique(function ($tag) {
                return strtolower($tag);
            })
            ->take(8)
            ->values()
            ->all();
    }

    private function sanitizeGeneratedHtml(
        string $content
    ): string {
        if ($content === '') {
            return '';
        }

        $content = preg_replace(
            '#<script\b[^>]*>.*?</script>#is',
            '',
            $content
        );

        $content = preg_replace(
            '#<style\b[^>]*>.*?</style>#is',
            '',
            $content
        );

        $content = preg_replace(
            '#<(iframe|object|embed|form)\b[^>]*>.*?</\1>#is',
            '',
            $content
        );

        $content = preg_replace(
            '/\son\w+\s*=\s*(["\']).*?\1/is',
            '',
            $content
        );

        $content = preg_replace(
            '/javascript\s*:/i',
            '',
            $content
        );

        return strip_tags(
            $content,
            '<p><br><h2><h3><h4><ul><ol><li><strong><em><u><s><blockquote><code><pre><a><hr>'
        );
    }
}

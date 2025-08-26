<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Page;

class PageController extends Controller 
{
    private const CLOUDFLARE_ZONE_ID = 'c7adab04543a89cb1361a604ecd22d8a';
    private const CLOUDFLARE_API_TOKEN = 'UFd6NKA5tmLuyDHqukXTE_EHVsYVqenYFM6W9vO1';
    
    public function updatePage(Request $request) 
    {
        try {
            // Update content
            $page = Page::where('slug', 'شركات-تداول-مرخصة-في-السعودية')->first();
            
            if (!$page) {
                return response()->json(['error' => 'Page not found'], 404);
            }
            
            $oldContent = $page->content;
            
            $page->update([
                'name' => $request->name,
                'content' => $request->content,
                'updated_at' => now()
            ]);
            
            // Check if content actually changed
            $contentChanged = $oldContent !== $page->content;
            
            if ($contentChanged) {
                // Trigger rebuild and cache tag purge
                $result = $this->triggerRebuildAndPurgeByTags();
                
                return response()->json([
                    'message' => 'Content updated successfully!',
                    'rebuild_triggered' => $result['rebuild_success'],
                    'cache_cleared' => $result['cache_success'],
                    'cache_method' => 'cache_tags',
                    'tags_purged' => ['content-pages', 'arabic-pages'],
                    'estimated_time' => '2-3 minutes'
                ]);
            } else {
                return response()->json([
                    'message' => 'No changes detected',
                    'rebuild_triggered' => false
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Page update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to update content',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    private function triggerRebuildAndPurgeByTags()
    {
        $result = [
            'rebuild_success' => false,
            'cache_success' => false
        ];
        
        // Step 1: Trigger Cloudflare Pages rebuild
        $deployHookUrl = env('CLOUDFLARE_DEPLOY_HOOK_URL');
        
        if ($deployHookUrl) {
            try {
                $rebuildResponse = Http::timeout(30)->post($deployHookUrl, [
                    'reason' => 'Content updated - using cache tags for purging',
                    'source' => 'theqalink-admin',
                    'timestamp' => now()->toISOString()
                ]);
                
                if ($rebuildResponse->successful()) {
                    $result['rebuild_success'] = true;
                    
                    Log::info('Cloudflare Pages rebuild triggered', [
                        'method' => 'deploy_hook',
                        'cache_strategy' => 'cache_tags'
                    ]);
                    
                    // Step 2: Purge by cache tags (no Arabic URL issues!)
                    $result['cache_success'] = $this->purgeCacheTags([
                        'content-pages',
                        'arabic-pages'
                    ]);
                    
                } else {
                    Log::error('Failed to trigger rebuild', [
                        'status' => $rebuildResponse->status(),
                        'body' => $rebuildResponse->body()
                    ]);
                }
                
            } catch (\Exception $e) {
                Log::error('Rebuild webhook error', [
                    'error' => $e->getMessage()
                ]);
            }
        } else {
            Log::warning('CLOUDFLARE_DEPLOY_HOOK_URL not configured');
        }
        
        return $result;
    }
    
    // 🎯 THE MAGIC: Purge by Cache Tags (works with Arabic URLs!)
    private function purgeCacheTags(array $tags)
    {
        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . self::CLOUDFLARE_API_TOKEN,
                    'Content-Type' => 'application/json'
                ])
                ->post("https://api.cloudflare.com/client/v4/zones/" . self::CLOUDFLARE_ZONE_ID . "/purge_cache", [
                    'tags' => $tags
                ]);
            
            if ($response->successful()) {
                Log::info('Cache tags purged successfully', [
                    'tags' => $tags,
                    'response' => $response->json()
                ]);
                return true;
                
            } else {
                Log::error('Cache tags purge failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'tags' => $tags
                ]);
                return false;
            }
            
        } catch (\Exception $e) {
            Log::error('Cache tags purge error', [
                'error' => $e->getMessage(),
                'tags' => $tags
            ]);
            return false;
        }
    }
    
    // 🧪 Manual cache tag purge for testing
    public function clearCacheByTags(Request $request)
    {
        $tags = $request->input('tags', ['content-pages', 'arabic-pages']);
        
        $success = $this->purgeCacheTags($tags);
        
        return response()->json([
            'message' => 'Cache tags ' . ($success ? 'purged successfully' : 'purge failed'),
            'success' => $success,
            'tags' => $tags,
            'method' => 'cache_tags'
        ]);
    }
    
    // 🆘 Fallback: Purge everything (if tags don't work)
    public function purgeEverything()
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . self::CLOUDFLARE_API_TOKEN,
                'Content-Type' => 'application/json'
            ])->post("https://api.cloudflare.com/client/v4/zones/" . self::CLOUDFLARE_ZONE_ID . "/purge_cache", [
                'purge_everything' => true
            ]);
            
            return response()->json([
                'success' => $response->successful(),
                'message' => $response->successful() ? 'Everything purged' : 'Purge failed',
                'method' => 'purge_everything'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
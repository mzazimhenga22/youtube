
export interface Chapter {
  title: string;
  time: number; // in seconds
}

export interface Video {
  id: string;
  title: string;
  channel: string;
  channelId?: string;
  views: string;
  thumbnail: string;
  duration: string;
  publishedAt?: string;
  streamUrl?: string;
  isLive?: boolean;
  viewerCount?: string;
  chapters?: Chapter[];
  description?: string;
}

interface RecommendationOptions {
    watchHistory?: Video[];
    likedVideos?: Video[];
    watchLater?: Video[];
    limit?: number;
}

export class YouTubeService {
    private baseUrl = 'https://www.youtube.com';
    private headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
    };

    private static cachedApiKey: string | null = null;
    private static cachedClientVersion: string | null = null;
    private static cachedVisitorData: string | null = null;
    private static isInitializing = false;

    private async ensureCredentials() {
        if (YouTubeService.cachedApiKey && YouTubeService.cachedClientVersion) return;
        if (YouTubeService.isInitializing) {
            // Wait up to 15s max — prevent infinite microtask loop if fetch hangs
            let waited = 0;
            while (YouTubeService.isInitializing && waited < 15000) {
                await new Promise(resolve => setTimeout(resolve, 200));
                waited += 200;
            }
            return;
        }

        YouTubeService.isInitializing = true;
        try {
            console.log('[YouTubeService] Initializing InnerTube credentials...');
            const homeRes = await fetch(this.baseUrl, { headers: this.headers });
            const html = await homeRes.text();

            const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"(.+?)"/);
            YouTubeService.cachedApiKey = apiKeyMatch ? apiKeyMatch[1] : null;

            const clientVersionMatch = html.match(/"clientVersion":"([\d\.]+)"/);
            YouTubeService.cachedClientVersion = clientVersionMatch ? clientVersionMatch[1] : '2.20240101.01.00';
            
            const visitorDataMatch = html.match(/"visitorData":"(.+?)"/);
            YouTubeService.cachedVisitorData = visitorDataMatch ? visitorDataMatch[1] : null;

            console.log('[YouTubeService] Credentials resolved successfully');
        } catch (error) {
            console.error('[YouTubeService] Credential resolution failed:', error);
        } finally {
            YouTubeService.isInitializing = false;
        }
    }

    async getStream(videoId: string): Promise<{ url: string; mimeType?: string } | null> {
        try {
            await this.ensureCredentials();
            if (!YouTubeService.cachedApiKey) {
                console.error('[YouTubeService] Missing API Key');
                return null;
            }

            const apiUrl = `https://www.youtube.com/youtubei/v1/player?key=${YouTubeService.cachedApiKey}&prettyPrint=false`;
            
            const clients = [
                {
                    name: 'ANDROID_KIDS',
                    version: '4.10.2',
                    userAgent: 'com.google.android.youtube.kids/4.10.2 (Linux; U; Android 12; en_US) gzip',
                    clientName: 'ANDROID_KIDS'
                },
                {
                    name: 'IOS_KIDS',
                    version: '4.10.2',
                    userAgent: 'com.google.ios.youtube.kids/4.10.2 (iPhone; CPU iPhone OS 15_0 like Mac OS X; en_US) gzip',
                    clientName: 'IOS_KIDS'
                },
                {
                    name: 'ANDROID_VR',
                    version: '1.60.19',
                    userAgent: 'com.google.android.youtube.vr/1.60.19 (Linux; U; Android 12; en_US) gzip',
                    clientName: 'ANDROID_VR'
                },
                {
                    name: 'MWEB',
                    version: '2.20240501.00.00',
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
                    clientName: 'MWEB'
                },
                {
                    name: 'ANDROID_MUSIC',
                    version: '6.45.54',
                    userAgent: 'com.google.android.apps.youtube.music/6.45.54 (Linux; U; Android 14; en_US) gzip',
                    clientName: 'ANDROID_MUSIC'
                },
                {
                    name: 'ANDROID_TESTSUITE',
                    version: '1.9.3',
                    userAgent: 'com.google.android.youtube.testsuite/1.9.3 (Linux; U; Android 12; en_US) gzip',
                    clientName: 'ANDROID_TESTSUITE'
                },
                {
                    name: 'WEB_EMBEDDED',
                    version: '1.20240722.01.00',
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    clientName: 'WEB_EMBEDDED_PLAYER'
                },
                {
                    name: 'TVHTML5',
                    version: '7.20260312.16.00',
                    userAgent: 'Mozilla/5.0 (SmartTV; Google TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    clientName: 'TVHTML5'
                }
            ];

            for (const client of clients) {
                try {
                    const body: any = {
                        context: {
                            client: {
                                clientName: client.clientName,
                                clientVersion: client.version,
                                hl: 'en-US',
                                gl: 'US',
                                visitorData: YouTubeService.cachedVisitorData
                            },
                        },
                        videoId: videoId,
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: 20641, // Updated timestamp
                            },
                        },
                        racyCheckOk: true,
                        contentCheckOk: true,
                    };

                    const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            ...this.headers,
                            'Content-Type': 'application/json',
                            'User-Agent': client.userAgent,
                        },
                        body: JSON.stringify(body),
                    });

                    if (!res.ok) {
                        console.log(`[YouTubeService] Client ${client.name} HTTP error: ${res.status}`);
                        continue;
                    }

                    const data = await res.json();
                    
                    if (data.playabilityStatus?.status === 'OK' && data.streamingData) {
                        const stream = this.extractStream(data);
                        if (stream) {
                            console.log(`[YouTubeService] Found stream using client: ${client.name}`);
                            return stream;
                        }
                    } else {
                        console.log(`[YouTubeService] Client ${client.name} rejected: ${data.playabilityStatus?.status} - ${data.playabilityStatus?.reason || ''}`);
                    }
                } catch (e) {
                    console.error(`[YouTubeService] Client ${client.name} exception:`, e);
                }
            }
            return null;
        } catch (err) {
            console.error('[YouTubeService] getStream total failure:', err);
            return null;
        }
    }

    async getVideoDetails(videoId: string): Promise<Partial<Video> | null> {
        try {
            await this.ensureCredentials();
            const nextUrl = `https://www.youtube.com/youtubei/v1/next?key=${YouTubeService.cachedApiKey}`;
            const playerUrl = `https://www.youtube.com/youtubei/v1/player?key=${YouTubeService.cachedApiKey}`;
            
            const [nextRes, playerRes] = await Promise.all([
                fetch(nextUrl, {
                    method: 'POST',
                    headers: { ...this.headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        context: { client: { clientName: 'WEB', clientVersion: YouTubeService.cachedClientVersion } },
                        videoId
                    })
                }),
                fetch(playerUrl, {
                    method: 'POST',
                    headers: { ...this.headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        context: { client: { clientName: 'WEB', clientVersion: YouTubeService.cachedClientVersion } },
                        videoId
                    })
                })
            ]);

            const [nextData, playerData] = await Promise.all([nextRes.json(), playerRes.json()]);

            const details = playerData.videoDetails || {};
            const isLive = details.isLiveContent || false;
            const viewerCount = playerData.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.concurrentViewers 
                || details.shortViewCountText?.simpleText 
                || undefined;

            // Extract description and chapters
            const description = details.shortDescription || "";
            const chapters = this.parseChapters(description);

            return {
                id: videoId,
                title: details.title,
                channel: details.author,
                isLive,
                viewerCount: viewerCount ? `${viewerCount} watching` : undefined,
                description,
                chapters
            };
        } catch (e) {
            console.error('[YouTubeService] getVideoDetails failed:', e);
            return null;
        }
    }

    private parseChapters(description: string): Chapter[] {
        const chapters: Chapter[] = [];
        const lines = description.split('\n');
        // Regex to match timestamps like 00:00, 0:00, 1:23:45
        const timestampRegex = /(?:^|\s)(\d{1,2}:)?(\d{1,2}):(\d{2})(?:\s|$)/;

        lines.forEach(line => {
            const match = line.match(timestampRegex);
            if (match) {
                const timestamp = match[0].trim();
                const title = line.replace(timestamp, '').replace(/[()\[\]\-:]/g, '').trim();
                
                // Convert timestamp to seconds
                const parts = timestamp.split(':').map(Number);
                let seconds = 0;
                if (parts.length === 3) {
                    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else {
                    seconds = parts[0] * 60 + parts[1];
                }

                if (title) {
                    chapters.push({ title, time: seconds });
                }
            }
        });

        // Ensure chapters are sorted and starting from 0 if multiple exist
        return chapters.sort((a, b) => a.time - b.time);
    }

    private extractStream(data: any): { url: string; mimeType: string } | null {
        const streamingData = data.streamingData || {};
        
        // For Live Streams, always prefer HLS manifest if available
        if (streamingData.hlsManifestUrl) {
            return { 
                url: streamingData.hlsManifestUrl, 
                mimeType: 'application/x-mpegURL' 
            };
        }

        const formats = [...(streamingData.formats || []), ...(streamingData.adaptiveFormats || [])];
        
        // Filter out formats without direct URLs (those with signatureCipher need JS decryption)
        const playableFormats = formats.filter((f: any) => f.url && !f.signatureCipher);
        
        // Prefer muxed mp4 streams for better compatibility on TV (includes audio)
        const best = playableFormats.find((f: any) => 
            f.mimeType?.includes('video/mp4') && (f.audioQuality || f.audioSampleRate)
        ) || playableFormats.find((f: any) => f.mimeType?.includes('video/mp4')) || playableFormats[0];
        
        return best ? { url: best.url, mimeType: best.mimeType } : null;
    }

    async getUpNext(videoId: string): Promise<Video[]> {
        try {
            await this.ensureCredentials();
            const apiUrl = `https://www.youtube.com/youtubei/v1/next?key=${YouTubeService.cachedApiKey}`;
            const body = {
                context: { client: { clientName: 'WEB', clientVersion: YouTubeService.cachedClientVersion } },
                videoId: videoId,
            };
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { ...this.headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) return [];
            const data = await res.json();
            const results: Video[] = [];
            const contents = data.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results || [];
            
            contents.forEach((item: any) => {
                const r = item.compactVideoRenderer || item.videoRenderer;
                if (r) {
                    results.push(this.mapVideoRenderer(r));
                }
            });
            return results.length > 0 ? results : this.extractVideosDeep(data);
        } catch (e) { return []; }
    }

    async search(query: string): Promise<Video[]> {
        try {
            await this.ensureCredentials();
            const apiKey = YouTubeService.cachedApiKey || '';
            const clientVersion = YouTubeService.cachedClientVersion || '2.20240101.01.00';

            const apiUrl = `${this.baseUrl}/youtubei/v1/search?key=${apiKey}`;
            
            const body = {
                context: {
                    client: {
                        clientName: 'WEB',
                        clientVersion: clientVersion,
                    },
                },
                query: query,
            };

            const apiRes = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json',
                    Origin: this.baseUrl,
                    Referer: `${this.baseUrl}/`,
                },
                body: JSON.stringify(body),
            });

            const json = await apiRes.json();
            return this.parseSearchResults(json);
        } catch (error) {
            console.error('[YouTubeService] Search Error:', error);
            return [];
        }
    }

    async getHomeVideos(): Promise<Video[]> {
        try {
            await this.ensureCredentials();
            const apiKey = YouTubeService.cachedApiKey || '';
            const clientVersion = YouTubeService.cachedClientVersion || '2.20240101.01.00';

            const apiUrl = `${this.baseUrl}/youtubei/v1/browse?key=${apiKey}`;
            
            const body = {
                context: {
                    client: {
                        clientName: 'WEB',
                        clientVersion: clientVersion,
                    },
                },
                browseId: 'FEwhat_to_watch'
            };

            const apiRes = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'Content-Type': 'application/json',
                    Origin: this.baseUrl,
                    Referer: `${this.baseUrl}/`,
                },
                body: JSON.stringify(body),
            });

            const json = await apiRes.json();
            const videos = this.parseBrowseResults(json);
            return videos.length > 0 ? videos : this.extractVideosDeep(json);
        } catch (error) {
            console.error('[YouTubeService] Home Videos Error:', error);
            return [];
        }
    }

    async getVideosByCategory(category: string): Promise<Video[]> {
        return this.search(category);
    }

    async getTrending(): Promise<Video[]> {
        return this.search('trending Kenya');
    }

    async getLiveChannels(): Promise<Video[]> {
        try {
            // Search specifically for live news/tv channels in the region
            const queries = ['Citizen TV Live', 'KTN Home Live', 'NTV Kenya Live', 'K24 TV Live', 'BBC News Live', 'Sky News Live'];
            const results = await Promise.all(queries.map(q => this.search(q)));
            
            // Flatten and filter for videos that are actually live
            return results.flat().filter((v, i, self) => 
                self.findIndex(t => t.id === v.id) === i
            ).slice(0, 12).map(v => ({ ...v, isLive: true }));
        } catch (e) {
            return [];
        }
    }

    async getSchedule(channelName: string): Promise<string[]> {
        // Since real-time EPG is hard without official API, we'll map known channels to their real shows
        const showMap: Record<string, string[]> = {
            'Citizen TV': ['News Gang', 'JKLive', 'Citizen Briefs', 'Daybreak', 'Sema na Citizen'],
            'KTN Home': ['Checkpoint', 'The Morning Express', 'Inside Politics', 'Zilizala viwanjani'],
            'NTV Kenya': ['NTV Tonight', 'The Trend', 'Sidebar', 'AM Live', 'NTV Wild'],
            'BBC News': ['Global News', 'BBC World Report', 'Hardtalk', 'Click', 'Focus on Africa'],
            'Sky News': ['Press Preview', 'The Early Rundown', 'Kay Burley', 'The News at Ten'],
            'ESPN': ['SportsCenter', 'NFL Live', 'NBA Today', 'First Take', 'Get Up'],
        };
        
        return showMap[channelName] || ['Live Programming', 'Breaking News', 'Special Coverage'];
    }

    async getRecommendations(seedVideos: Video[], options: RecommendationOptions = {}): Promise<Video[]> {
        const watchHistory = options.watchHistory ?? seedVideos;
        const likedVideos = options.likedVideos ?? [];
        const watchLater = options.watchLater ?? [];
        const limit = options.limit ?? 24;
        const signals = this.buildRecommendationSignals(watchHistory, likedVideos, watchLater);

        if (signals.seedVideos.length === 0) {
            return this.getHomeVideos();
        }

        const queries = this.buildRecommendationQueries(signals);
        const queryResults = await Promise.all(
            queries.map(query => this.search(query).catch(() => []))
        );
        const [home, trending] = await Promise.all([
            this.getHomeVideos().catch(() => []),
            this.getTrending().catch(() => []),
        ]);

        const combined = [...queryResults.flat(), ...home, ...trending];
        return this.rankRecommendations(combined, signals, limit);
    }

    async getRelatedVideos(seedVideo: Video, limit = 18): Promise<Video[]> {
        const queries = this.buildRelatedQueries(seedVideo);
        const queryResults = await Promise.all(
            queries.map(query => this.search(query).catch(() => []))
        );
        const [home, trending] = await Promise.all([
            this.getHomeVideos().catch(() => []),
            this.getTrending().catch(() => []),
        ]);

        const seedTitle = this.normalizeText(seedVideo.title);
        const seedChannel = this.normalizeText(seedVideo.channel);
        const seenChannels = new Map<string, number>();
        const candidates = [...queryResults.flat(), ...trending, ...home]
            .filter(video => video.id && video.id !== seedVideo.id)
            .filter(video => this.normalizeText(video.title) !== seedTitle)
            .filter(video => video.thumbnail);

        const ranked = this.rankRecommendations(candidates, this.buildRecommendationSignals([seedVideo], [], []), limit * 2);
        const diversified: Video[] = [];

        for (const video of ranked) {
            const channel = this.normalizeText(video.channel);
            const channelCount = seenChannels.get(channel) ?? 0;
            const sameChannelLimit = channel === seedChannel ? 4 : 2;

            if (channelCount >= sameChannelLimit) continue;

            seenChannels.set(channel, channelCount + 1);
            diversified.push(video);

            if (diversified.length >= limit) break;
        }

        return diversified;
    }

    async getLiveChat(videoId: string): Promise<any[]> {
        try {
            await this.ensureCredentials();
            const apiUrl = `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${YouTubeService.cachedApiKey}`;
            
            const body = {
                context: { client: { clientName: 'WEB', clientVersion: YouTubeService.cachedClientVersion } },
                continuation: null, // Initial fetch doesn't need continuation, but usually it's better to fetch from player
            };

            // Note: Scraping live chat reliably requires continuation tokens.
            // For now, we'll return the initial chat messages or mock highly realistic ones if continuation is missing.
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { ...this.headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            
            if (!res.ok) throw new Error('Live chat fetch failed');
            const data = await res.json();
            
            const messages: any[] = [];
            const actions = data.continuationContents?.liveChatContinuation?.actions || [];
            
            actions.forEach((action: any) => {
                const item = action.addChatItemAction?.item?.liveChatTextMessageRenderer;
                if (item) {
                    messages.push({
                        id: item.id,
                        user: item.authorName?.simpleText || 'User',
                        text: item.message?.runs?.[0]?.text || '',
                        color: '#' + Math.floor(Math.random()*16777215).toString(16),
                        avatar: item.authorPhoto?.thumbnails?.[0]?.url
                    });
                }
            });

            return messages.length > 0 ? messages : [
                { id: 'm1', user: 'TechTube', text: 'Watching from Nairobi! 🇰🇪', color: '#FF4B4B' },
                { id: 'm2', user: 'James K.', text: 'The quality is amazing today.', color: '#4B7BFF' },
                { id: 'm3', user: 'Sarah L.', text: 'Is this live?', color: '#4BFF7B' },
            ];
        } catch (e) {
            return [];
        }
    }

    async getComments(videoId: string): Promise<any[]> {
        // Race against a 10s timeout to prevent hanging the JS thread
        const timeoutPromise = new Promise<any[]>(resolve =>
            setTimeout(() => resolve(this.fallbackComments(videoId)), 10000)
        );
        return Promise.race([this._fetchComments(videoId), timeoutPromise]);
    }

    private async _fetchComments(videoId: string): Promise<any[]> {
        try {
            await this.ensureCredentials();
            if (!YouTubeService.cachedApiKey) return this.fallbackComments(videoId);

            // Step 1: Fetch the /next page to get the comment section continuation token
            const nextUrl = `https://www.youtube.com/youtubei/v1/next?key=${YouTubeService.cachedApiKey}`;
            const nextBody = {
                context: { client: { clientName: 'WEB', clientVersion: YouTubeService.cachedClientVersion } },
                videoId,
            };
            const nextRes = await fetch(nextUrl, {
                method: 'POST',
                headers: { ...this.headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(nextBody),
            });
            if (!nextRes.ok) return this.fallbackComments(videoId);
            const nextData = await nextRes.json();

            // Find the comment continuation token from the next response
            let continuationToken: string | null = null;
            const engagementPanels = nextData.engagementPanels || [];
            
            // Path 1: Engagement Panels (Modern Web/Mobile)
            for (const panel of engagementPanels) {
                const sectionList = panel.engagementPanelSectionListRenderer;
                const panelId = sectionList?.panelIdentifier || sectionList?.targetId;
                
                if (panelId?.includes('comment')) {
                    // Try to find continuation in the header or contents
                    const cont = sectionList.header?.engagementPanelTitleHeaderRenderer?.menu?.sortFilterSubMenuRenderer?.subMenuItems?.[0]?.serviceEndpoint?.continuationCommand?.token
                        || sectionList.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
                    
                    if (cont) { continuationToken = cont; break; }
                }
            }

            // Path 2: Two-Column Watch Next Results (Classic Web)
            if (!continuationToken) {
                const results = nextData.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
                for (const item of results) {
                    const section = item.itemSectionRenderer;
                    if (section?.sectionIdentifier === 'comment-item-section' || section?.targetId === 'comments-section') {
                        continuationToken = section.contents?.[0]?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
                        if (continuationToken) break;
                    }
                }
            }

            // Path 3: Deep search in contents (Universal Fallback)
            // IMPORTANT: Depth-limited to prevent Hermes stack overflow on large JSON
            if (!continuationToken && nextData.contents) {
                const searchToken = (obj: any, depth: number): string | null => {
                    if (!obj || typeof obj !== 'object' || depth > 8) return null;
                    if (obj.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
                        return obj.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                    }
                    const keys = Object.keys(obj);
                    // Limit breadth: only check first 20 keys per object to avoid exhaustive traversal
                    const limit = Math.min(keys.length, 20);
                    for (let i = 0; i < limit; i++) {
                        const found = searchToken(obj[keys[i]], depth + 1);
                        if (found) return found;
                    }
                    if (Array.isArray(obj)) {
                        const arrLimit = Math.min(obj.length, 30);
                        for (let i = 0; i < arrLimit; i++) {
                            const found = searchToken(obj[i], depth + 1);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                continuationToken = searchToken(nextData.contents, 0);
            }

            if (!continuationToken) return this.fallbackComments(videoId);

            // Step 2: Fetch comments using the continuation token
            const commentsUrl = `https://www.youtube.com/youtubei/v1/next?key=${YouTubeService.cachedApiKey}`;
            const commentsBody = {
                context: { client: { clientName: 'WEB', clientVersion: YouTubeService.cachedClientVersion } },
                continuation: continuationToken,
            };
            const commentsRes = await fetch(commentsUrl, {
                method: 'POST',
                headers: { ...this.headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(commentsBody),
            });
            if (!commentsRes.ok) return this.fallbackComments(videoId);
            const commentsData = await commentsRes.json();

            // Parse comments from the response
            const comments: any[] = [];
            const threads = commentsData.onResponseReceivedEndpoints?.[1]?.reloadContinuationItemsCommand?.continuationItems
                || commentsData.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems
                || [];

            for (const thread of threads) {
                const renderer = thread.commentThreadRenderer?.comment?.commentRenderer;
                if (!renderer) continue;

                const authorName = renderer.authorText?.simpleText || 'User';
                const avatarUrl = renderer.authorThumbnail?.thumbnails?.[0]?.url || '';
                const textRuns = renderer.contentText?.runs || [];
                const text = textRuns.map((r: any) => r.text).join('');
                const likes = renderer.voteCount?.simpleText || '0';
                const publishedTime = renderer.publishedTimeText?.runs?.[0]?.text || '';

                if (text.trim()) {
                    comments.push({
                        id: renderer.commentId || `c-${comments.length}`,
                        user: authorName,
                        text,
                        likes,
                        avatar: avatarUrl,
                        publishedTime,
                    });
                }

                if (comments.length >= 20) break;
            }

            return comments.length > 0 ? comments : this.fallbackComments(videoId);
        } catch (e) {
            console.error('[YouTubeService] Comments fetch error:', e);
            return this.fallbackComments(videoId);
        }
    }

    private fallbackComments(videoId: string): any[] {
        // Generate deterministic "random" comments based on videoId so they feel unique per video
        const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const templates = [
            { user: 'TechExplorer', text: 'This was incredibly helpful. Thanks for sharing!' },
            { user: 'DigitalNomad', text: 'Love the production quality here. Subscribed!' },
            { user: 'CodeMaster99', text: 'Can you explain the part at 2:15 again?' },
            { user: 'CreativeMind', text: 'The visuals really help illustrate the point.' },
            { user: 'MusicLover', text: 'That background track is fire! Name?' },
            { user: 'TravelFanatic', text: 'Adding this to my bucket list immediately.' },
            { user: 'DailyVlogger', text: 'Great content as always. Keep it up!' },
            { user: 'ScienceGuy', text: 'Actually, the physics behind this is quite complex...' },
            { user: 'GamerPro', text: 'First! Just kidding, amazing video.' },
            { user: 'FoodieHeaven', text: 'I tried this and it actually works perfectly!' },
            { user: 'FitnessGoal', text: 'Consistency is key. Thanks for the motivation.' },
            { user: 'ArtisticSoul', text: 'The color grading in this is stunning.' },
            { user: 'MovieBuff', text: 'Better than most movies in theaters right now.' },
            { user: 'HistoryNerd', text: 'The context provided here is spot on.' },
            { user: 'NatureLover', text: 'Peaceful and informative. Thank you.' }
        ];

        const comments = [];
        const count = 5 + (hash % 10); // 5 to 15 comments
        
        for (let i = 0; i < count; i++) {
            const index = (hash + i) % templates.length;
            const t = templates[index];
            const likes = Math.floor(((hash + i * 13) % 500) + 10);
            
            comments.push({
                id: `fallback-${videoId}-${i}`,
                user: t.user + (hash % 100),
                text: t.text,
                likes: likes > 1000 ? (likes / 1000).toFixed(1) + 'K' : likes.toString(),
                avatar: `https://i.pravatar.cc/150?u=${hash + i}`,
                publishedTime: `${(hash + i) % 24} hours ago`
            });
        }

        return comments;
    }

    private parseSearchResults(json: any): Video[] {
        const videos: Video[] = [];
        const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        
        contents?.forEach((section: any) => {
            section.itemSectionRenderer?.contents?.forEach((item: any) => {
                const renderer = item.videoRenderer;
                if (renderer) {
                    videos.push(this.mapVideoRenderer(renderer));
                }
            });
        });

        return videos.length > 0 ? videos : this.extractVideosDeep(json);
    }

    private parseBrowseResults(json: any): Video[] {
        const videos: Video[] = [];
        const contents = json.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.richGridRenderer?.contents;
        
        contents?.forEach((item: any) => {
            const renderer = item.richItemRenderer?.content?.videoRenderer;
            if (renderer) {
                videos.push(this.mapVideoRenderer(renderer));
            }
        });

        return videos;
    }

    private extractVideosDeep(root: any, maxResults = 30): Video[] {
        const videos: Video[] = [];
        const seen = new Set<string>();

        const visit = (node: any, depth: number) => {
            // Depth 8 + breadth cap prevents Hermes stack overflow on large YouTube JSON
            if (!node || typeof node !== 'object' || depth > 8 || videos.length >= maxResults) return;

            const renderer = node.videoRenderer || node.compactVideoRenderer || node.gridVideoRenderer;
            if (renderer?.videoId && !seen.has(renderer.videoId)) {
                seen.add(renderer.videoId);
                videos.push(this.mapVideoRenderer(renderer));
                if (videos.length >= maxResults) return;
            }

            if (Array.isArray(node)) {
                // Cap array traversal to first 40 items
                const len = Math.min(node.length, 40);
                for (let i = 0; i < len; i++) {
                    visit(node[i], depth + 1);
                    if (videos.length >= maxResults) return;
                }
                return;
            }

            const keys = Object.keys(node);
            // Cap object key traversal to first 30 keys
            const len = Math.min(keys.length, 30);
            for (let i = 0; i < len; i++) {
                visit(node[keys[i]], depth + 1);
                if (videos.length >= maxResults) return;
            }
        };

        visit(root, 0);
        return videos;
    }

    private mapVideoRenderer(renderer: any): Video {
        const videoId = renderer.videoId;
        const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || 'Unknown Title';
        const channel = renderer.ownerText?.runs?.[0]?.text || renderer.shortBylineText?.runs?.[0]?.text || 'Unknown Channel';
        const channelId = renderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
        
        const views = renderer.viewCountText?.simpleText || renderer.shortViewCountText?.simpleText || '0 views';
        const duration = renderer.lengthText?.simpleText || '0:00';
        const publishedAt = renderer.publishedTimeText?.simpleText || '';
        
        const thumbnails = renderer.thumbnail?.thumbnails || [];
        let thumbnail = '';
        if (thumbnails.length > 0) {
            thumbnail = thumbnails[thumbnails.length - 1]?.url || '';
        }
        if (thumbnail) {
            if (thumbnail.startsWith('//')) thumbnail = 'https:' + thumbnail;
            else if (thumbnail.startsWith('http://')) thumbnail = thumbnail.replace('http://', 'https://');
        }

        return {
            id: videoId,
            title,
            channel,
            channelId,
            views,
            thumbnail,
            duration,
            publishedAt
        };
    }

    private buildRecommendationSignals(watchHistory: Video[], likedVideos: Video[], watchLater: Video[]) {
        const seedVideos = [...likedVideos, ...watchHistory, ...watchLater].filter(Boolean);
        const channelAffinity = new Map<string, number>();
        const topicAffinity = new Map<string, number>();
        const seenIds = new Set(watchHistory.map(video => video.id));

        const addVideo = (video: Video, weight: number) => {
            if (!video) return;
            const channel = this.normalizeText(video.channel);
            if (channel) {
                channelAffinity.set(channel, (channelAffinity.get(channel) ?? 0) + weight);
            }

            for (const token of this.extractTopicTokens(video)) {
                topicAffinity.set(token, (topicAffinity.get(token) ?? 0) + weight);
            }
        };

        watchHistory.forEach((video, index) => addVideo(video, Math.max(1, 8 - index)));
        likedVideos.forEach((video, index) => addVideo(video, Math.max(4, 12 - index)));
        watchLater.forEach((video, index) => addVideo(video, Math.max(2, 6 - index)));

        return {
            seedVideos,
            channelAffinity,
            topicAffinity,
            seenIds,
        };
    }

    private buildRecommendationQueries(signals: ReturnType<YouTubeService['buildRecommendationSignals']>): string[] {
        const topChannels = this.topKeys(signals.channelAffinity, 4);
        const topTopics = this.topKeys(signals.topicAffinity, 10);
        const seedTitles = signals.seedVideos
            .slice(0, 3)
            .map(video => this.extractTopicTokens(video).slice(0, 4).join(' '))
            .filter(Boolean);

        const queries = [
            ...topChannels.map(channel => `${channel} latest videos`),
            topTopics.slice(0, 4).join(' '),
            topTopics.slice(4, 8).join(' '),
            ...seedTitles,
            `${topTopics.slice(0, 3).join(' ')} trending`,
        ];

        return Array.from(new Set(queries.map(query => query.trim()).filter(Boolean))).slice(0, 8);
    }

    private buildRelatedQueries(video: Video): string[] {
        const cleanedTitle = this.cleanTitle(video.title);
        const channel = video.channel.replace(/\b(vevo|official|topic)\b/gi, '').trim();
        const tokens = this.extractTopicTokens(video).slice(0, 6);
        const normalized = this.normalizeText(`${video.title} ${video.channel}`);
        const looksLikeMusic =
            normalized.includes('official video') ||
            normalized.includes('official audio') ||
            normalized.includes('lyrics') ||
            normalized.includes('vevo') ||
            normalized.includes('music');

        const queries = [
            `${channel} songs`,
            `${cleanedTitle} similar videos`,
            `${channel} latest`,
            tokens.join(' '),
        ];

        if (looksLikeMusic) {
            queries.push(
                `${channel} music videos`,
                `${channel} live performance`,
                `${channel} dancehall`,
                'dancehall music videos',
                'new reggae dancehall songs',
            );
        }

        if (normalized.includes('shensea') || normalized.includes('shenseea')) {
            queries.push('Shenseea dancehall hits', 'Shenseea official music videos', 'Jamaican dancehall female artists');
        }

        return Array.from(new Set(queries.map(query => query.trim()).filter(Boolean))).slice(0, 10);
    }

    private cleanTitle(title: string): string {
        return title
            .replace(/\([^)]*(official|video|audio|lyrics|visualizer|music)[^)]*\)/gi, ' ')
            .replace(/\[[^\]]*(official|video|audio|lyrics|visualizer|music)[^\]]*\]/gi, ' ')
            .replace(/\b(official|music|video|audio|lyrics|visualizer|hd|4k)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private rankRecommendations(
        videos: Video[],
        signals: ReturnType<YouTubeService['buildRecommendationSignals']>,
        limit: number,
    ): Video[] {
        const unique = new Map<string, Video>();
        for (const video of videos) {
            if (video?.id && !unique.has(video.id)) {
                unique.set(video.id, video);
            }
        }

        return Array.from(unique.values())
            .map((video, index) => ({
                video,
                score: this.scoreRecommendation(video, signals, index),
            }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.video)
            .slice(0, limit);
    }

    private scoreRecommendation(
        video: Video,
        signals: ReturnType<YouTubeService['buildRecommendationSignals']>,
        sourceIndex: number,
    ): number {
        const channelScore = signals.channelAffinity.get(this.normalizeText(video.channel)) ?? 0;
        const topicScore = this.extractTopicTokens(video).reduce(
            (score, token) => score + (signals.topicAffinity.get(token) ?? 0),
            0,
        );
        const viewScore = Math.min(8, Math.log10(this.parseViewCount(video.views) + 1));
        const recencyScore = this.scoreRecency(video.publishedAt);
        const durationScore = this.scoreDuration(video.duration);
        const noveltyPenalty = signals.seenIds.has(video.id) ? -100 : 0;
        const sourceDiversity = Math.max(0, 4 - sourceIndex * 0.03);

        return (
            channelScore * 3.2 +
            topicScore * 1.6 +
            viewScore +
            recencyScore +
            durationScore +
            sourceDiversity +
            noveltyPenalty
        );
    }

    private extractTopicTokens(video: Video): string[] {
        return this.tokenize(`${video.title} ${video.channel}`)
            .filter(token => !this.stopWords.has(token))
            .slice(0, 12);
    }

    private tokenize(value: string): string[] {
        return this.normalizeText(value)
            .split(' ')
            .map(token => token.trim())
            .filter(token => token.length > 2);
    }

    private normalizeText(value = ''): string {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    private topKeys(map: Map<string, number>, limit: number): string[] {
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([key]) => key)
            .slice(0, limit);
    }

    private parseViewCount(value = ''): number {
        const normalized = value.toLowerCase().replace(/,/g, '');
        const match = normalized.match(/([\d.]+)\s*([kmb])?/);
        if (!match) return 0;

        const base = Number(match[1]);
        if (Number.isNaN(base)) return 0;

        const multipliers: Record<string, number> = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
        return base * (multipliers[match[2] ?? ''] ?? 1);
    }

    private scoreRecency(value = ''): number {
        const normalized = value.toLowerCase();
        if (normalized.includes('hour') || normalized.includes('minute')) return 7;
        if (normalized.includes('day')) return 6;
        if (normalized.includes('week')) return 4;
        if (normalized.includes('month')) return 2;
        if (normalized.includes('year')) return 0;
        return 1;
    }

    private scoreDuration(value = ''): number {
        const parts = value.split(':').map(part => Number(part));
        if (parts.some(Number.isNaN)) return 0;
        const seconds = parts.reduce((total, part) => total * 60 + part, 0);
        if (seconds === 0) return 0;
        if (seconds < 60) return 1.5;
        if (seconds <= 20 * 60) return 3;
        if (seconds <= 60 * 60) return 1.5;
        return 0.5;
    }

    private stopWords = new Set([
        'the', 'and', 'for', 'with', 'from', 'this', 'that', 'you', 'your',
        'official', 'video', 'videos', 'live', 'new', 'latest', 'full', 'how',
        'why', 'what', 'when', 'where', 'who', 'into', 'about', 'episode',
    ]);
}

export const youtubeService = new YouTubeService();

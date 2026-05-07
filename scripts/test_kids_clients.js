
const baseUrl = 'https://www.youtube.com';
const videoId = 'XqZsoesa55w'; // Baby Shark - classic kids video

const clients = [
    { name: 'KIDS', clientName: 'KIDS', version: '1.0', userAgent: 'com.google.android.youtube.kids/1.0 (Linux; U; Android 10; en_US) gzip' },
    { name: 'ANDROID_KIDS', clientName: 'ANDROID_KIDS', version: '4.10.2', userAgent: 'com.google.android.youtube.kids/4.10.2 (Linux; U; Android 12; en_US) gzip' },
    { name: 'IOS_KIDS', clientName: 'IOS_KIDS', version: '4.10.2', userAgent: 'com.google.ios.youtube.kids/4.10.2 (iPhone; CPU iPhone OS 15_0 like Mac OS X; en_US) gzip' },
    { name: 'ANDROID_VR', clientName: 'ANDROID_VR', version: '1.60.19', userAgent: 'com.google.android.youtube.vr/1.60.19 (Linux; U; Android 12; en_US) gzip' },
    { name: 'WEB_EMBEDDED', clientName: 'WEB_EMBEDDED_PLAYER', version: '1.20240722.01.00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    { name: 'TVHTML5', clientName: 'TVHTML5', version: '7.20260312.16.00', userAgent: 'Mozilla/5.0 (SmartTV; Google TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
    { name: 'MWEB', clientName: 'MWEB', version: '2.20240501.00.00', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' }
];

async function runTest() {
    console.log(`[Test] Starting Kids Key Discovery for Video: ${videoId}`);
    
    try {
        const homeRes = await fetch(baseUrl);
        const html = await homeRes.text();
        const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"(.+?)"/);
        const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
        
        if (!apiKey) {
            console.error('[Error] Could not find API Key');
            return;
        }
        console.log(`[Info] Using API Key: ${apiKey.substring(0, 10)}...`);

        const results = [];

        for (const client of clients) {
            console.log(`[Testing] Client: ${client.name}...`);
            const apiUrl = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
            const body = {
                context: {
                    client: {
                        clientName: client.clientName,
                        clientVersion: client.version,
                        hl: 'en-US',
                        gl: 'US',
                    },
                },
                videoId: videoId,
                playbackContext: {
                    contentPlaybackContext: {
                        signatureTimestamp: 20641,
                    },
                },
                racyCheckOk: true,
                contentCheckOk: true,
            };

            try {
                const res = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': client.userAgent,
                    },
                    body: JSON.stringify(body),
                });

                const data = await res.json();
                const status = data.playabilityStatus?.status;
                const reason = data.playabilityStatus?.reason || 'No reason';
                const hasStreams = !!data.streamingData;
                const isUnplayable = data.playabilityStatus?.playableInEmbed === false;

                console.log(`  -> Status: ${status}, Streams: ${hasStreams}, Reason: ${reason}`);
                
                results.push({
                    client: client.name,
                    status,
                    hasStreams,
                    reason,
                    isUnplayable
                });

            } catch (err) {
                console.error(`  -> Failed: ${err.message}`);
                results.push({ client: client.name, error: err.message });
            }
        }

        console.log('\n--- SUMMARY ---');
        console.table(results);

        const working = results.filter(r => r.status === 'OK' && r.hasStreams);
        if (working.length > 0) {
            console.log('\n[Success] Found working client configurations:');
            working.forEach(w => console.log(`- ${w.client}`));
        } else {
            console.log('\n[Fail] No working client configurations found.');
        }

    } catch (e) {
        console.error('[Fatal] Error in runTest:', e);
    }
}

runTest();

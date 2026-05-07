
const baseUrl = 'https://www.youtube.com';
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
};

async function getIds() {
    try {
        console.log('Fetching homepage to get credentials...');
        const homeRes = await fetch(baseUrl, { headers });
        const html = await homeRes.text();

        const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"(.+?)"/);
        const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

        const clientVersionMatch = html.match(/"clientVersion":"([\d\.]+)"/);
        const clientVersion = clientVersionMatch ? clientVersionMatch[1] : '2.20240101.01.00';

        if (!apiKey) {
            console.error('Failed to get API key');
            return;
        }

        console.log('Searching for kids videos...');
        const apiUrl = `${baseUrl}/youtubei/v1/search?key=${apiKey}`;
        const body = {
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: clientVersion,
                },
            },
            query: 'kids animation popular',
        };

        const apiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const json = await apiRes.json();
        const ids = [];
        
        // Simple extraction
        const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        contents?.forEach((section) => {
            section.itemSectionRenderer?.contents?.forEach((item) => {
                const renderer = item.videoRenderer;
                if (renderer && renderer.videoId) {
                    ids.push({ id: renderer.videoId, title: renderer.title?.runs?.[0]?.text });
                }
            });
        });

        console.log('Found IDs:', JSON.stringify(ids.slice(0, 5), null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

getIds();

export default async function middleware(request: Request) {
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /Twitterbot|facebookexternalhit|Discordbot|Slackbot|LinkedInBot|Applebot|FaceTime/i.test(userAgent);

    if (!isBot) {
        return; 
    }

    // 2. It's a bot—parse the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const type = pathParts[1]; // 'profile' or 'review'
    const id = pathParts[2];

    if (!id || (type !== 'profile' && type !== 'review')) {
        return;
    }

    // 3. Point to your Supabase Image Function
    const supabaseProject = "akneztqjuwaharlzqwvc"; 
    const dynamicImageUrl = `https://${supabaseProject}.supabase.co/functions/v1/share-preview/${type}/${id}`;

    // 4. Return the HTML shell
    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <meta property="og:title" content="JukeBoxd | ${type === 'profile' ? 'Profile' : 'Review'}">
            <meta property="og:description" content="Check this out on JukeBoxd.">
            <meta property="og:image" content="${dynamicImageUrl}">
            <meta property="og:image:width" content="1200">
            <meta property="og:image:height" content="630">
            <meta property="og:type" content="website">
            <meta name="twitter:card" content="summary_large_image">
        </head>
        <body>Redirecting...</body>
        </html>`,
        {
        headers: { 'Content-Type': 'text/html' },
        }
    );
}

// Ensure this only runs on your specific routes
export const config = {
  matcher: ['/profile/:id*', '/review/:id*'],
};
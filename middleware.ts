export default async function middleware(request: Request) {
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /Twitterbot|facebookexternalhit|Discordbot|Slackbot|LinkedInBot|Applebot|FaceTime|TelegramBot|WhatsApp/i.test(userAgent);

    if (!isBot) return; // Humans proceed to the actual React app

    const url = new URL(request.url);
    const [, type, id] = url.pathname.split('/');

    if (!id || (type !== 'profile' && type !== 'review')) return;

    const supabaseProject = "akneztqjuwaharlzqwvc"; 
    // IMPORTANT: Ensure this URL works in a browser tab!
    const dynamicImageUrl = `https://${supabaseProject}.supabase.co/functions/v1/share-preview/${type}/${id}`;

    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>JukeBoxd</title>
            <meta property="og:title" content="JukeBoxd | ${type.charAt(0).toUpperCase() + type.slice(1)}">
            <meta property="og:description" content="Check this out on JukeBoxd.">
            <meta property="og:image" content="${dynamicImageUrl}">
            <meta property="og:image:type" content="image/png">
            <meta property="og:image:width" content="1200">
            <meta property="og:image:height" content="630">
            <meta name="twitter:card" content="summary_large_image">
            <meta property="og:url" content="${request.url}">
        </head>
        <body></body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
    );
}

// Ensure this only runs on your specific routes
export const config = {
  matcher: ['/profile/:id*', '/review/:id*'],
};
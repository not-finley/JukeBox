import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    console.log("API Route triggered. ID present:", !!clientId);

    try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
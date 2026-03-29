const axios = require("axios");
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const YT_CHANNEL = process.env.YT_CHANNEL;

let ultimoVideo = null;

async function checkYouTube() {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL}`;
    const res = await axios.get(url);
    const xml = res.data;

    const match = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    if (!match) return;

    const videoId = match[1];

    if (videoId !== ultimoVideo) {
        ultimoVideo = videoId;
        const canal = client.channels.cache.get(CHANNEL_ID);
        if (canal) canal.send(`🎬 ¡Nuevo video subido! https://youtu.be/${videoId}`);
    }
}

client.once("ready", () => {
    console.log("Bot listo");
    setInterval(checkYouTube, 60_000);
});

client.login(process.env.TOKEN);

const axios = require("axios");
const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// --- Servidor Express para Render ---
const app = express();
app.get("/", (req, res) => res.send("Bot funcionando correctamente"));
app.listen(process.env.PORT || 3000);

// --- Discord Client ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel]
});

// --- Variables de entorno ---
const CHANNEL_ID = process.env.CHANNEL_ID;
const YT_CHANNEL = process.env.YT_CHANNEL;

let ultimoVideo = null;

// --- Detectar si un video es un Short ---
async function esShort(videoId) {
    try {
        const res = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
        return res.data.includes("shortsVideoRenderer");
    } catch (err) {
        console.error("Error comprobando si es short:", err.message);
        return false;
    }
}

// --- Comprobar YouTube ---
async function checkYouTube() {
    try {
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL}`;
        const res = await axios.get(url);
        const xml = res.data;

        const match = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        if (!match) return;

        const videoId = match[1];

        // --- Ignorar Shorts ---
        if (await esShort(videoId)) {
            console.log("Short detectado, ignorando:", videoId);
            return;
        }

        // --- Nuevo video ---
        if (videoId !== ultimoVideo) {
            ultimoVideo = videoId;

            const canal = await client.channels.fetch(CHANNEL_ID);
            if (canal) {
                canal.send(
                    `@everyone\n\n🎬 **¡Nuevo video disponible en el canal!**\n\n📺 https://youtu.be/${videoId}\n\n✨ ¡No olvides dejar tu like y comentario!`
                );
            }
        }
    } catch (err) {
        console.error("Error al comprobar YouTube:", err.message);
    }
}

// --- Bot listo ---
client.once("ready", () => {
    console.log("Bot listo");

    client.user.setPresence({
        activities: [{ name: "👀 Viendo a Triko", type: 3 }],
        status: "online"
    });

    setInterval(checkYouTube, 60_000); // cada minuto
});

// --- Login ---
client.login(process.env.TOKEN);

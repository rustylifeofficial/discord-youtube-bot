const axios = require("axios");
const express = require("express");
const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// --- Servidor Express para Render ---
const app = express();
app.get("/", (req, res) => res.send("Bot funcionando correctamente"));
app.listen(process.env.PORT || 3000);

// --- Mantener Render despierto ---
setInterval(() => {
    axios.get("https://discord-youtube-bot-fheh.onrender.com").catch(() => {});
}, 5 * 60 * 1000); // cada 5 minutos

// --- Discord Client ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel],
    retryLimit: 5
});

// --- Handlers para evitar desconexiones ---
client.on("error", (err) => {
    console.error("❌ Error en Discord:", err);
});

client.on("shardDisconnect", (event, shardId) => {
    console.log(`⚠️ Shard ${shardId} desconectado. Intentando reconectar...`);
});

client.on("shardReconnecting", (shardId) => {
    console.log(`🔄 Reconexion del shard ${shardId} en progreso...`);
});

client.on("shardResume", (shardId) => {
    console.log(`✅ Shard ${shardId} reconectado correctamente`);
});

// --- Variables de entorno ---
const CHANNEL_ID = process.env.CHANNEL_ID;
const YT_CHANNEL = process.env.YT_CHANNEL;

// --- Cargar último video desde archivo ---
let ultimoVideo = null;
const archivo = "ultimoVideo.txt";

if (fs.existsSync(archivo)) {
    ultimoVideo = fs.readFileSync(archivo, "utf8").trim();
    console.log("Último video cargado:", ultimoVideo);
}

// --- Comprobar YouTube ---
async function checkYouTube() {
    try {
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL}`;
        const res = await axios.get(url);
        const xml = res.data;

        const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
        if (!entryMatch) return;

        const entry = entryMatch[1];

        const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const linkMatch = entry.match(/<link rel="alternate" href="(.*?)"/);

        if (!idMatch || !titleMatch || !linkMatch) return;

        const videoId = idMatch[1];
        const link = linkMatch[1];

        // Ignorar shorts
        if (link.includes("/shorts/")) {
            console.log("Short detectado, ignorando:", videoId);
            return;
        }

        // Evitar repetir el mismo video
        if (videoId === ultimoVideo) {
            console.log("Video repetido, no se anuncia.");
            return;
        }

        // --- MENSAJE ÚNICO ---
        const mensaje = `@everyone\n\n🎬 **¡Nuevo video disponible en el canal!**\n\n📺 https://youtu.be/${videoId}\n\n✨ ¡No olvides dejar tu like y comentario!`;

        // Guardar ID del último video
        ultimoVideo = videoId;
        fs.writeFileSync(archivo, videoId);

        // Enviar mensaje al canal
        const canal = await client.channels.fetch(CHANNEL_ID);
        if (canal) canal.send(mensaje);

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

    setInterval(() => {
        console.log("⏳ Chequeando YouTube...");
        checkYouTube();
    }, 60_000);
});

// --- Login ---
client.login(process.env.TOKEN);

const axios = require("axios");
const express = require("express");
const fs = require("fs");
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

// --- Cargar último video desde archivo ---
let ultimoVideo = null;
const archivo = "ultimoVideo.txt";

if (fs.existsSync(archivo)) {
    ultimoVideo = fs.readFileSync(archivo, "utf8").trim();
    console.log("Último video cargado:", ultimoVideo);
}

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

        const idMatch = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = xml.match(/<title>(.*?)<\/title>/);

        if (!idMatch || !titleMatch) return;

        const videoId = idMatch[1];
        const titulo = titleMatch[1].toLowerCase(); // minúsculas para comparar fácil

        // --- Ignorar Shorts ---
        if (await esShort(videoId)) {
            console.log("Short detectado, ignorando:", videoId);
            return;
        }

        // --- Si es el mismo video, no anunciar ---
        if (videoId === ultimoVideo) {
            console.log("Video repetido, no se anuncia.");
            return;
        }

        // --- Determinar mensaje según el título ---
        let mensaje = "";

        if (
            titulo.includes("update") ||
            titulo.includes("actualizacion")
        ) {
            mensaje = `@everyone\n\n🛠 **Nueva Update de Rust**\n\n📺 https://youtu.be/${videoId}`;
        }
        else if (
            titulo.includes("tienda") ||
            titulo.includes("skin") ||
            titulo.includes("skins")
        ) {
            mensaje = `@everyone\n\n🎨 **Nueva Tienda de Rust**\n\n📺 https://youtu.be/${videoId}`;
        }
        else {
            mensaje = `@everyone\n\n🎬 **¡Nuevo video disponible en el canal!**\n\n📺 https://youtu.be/${videoId}\n\n✨ ¡No olvides dejar tu like y comentario!`;
        }

        // --- Guardar el nuevo video ---
        ultimoVideo = videoId;
        fs.writeFileSync(archivo, videoId);

        // --- Enviar mensaje ---
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

    setInterval(checkYouTube, 60_000); // cada minuto
});

// --- Login ---
client.login(process.env.TOKEN);

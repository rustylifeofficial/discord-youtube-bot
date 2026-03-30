const axios = require("axios");
const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const app = express();
app.get("/", (req, res) => res.send("Bot funcionando"));
app.listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel]
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const YT_CHANNEL = process.env.YT_CHANNEL;

let ultimoVideo = null;

async function checkYouTube() {
    try {
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL}`;
        const res = await axios.get(url);
        const xml = res.data;

        const match = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        if (!match) return;

        const videoId = match[1];

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

client.once("ready", () => {
    console.log("Bot listo");

    client.user.setPresence({
        activities: [{ name: "👀 Viendo a Triko", type: 3 }],
        status: "online"
    });

    setInterval(checkYouTube, 60_000);
});

client.login(process.env.TOKEN);

});

client.login(process.env.TOKEN);

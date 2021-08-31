const Discord = require("discord.js")
const ytdl = require("ytdl-core");
const { Client, Intents } = require('discord.js')
const config = require("./config.json")
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] })

const prefix = '-';
const queue = new Map();

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.trim().split(/ +/g);
    const command = args[0].slice(prefix.length).toLowerCase();

    if (command === "nghegido") {
        var ds_lenh = ["-phát", "-next", "-skip", "-stop", "-leave"]
        const list_send = ds_lenh.map((item, i) => `${i + 1}. ${item}`).join("\r\n")
        message.channel.send('Sử dụng các lệnh dưới đây để điều khiển: \n' + list_send)
    } else if (command === "phát") {
        if (!args[1]) return message.reply('Hãy để lại ít nhất 1 tên bài hát!');
        execute(message, serverQueue);
        return;
    } else if (command === "tiếp") {
        skip(message, serverQueue);
        return;
    } else if (command === "dừng") {
        stop(message, serverQueue);
        return;
    }
})

async function execute(message, serverQueue) {
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "Bạn cần ở trong một chanel âm thanh để có thể play nhạc tôi!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "Tôi cần ở trong phòng âm thanh!"
        );
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        //Đợi bot nó join vô phòng
        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send("Không tìm thấy bài hát nào với url đó!");
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} đã được thêm vào danh sách!`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "Bạn cần ở trong một chanel âm thanh để có thể bỏ qua nhạc tôi!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "Bạn cần ở trong một chanel âm thanh để có thể dừng nhạc tôi!"
        );

    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Đang phát: **${song.title}**`);
}

client.login('ODgyMTY3MzUxOTY4MTUzNjAx.YS3cXg.k2fPRz4IJY_VaRJHGWrNJkirp6k')
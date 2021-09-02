const Discord = require("discord.js")
var express = require("express");
var app = express();
const ytdl = require("ytdl-core");
const { Client, Intents } = require('discord.js')
const config = require("./config.json")
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] })

const prefix = '-';
const queue = new Map();
var index = 0;
var songInfo = null;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.trim().split(/ +/g);
    const command = args[0].slice(prefix.length).toLowerCase();

    if (command === "nghegido") {
        var ds_lenh = ["-phát: phát + url bài hát!", "-tiếp: tiếp theo trong danh sách bài hát!", "-dừng: dừng bài hát hiện tại!", "-ds: danh sách các bài hát đã thêm!", "-bye: bye nghe gì đó!"]
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
    } else if (command === "ds") {
        list(message, serverQueue)
        return;
    } else if (command === "lui") {
        previous(message, serverQueue)
        return;
    } else if (command === "bye") {
        leave(message, serverQueue)
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

    try {
        songInfo = await ytdl.getInfo(args[1]);
    } catch (err) {
        console.log(err);
        return message.channel.send("Không tìm thấy bài hát nào với url đó!");
    }

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
            return message.channel.send("Không thể play bài nhạc!");
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} đã được thêm vào danh sách!`);
    }
}

function skip(message, serverQueue) {
    index += 1;
    console.log(index);
    if (!message.member.voice.channel)
        return message.channel.send(
            "Bạn cần ở trong một chanel âm thanh để có thể bỏ qua nhạc tôi!"
        );
    if (!serverQueue)
        return message.channel.send("Không có bài nào đang phát để bỏ qua!");
    if (serverQueue.songs[index] == null) {
        index -= 1;
        return message.channel.send("Không có bài hát tiếp theo để nhảy tới!");
    } else {
        play(message.guild, serverQueue.songs[index]);
    }

}

function previous(message, serverQueue) {
    if (index == 0) {
        index = 0;
    } else {
        index -= 1;
    }
    console.log(index);
    if (!message.member.voice.channel)
        return message.channel.send(
            "Bạn cần ở trong một chanel âm thanh để có thể bỏ qua nhạc tôi!"
        );
    if (!serverQueue)
        return message.channel.send("Không có bài nào đang phát!");
    if (serverQueue.songs[index] == null) {
        return message.channel.send("Không có bài hát trước đó để lui về!");
    } else {
        play(message.guild, serverQueue.songs[index]);
    }
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            "Bạn cần ở trong một chanel âm thanh để có thể dừng nhạc tôi!"
        );

    if (!serverQueue)
        return message.channel.send("Không có bài nào đang phát để dừng");

    //Cần hàm stop nhạc
}

function leave(message, serverQueue) {
    message.channel.send("Bye bye ngài!");
    return serverQueue.connection.dispatcher.end();
}

function list(message, serverQueue) {
    if (serverQueue == null) {
        return message.channel.send('Danh sách các bài hát đây: \n' + "Không có bài hát nào được thêm!")
    } else {
        const list_send = serverQueue.songs.map((item, i) => `${i + 1}. ${item.title}`).join("\r\n")
        return message.channel.send('Danh sách các bài hát đây: \n' + list_send)
    }
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

client.login(config.TOKEN)
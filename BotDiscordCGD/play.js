const Discord = require("discord.js")
var express = require("express");
var app = express();
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const { Client, Intents } = require('discord.js')
const config = require("./config.json")
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] })

const prefix = '-';
const queue = new Map();
var index = 0;
var songInfo = null;
var dispatcher;
var song;
var stopMusic = false;

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
        var ds_lenh = ["-phát: phát + url bài hát hoặc tên bài hát!", "-tiếp: tiếp theo trong danh sách bài hát!", "-dừng: dừng bài hát hiện tại!", "-ds: danh sách các bài hát đã thêm hoặc ds + 1 số trong danh sách các bài hát đã thêm, vd: ds 1!", "-bye: bye nghe gì đó!"]
        const list_send = ds_lenh.map((item, i) => `${i + 1}. ${item}`).join("\r\n")
        message.channel.send({
            embed: {
                title: '🎵 Danh sách các lệnh cho BOT-Nhạc Nghe Gì Đó!!! 🎵',
                description: list_send,
                image: { url: 'https://media.discordapp.net/attachments/853096933462769740/871728272596156436/Logo-Sau.png?width=968&height=645' }
            }
        })
    } else if (command === "phát") {
        if (!args[1]) return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: 'Hãy để lại 1 URL hoặc tên 1 bài hát!',
            }
        })
        execute(message, serverQueue);
        return;
    } else if (command === "tiếp") {
        skip(message, serverQueue);
        return;
    } else if (command === "dừng") {
        stop(message, serverQueue);
        return;
    } else if (command === "ds") {
        if (args[1]) {
            playInList(message, serverQueue, args[1])
            return;
        } else {
            list(message, serverQueue)
            return;
        }
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
        return message.channel.send({
            embed: {
                title: '⚠️ Có gì đó không đúng - Nghe Gì Đó!!! ⚠️',
                description: 'Bạn cần ở trong một kênh âm thanh để tôi có thể phát nhạc!'
            }
        });
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send({
            embed: {
                title: '⚠️ Có gì đó không đúng - Nghe Gì Đó!!! ⚠️',
                description: 'Tôi cần có quyền nói để có thể phát nhạc, vui lòng cấp quyền cho tôi và thử lại!'
            }
        });
    }

    try {
        if (ytdl.validateURL(args[1])) {
            songInfo = await ytdl.getInfo(args[1]);
            song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
            };
        } else {
            message.channel.send({
                embed: {
                    title: '🔎 Đang tìm - Nghe Gì Đó!!! 🔎',
                    description: `Đang tìm bài hát **${args.join(' ').replace('-phát', '')}** cho bạn! 🔎`
                }
            });
            const video_finder = async(query) => {
                const videoResult = await ytSearch(query);
                return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
            }

            console.log(args.join(' ').replace('-phát', ''));
            const video = await video_finder(args.join(' ').replace('-phát', ''));
            if (video) {
                song = {
                    title: video.title,
                    url: video.url,
                };
            } else {
                message.channel.send({
                    embed: {
                        title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                        description: `Bài hát **${args.join(' ').replace('-phát', '')}** mà bạn yêu cầu không thể tìm thấy!`
                    }
                });
            }
        }
    } catch (err) {
        console.log(err);
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Bài hát **${args.join(' ').replace('-phát', '')}** mà bạn yêu cầu không thể tìm thấy!`
            }
        });
    }


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
            return message.channel.send({
                embed: {
                    title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                    description: `Không thể phát bài hát ${song.title}!`
                }
            });
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send({
            embed: {
                title: '🎵 Thông tin - Nghe Gì Đó!!! 🎵',
                description: `Đã thêm bài hát ${song.title} vào danh sách đợi!`
            }
        });
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Bạn cần ở trong một kênh âm thanh để tiếp tục phát bài hát!`
            }
        });
    if (stopMusic) {
        play(message.guild, serverQueue.songs[index]);
        stopMusic = false;
    } else {
        index += 1;
        console.log(index);
        if (!message.member.voice.channel)
            return message.channel.send({
                embed: {
                    title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                    description: `Bạn cần ở trong một kênh âm thanh để bỏ qua bài hát!`
                }
            });
        if (!serverQueue)
            return message.channel.send({
                embed: {
                    title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                    description: `Hiện tại không có bài hát nào đang phát!`
                }
            });
        if (serverQueue.songs[index] == null) {
            index -= 1;
            return message.channel.send({
                embed: {
                    title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                    description: `Không có bài hát nào tiếp theo trong danh sách!`
                }
            });
        } else {
            play(message.guild, serverQueue.songs[index]);
        }
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
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Bạn cần ở trong một kênh âm thanh để trở về bài hát trước!`
            }
        });
    if (!serverQueue)
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Bạn cần ở trong một kênh âm thanh để trở về bài hát trước!`
            }
        });
    if (serverQueue.songs[index] == null) {
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Không có bài hát nào trước đó trong danh sách!`
            }
        });
    } else {
        play(message.guild, serverQueue.songs[index]);
    }
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Bạn cần ở trong một kênh âm thanh để dừng bài hát!`
            }
        });

    if (!serverQueue)
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `không có bài hát nào đang phát để dừng!`
            }
        });

    stopMusic = true;
    dispatcher.pause();
}

function leave(message, serverQueue) {
    message.channel.send({
        embed: {
            title: '🎶 Tạm biệt - Nghe Gì Đó!!! 🎶',
            description: `Tạm biệt bạn - OUT!`
        }
    });
    return message.member.voice.channel.leave();
}

function list(message, serverQueue) {
    if (serverQueue == null) {
        return message.channel.send({
            embed: {
                title: '🎵 Danh sách các bài hát đã thêm! 🎵',
                description: `Hiện tại bạn chưa thêm bài hát nào!`
            }
        });
    } else {
        const list_send = serverQueue.songs.map((item, i) => `${ i + 1 }.${ item.title}`).join("\r\n")
        return message.channel.send({
            embed: {
                title: '🎵 Danh sách các bài hát đã thêm! 🎵',
                description: list_send
            }
        });
    }
}

function playInList(message, serverQueue, indexList) {
    var indexNumber = indexList - 1;
    if (!message.member.voice.channel)
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Bạn cần ở trong một kênh âm thanh để dừng bài hát!`
            }
        });

    if (serverQueue == null || indexNumber >= serverQueue.songs.length)
        return message.channel.send({
            embed: {
                title: '⚠️ Lỗi - Nghe Gì Đó!!! ⚠️',
                description: `Danh sách trống hoặc số bài hát không hợp lệ!`
            }
        });
    play(message.guild, serverQueue.songs[indexNumber]);
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    dispatcher = serverQueue.connection
        .play(ytdl(song.url, { highWaterMark: 1 << 25 }))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send({
        embed: {
            title: '🎶 Đang phát - Nghe Gì Đó! 🎶',
            description: `Đang phát: ** ${ song.title }**`
        }
    });
}

client.login(config.TOKEN)
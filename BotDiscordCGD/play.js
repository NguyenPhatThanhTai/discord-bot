const Discord = require("discord.js")
const { Client, Intents } = require('discord.js')
const config = require("./config.json")
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] })

const prefix = '-';

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.trim().split(/ +/g);
    const command = args[0].slice(prefix.length).toLowerCase();

    if (command === "nghegido") {
        var ds_lenh = ["-phát", "-next", "-skip", "-stop", "-leave"]
        const list_send = ds_lenh.map((item, i) => `${i + 1}. ${item}`).join("\r\n")
        message.channel.send('Sử dụng các lệnh dưới đây để điều khiển: \n' + list_send)
    } else if (command === "phát") {
        if (!args[1]) return message.reply('Hãy để lại ít nhất 1 tên bài hát!');
        if (args[2]) return message.reply('Quá nhiều tên bài hát!');
        message.channel.send('Đang phát ' + args[1])
    }
})

client.login('ODgyMTY3MzUxOTY4MTUzNjAx.YS3cXg.k2fPRz4IJY_VaRJHGWrNJkirp6k')
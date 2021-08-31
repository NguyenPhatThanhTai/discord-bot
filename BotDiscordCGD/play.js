const Discord = require("discord.js")
const { Client, Intents } = require('discord.js')
const config = require("./config.json")
const client = new Discord.Client({ intents: [Intents.FLAGS.GUILDS] })

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
    if (msg.content === "!ping") {
        msg.reply("pong")
    }
})

client.login(config.TOKEN)
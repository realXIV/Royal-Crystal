const Discord = require('discord.js');

const bot = new Discord.Client();

var config = require("./config.json");
var prefix = config.prefix;
var token = config.bottoken;
var logging = config.logging;
var fs = require("fs");
var mkdirp = require('mkdirp');
var masterlogloc = config.masterlogloc;
var msgno = 0;
var commandrole = config.commandrole
var ownerid = config.ownerid
var botname = config.botname
var pos = 0;

bot.login(token);

bot.on('ready', () => {
    startdate = new Date()
    console.log("Bot online (" + startdate + ")")
    changeStatus()
    var statchange = setInterval(changeStatus, 30000);
});

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();
fs.readdir("./cmd/", (err, files) => {
    if (err)
        console.error(err);
    console.log(`Loading a total of ${files.length} commands.`);
    files.forEach(f => {
        let props = require(`./cmd/${f}`);
        console.log(` Loading Command: ${props.help.name}.`);
        bot.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name);
        });
    });
});

bot.on('message', msg => {
    if (msg.channel.type !== 'text')
        return;

    if (logging) {
        log(msg)
    }

    if (msg.author.bot)
        return;

    if (!msg.content.startsWith(prefix))
        return;

    let command = (msg.content.split(" ")[0].slice(prefix.length)).toLowerCase();
    let params = msg.content.split(" ").slice(1);
    let perms = bot.elevation(msg);
    let cmd;

    if (command == "")
        return;

    if (bot.commands.has(command)) {
        cmd = bot.commands.get(command);
    } else if (bot.aliases.has(command)) {
        cmd = bot.commands.get(bot.aliases.get(command));
    } else if (command.includes(prefix)) {} else {
        msg.channel.sendMessage(`\`${command}\` is not a valid command or alias.`)
    }

    if (cmd) {
        if (perms < cmd.conf.permLevel)
            return;
        cmd.run(bot, msg, params, config, perms);
    }
});

function log(msg) {
    mkdirp(`./logs/${msg.guild.id}`, function(err) {})
    currentdate = new Date()
    writecontent = (`${currentdate.toUTCString()} : ${msg.author.username} said: "${msg.content}" in (${msg.channel.name})\n`)
    serverwritecontent = (`${currentdate.toUTCString()} : ${msg.author.username} said: "${msg.content}" in (${msg.channel.name}) in (${msg.guild.name})\n'`)
    fs.appendFile(`./logs/${msg.guild.id}/${msg.channel.name}.txt`, writecontent, function(error) {});
    fs.appendFile(`./logs/${masterlogloc}`, serverwritecontent, function(error) {});
}

process.on("unhandledRejection", err => {
    fs.appendFile("error.txt", err.stack + "\n", function(error) {});
    console.log("Unhandled Error: \n" + err.stack);
});

bot.elevation = function(msg) {
    let permlvl = 0;
    let admin_role = msg.guild.roles.find("name", "Admin");
    if (admin_role && msg.member.roles.has(admin_role.id) || msg.author.id == msg.guild.owner.id)
        permlvl = 2;
    if (msg.author.id === ownerid)
        permlvl = 3;
    return permlvl;
};

bot.reload = function(command) {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./cmd/${command}`)];
            let cmd = require(`./cmd/${command}`);
            bot.commands.delete(command);
            bot.aliases.forEach((cmd, alias) => {
                if (cmd === command)
                    bot.aliases.delete(alias);
            });

            bot.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                bot.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

bot.modlog = function(msg, commandname, info, hex) {
    try {
        var modlogchannel = msg.guild.channels.find('name', 'mod_log');
    } catch (err) {};
    let embed = {
        "color": parseInt(hex, 16),
        "description": `​**Command:** ${commandname}
**Action:** ${info}`,
        "author": {
            "name": `${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
            "icon_url": msg.author.avatarURL
        },
        "timestamp": msg.createdAt
    }
    modlogchannel.sendMessage("", {
        embed
    }).catch(err => msg.reply(err));
};

function changeStatus() {
    let TextChannels = bot.channels.filter(e => e.type === 'text').size;
    let VoiceChannels = bot.channels.filter(e => e.type === 'voice').size;
    var statuses = [`Currently serving: ${bot.guilds.size} guilds.`, `Prefix: ${prefix}`, `Users: ${bot.users.size}`, `${TextChannels} text channels.`, `${VoiceChannels} voice channels.`];
    bot.user.setGame(statuses[pos])
    pos++
    if (pos > statuses.length - 1) {
        pos = 0
    };
}

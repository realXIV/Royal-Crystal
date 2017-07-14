const FuzzySet = require('fuzzyset.js')
module.exports = (bot, msg) => {
    var prefixtrue = false;
    if (msg.content.startsWith(`<@!${bot.user.id}> `)) {
        msg.content = msg.content.replace('!', '');
    }

    if (msg.content.startsWith(bot.prefix))
        prefixtrue = true;

    if (msg.channel.type !== 'text' || msg.author.bot)
        return;

    if (!msg.content.startsWith(`<@${bot.user.id}> `) && !prefixtrue)
        return;

    if (prefixtrue) {
        var command = (msg.content.split(" ")[0].slice(bot.prefix.length)).toLowerCase();
        var params = msg.content.split(" ").slice(1);
    } else {
        var command = (msg.content.split(" ")[1].slice(`<@${bot.user.id}>`)).toLowerCase();
        var params = msg.content.split(" ").slice(2);
    }

    let perms = bot.funcs.elevation(msg, bot);
    let cmd;

    if (!command)
        return;

    basecmdarray = Array.from(bot.commands.keys())
    cmdaliasarray = Array.from(bot.aliases.keys())
    commandarray = basecmdarray.concat(cmdaliasarray)

    a = FuzzySet(commandarray) 
    try { 
    fuzzycmd = a.get(command)[0]
    if (fuzzycmd[0] >= 0.6) {command = fuzzycmd[1]}
    } catch (err) { 
    fuzzycmd = null} 

    if (bot.commands.has(command)) {
        cmd = bot.commands.get(command);
    } else if (bot.aliases.has(command)) {
        cmd = bot.commands.get(bot.aliases.get(command));
    }

    if (cmd) {
        if (perms < cmd.conf.permLevel)
            return;
        cmd.run(bot, msg, params, perms);
    }
}

class Debug {
    constructor() {
        this.help = {
            name: 'debug',
            usage: 'debug',
            description: 'Returns debug log',
        };
        this.conf = {
            aliases: [],
            adminOnly: true
        };
    }

    async run(client, msg, args) {
        const fs = require('fs');
        let errorContent = '';
        try {
            // Read log content
            errorContent = await fs.readFileSync('./error/log.txt');
        } catch (e) {
            client.logger.error(e)
        }

        errorContent = errorContent.toString();

        // Split log every 1000 characters
        let data = client.utils.splitString(errorContent, 1000);

        // Handle the message
        msg.delete();
        const generateEmbed = page => {
            const embed = new Discord.MessageEmbed()
                .setTitle(`Debug Logs (${data.length} page(s))`)
                .addField(`Page ${page+1}`, `\`\`\`Haskell\n${data[page]}\`\`\``)
            return embed
        }

        const author = msg.author;

        msg.channel.send(generateEmbed(0)).then(message => {
            if (data.length <= 1) return;
            message.react('➡️')
            message.react('🛑')
            const collector = message.createReactionCollector(
                (reaction, user) => ['⬅️', '➡️', '🛑'].includes(reaction.emoji.name) && user.id === author.id,
            )

            let currentIndex = 0
            collector.on('collect', reaction => {
                message.reactions.removeAll().then(async () => {
                    if (reaction.emoji.name === '⬅️')
                        currentIndex -= 1;
                    else if (reaction.emoji.name === '➡️')
                        currentIndex += 1;
                    else if (reaction.emoji.name === '🛑')
                        return message.delete();
                    message.edit(generateEmbed(currentIndex))
                    if (currentIndex !== 0) await message.react('⬅️')
                    if (currentIndex + 1 < data.length) message.react('➡️')
                    message.react('🛑')
                })
            })
        })
    }
}

module.exports = new Debug();
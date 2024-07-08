class Purge {
    constructor() {
        this.help = {
            name: 'purge',
            usage: 'purge [amount]',
            description: 'Delete messages in a channel.',
        };
        this.conf = {
            aliases: ['prune'],
            staffOnly: true
        };
    }

    async run(client, msg, args) {
       // Amount of messages
       const amount = args[0];

       // If amount isn't a number
       if (!(/^\d+$/.test(amount)))
        return msg.sendEmbed(`> Invalid amount.`, {
            color: 'red',
            author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({ dynamic: true })
            },
            footer: {
                text: 'Error'
            },
            timestamp: new Date()
        });

        // If amount is larger than 99 or smaller than 1, return
        if (parseInt(amount) > 100 || parseInt(amount) < 1)
            return msg.sendEmbed(`> Can't delete more than 100 messages.`, {
                color: 'red',
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.avatarURL({ dynamic: true })
                },
                footer: {
                    text: 'Error'
                },
                timestamp: new Date()
            });

        
        // Have to create case before deleting the messages, because of Unknown Message API error (message gets deleted)
        await client.utils.createCase(msg, client, null, 'purge', amount);

        // Delete the messages
        msg.channel.bulkDelete(parseInt(amount))
        .catch(e => client.logger.error(e));
    }
}

module.exports = new Purge();
class Nuke {
    constructor() {
        this.help = {
            name: 'nuke',
            usage: 'nuke [reason?]',
            description: 'Nuke a channel.',
        };
        this.conf = {
            aliases: [],
            adminOnly: true
        };
    }

    async run(client, msg, args) {
        // Grab current channel position
        const position = msg.channel.position;

        // Reason
        const reason = args.length ? args.join(' ') : 'none';

        // Confirm msg
        msg.sendEmbed(`Are you sure you want to nuke this channel? (y/n)`, {
            color: 'teal',
            author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                    dynamic: true
                })
            },
            footer: {
                text: 'Nuke'
            },
            timestamp: new Date()
        });

        // Collect message
        const confirm = await client.utils.collectMessages(msg, 1, 10000)

        // If the answer is no, return
        if (confirm[0].match(/^n(o)?$/i)) {
            return msg.sendEmbed(`Nuke has been cancelled`, {
                color: 'red',
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.avatarURL({
                        dynamic: true
                    })
                },
                footer: {
                    text: 'Nuke'
                },
                timestamp: new Date()
            });
        } else
        // If the answer is yes
        if (confirm[0].match(/^y(es)?$/i)) {
            // Delete channel
            msg.channel.delete().then(async(c) => {
                // Clone the deleted channel
                c.clone().then(async(ch) => {
                    // Set channel position to previous channel position
                    await ch.setPosition(position).catch(e => client.logger.error(e));

                    // Create embed
                    const embed = {
                        description: `**This channel has been nuked!** :bomb:`,
                        author: {
                            name: msg.author.tag,
                            icon_url: msg.author.avatarURL({
                                dynamic: true
                            })
                        },
                        footer: {
                            text: 'Nuke'
                        },
                        color: 'green',
                        image: {
                            url: 'https://media1.tenor.com/images/2e50750a1356ee2cf828090cbb864634/tenor.gif?itemid=4464831',
                        },
                        timestamp: new Date()
                    };

                    // Send embed and delete message after 10 seconds
                    ch.send({ embed: embed }).then(m => m.delete({ timeout: 15000 })).catch(e => client.logger.error(e));

                    // Create case
                    await client.utils.createCase(msg, client, null, 'nuke', reason, null, ch);
                }).catch(e => client.logger.error(e))
            }).catch(e => client.logger.error(e))
        } else {
            // If neither no nor yes was returned, return invalid option
            return msg.sendEmbed('Invalid option.', {
                color: 'red',
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.avatarURL({
                        dynamic: true
                    })
                },
                footer: {
                    text: 'Error'
                }
            });
        }
    }
}

module.exports = new Nuke();
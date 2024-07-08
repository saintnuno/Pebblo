class Ban {
    constructor() {
        this.help = {
            name: 'ban',
            usage: 'ban [user] [reason?]',
            description: 'Ban a member from the server.',
        };
        this.conf = {
            aliases: ['hammer'],
            staffOnly: true
        };
    }

    async run(client, msg, args) {
       // Find member
       const member = await client.utils.fetchMember(msg, client, args[0]);

       // Reason
       const reason = args.shift().length ? args.join(' ') : 'none';

       // If author's permission level is equal to or smaller than the user's permission level, return
       if (client.utils.getPermissionLevel(msg.author, client).length <= client.utils.getPermissionLevel(member.user, client).length)
        return msg.sendEmbed(`> Insufficient permissions to ban <@${member.id}>.`, {
            color: 'red',
            author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({ dynamic: true })
            },
            footer: {
                text: 'Insufficient permissions'
            },
            timestamp: new Date()
        });

        // Ban the member
        member.ban()
        .then(async () => {
            // Create case in database
            await client.utils.createCase(msg, client, member, 'ban', reason);
        })
        .catch(e => client.logger.error(e));
    }
}

module.exports = new Ban();
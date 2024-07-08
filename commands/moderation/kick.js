class Kick {
    constructor() {
        this.help = {
            name: 'kick',
            usage: 'kick [user] [reason?]',
            description: 'Kick a member from the server.',
        };
        this.conf = {
            aliases: [],
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
        return msg.sendEmbed(`> Insufficient permissions to kick <@${member.id}>.`, {
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
        member.kick()
        .then(async () => {
            // Create case in database
            await client.utils.createCase(msg, client, member, 'kick', reason);
        })
        .catch(e => client.logger.error(e));
    }
}

module.exports = new Kick();
class Unban {
    constructor() {
        this.help = {
            name: 'unban',
            usage: 'unban [user] [reason?]',
            description: 'Unban a member from the server.',
        };
        this.conf = {
            aliases: [],
            staffOnly: true
        };
    }

    async run(client, msg, args) {
       // Find ban
       const ban = await client.utils.findBans(msg, args[0]);

       // Reason
       const reason = args.shift().length ? args.join(' ') : 'none';

       // Unban member
       msg.guild.members.unban(ban.user.id)
       .then(async (user) => {
           // Create case in database
           await client.utils.createCase(msg, client, user, 'unban', reason)
       })
       .catch(e => client.logger.error(e))
    }
}

module.exports = new Unban();
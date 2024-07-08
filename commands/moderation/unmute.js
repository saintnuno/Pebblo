class Unmute {
    constructor() {
        this.help = {
            name: 'unmute',
            usage: 'unmute [user] [reason?]',
            description: 'Unmute a user.',
        };
        this.conf = {
            aliases: [],
            staffOnly: true
        };
    }

    async run(client, msg, args) {
       // Find member
       const member = await client.utils.fetchMember(msg, client, args[0]);

       // Check for duration
       const durationString = /(^\d{1,2})[s,m,h]/.test(args[1]) ? args[1] : null;
       
       // Remove items in array based on if duration was given or not
       client.utils.removeItems(args, durationString == null ? 1 : 2);

       // Reason
       const reason = args.length ? args.join(' ') : 'none';

       // Fetch mute from database
       const mute = await client.mutes.findOne({
           where: {
               _id: member.id,
               active: true
           }
       })

       if (!mute)
        return msg.sendEmbed(`> <@${member.id}> isn't muted.`, {
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

       // If author's permission level is equal to or smaller than the user's permission level, return
       if (client.utils.getPermissionLevel(msg.author, client).length <= client.utils.getPermissionLevel(member.user, client).length)
        return msg.sendEmbed(`> Insufficient permissions to unmute <@${member.id}>.`, {
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

        // Get Muted roles
       let muteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'muted').map(r => r)[0];
       let staffMuteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'staff muted').map(r => r)[0];

       // If muteRole doesn't exist, return error
       if (muteRole == null)
            return client.logger.error('muteRole doesn\'t exist.')
        // If staffMuteRole doesn't exist, return error
        if (staffMuteRole == null)
            return client.logger.error('staffMuteRole doesn\'t exist.');

        
        
        // Handle unmute
        await client.utils.handleUnmute(msg, client, member, true)

        // Create case
        await client.utils.createCase(msg, client, member, 'unmute', reason);
    }
}

module.exports = new Unmute();
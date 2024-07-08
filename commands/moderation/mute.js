class Mute {
    constructor() {
        this.help = {
            name: 'mute',
            usage: 'mute [user] [duration] [reason?]',
            description: 'Mute a user.',
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

       // If author's permission level is equal to or smaller than the user's permission level, return
       if (client.utils.getPermissionLevel(msg.author, client).length <= client.utils.getPermissionLevel(member.user, client).length)
        return msg.sendEmbed(`> Insufficient permissions to mute <@${member.id}>.`, {
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

       // If muteRole doesn't exist, create it
       if (muteRole == null)
        msg.guild.roles.create({
            data: {
                name: 'Muted'
            }
        }).then(r => {
            // Deny SEND_MESSAGES in every channel
            msg.guild.channels.cache.map(c => {
                c.updateOverwrite(r.id, {
                    SEND_MESSAGES: false
                })
            })
            // Set new muteRole
            muteRole = r;
        }).catch(e => client.logger.error(e));

        // If staffMuteRole doesn't exist, create it
        if (staffMuteRole == null)
            msg.guild.roles.create({
                data: {
                    name: 'Staff Muted'
                }
            }).then(r => {
                // Deny SEND_MESSAGES in every channel
                msg.guild.channels.cache.map(c => {
                    c.updateOverwrite(r.id, {
                        SEND_MESSAGES: false
                    })
                })
                // Set new staffMuteRole
                staffMuteRole = r;
            }).catch(e => client.logger.error(e));

        const durationMS = durationString ? client.utils.convertStringToMS(durationString) : null;

        const durationLongString = durationString ? client.utils.convertMStoString(durationMS) : null;
        
        // Handle mutes
        await client.utils.handleMute(msg, client, member.user, durationMS)

        // Create case
        await client.utils.createCase(msg, client, member, 'mute', reason, durationLongString);
    }
}

module.exports = new Mute();
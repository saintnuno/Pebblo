class Play {
    constructor() {
        this.help = {
            name: 'play',
            usage: 'play [query]',
            description: 'Play a song.'
        }
        this.conf = {
            aliases: [],
            adminOnly: false,
            disabled: true
        }
    }
    
    async run(client, msg, args) {
        // Check if member is in a voice channel. If not, return error
        if (!msg.member || !msg.member.voice.channel)
            return msg.sendEmbed(`> You must be in a voice channel to use this command.`, {
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


        // Get channel permissions
        const perms = msg.member.voice.channel.permissionsFor(client.user);

        // If bot doesn't have permission to speak, return
        if (!perms.has('SPEAK'))
            return msg.sendEmbed('> I don\'t have permission to speak in your channel.', {
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

        // If bot doesn't hav permission to join the channel, return
        if (!perms.has('CONNECT'))
            return msg.sendEmbed('> I don\'t have permission to join your channel.', {
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

        
        const query = args.join(' ');

        // Fetch song details
        let songInfo = await client.utils.getSongs(client, query);

        // If no song was found, return
        if (songInfo == null)
            return msg.sendEmbed('> No results were found.', {
                color: 'Red',
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.avatarURL({ dynamic: true })
                },
                footer: {
                    text: 'Error'
                },
                timestamp: new Date()
            });

        // Overwrite queueConstruct
        client.queueConstruct = {
            textChannel: msg.channel,
            connection: null,
            songs: [],
            volume: 100,
            filters: [],
            realseek: 0,
            playing: true
        };

        // Song object
        let song = {
            title: songInfo.title,
            description: songInfo.description,
            url: `https://www.youtube.com/watch?v=${songInfo.id}`,
            durationFormatted: songInfo.durationFormatted,
            duration: songInfo.duration,
            thumbnail: songInfo.thumbnail.url,
            authorName: songInfo.channel.name,
            authorURL: songInfo.channel.icon.url
        }
        
        // Handle play
        await client.utils.handlePlay(msg, client, song);
    }
}

module.exports = new Play();
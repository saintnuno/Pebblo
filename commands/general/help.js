class Help {
    constructor() {
        this.help = {
            name: 'help',
            usage: 'help',
            description: 'Get information on a command.',
        };
        this.conf = {
            aliases: [],
            adminOnly: false
        };
    }

    async run(client, msg, args) {
        // If no command is given, return default help
        if (!args.length)
            return await client.utils.generateHelp(msg, client);

        // Fetch command
        let cmd = client.commands.filter(c => client.utils.getPermissionLevel(msg.author, client).includes(c.conf.permissionLevel)).get(args[0]) || client.commands.filter(c => client.utils.getPermissionLevel(msg.author, client).includes(c.conf.permissionLevel)).find(c => c.conf.aliases && c.conf.aliases.includes(args[0]));

        // If no command is found, return
        if (!cmd)
            return msg.sendEmbed(`> The command **${args[0]}** wasn't found.`, {
                color: 'red',
                author: {
                    name: msg.author.tag,
                    icon_url: msg.author.avatarURL({ dynamic: true })
                }
            });

        // Embed fields
        let fields = [
            {
                name: 'Description',
                value: `${cmd.help.description}`,
                inline: false
            },
            {
                name: 'Usage',
                value: `${config.discord.prefix}${cmd.help.usage}`,
                inline: true
            },
            {
                name: 'Permission Level',
                value: `${cmd.conf.permissionLevel === 2 ? 'ADMIN' : (cmd.conf.permissionLevel === 1 ? 'STAFF' : 'DEFAULT')}`,
                inline: true
            },
            {
                name: 'Aliases',
                value: `${cmd.conf.aliases.length ? cmd.conf.aliases.join(', ') : 'none'}`,
                inline: false
            },
        ]

        // Send embed
        msg.sendEmbed(`> Help for **${cmd.help.name}**`, {
            color: 'role',
            author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({ dynamic: true })
            },
            fields: fields,
            footer: {
                text: client.utils.getPermissionName(msg.author)
            },
            timestamp: new Date()
        })
    }
}

module.exports = new Help();
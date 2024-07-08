class Reply {
	constructor() {
		this.help = {
			name: 'reply',
			usage: 'reply [msg]',
			description: 'Reply to a user in a support channel.',
		};
		this.conf = {
			aliases: [],
			staffOnly: true
		};
	}

	async run(client, msg, args) {
		try {
			// Fetch ticket using channel id
			let ticket = await client.tickets.findOne({
				where: {
					_id: msg.channel.id
				}
			})

			// If channel isn't a ticket channel, return error
			if (!ticket)
				return msg.sendEmbed(`> You must be in a ticket channel in order to use this command.`, {
					title: 'No ticket channel',
					color: 'red'
				});

			// If no message content is given, return
			if (!args.length && !msg.attachments.size)
				return msg.sendEmbed(`> You have to reply with a message.`, {
					title: 'Invalid message content',
					color: 'red'
				});

			// Fetch the user
			let user = client.users.cache.get(ticket.user);

			// If user is undefined, return
			if (user == null)
				return client.logger.error(`User is undefined`);

			// Delete the command
			msg.attachments.size ? msg.delete({ timeout: 1000 }) : msg.delete();

			// Send a message in the ticket channel
			msg.sendEmbed(msg.attachments.size ? `${args.join(' ')}\n[${msg.attachments.map(a => a.name)[0]}](${msg.attachments.map(a => a.attachment)[0]})` : `> ${args.join(' ')}`, {
				author: {
					name: msg.author.tag,
					icon_url: msg.author.avatarURL({
						dynamic: true
					})
				},
				color: 'green',
				footer: {
					text: msg.member.roles.highest.name.trim()
				},
				image: {
					url: msg.attachments.size ? msg.attachments.map(a => a.attachment)[0] : (/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|gifv)/g.test(args.join(' ')) ? msg.content.split(' ').filter(i => i.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|gifv)/g))[0] : '')
				},
				timestamp: new Date()
			});

			// Send a message to the user
			msg.sendEmbed(msg.attachments.size ? `${args.join(' ')}\n[${msg.attachments.map(a => a.name)[0]}](${msg.attachments.map(a => a.attachment)[0]})` : `> ${args.join(' ')}`, {
				author: {
					name: msg.author.tag,
					icon_url: msg.author.avatarURL({
						dynamic: true
					})
				},
				color: 'green',
				footer: {
					text: msg.member.roles.highest.name.trim()
				},
				image: {
					url: msg.attachments.size ? msg.attachments.map(a => a.attachment)[0] : (/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|gifv)/g.test(args.join(' ')) ? msg.content.split(' ').filter(i => i.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|gifv)/g))[0] : '')
				},
				timestamp: new Date()
			}, user);

			// Update message count (for message logging on the website later on)
			await client.utils.updateMessageCount(user, client);
		} catch (e) {
			client.logger.error(e);
		}
	}
}


module.exports = new Reply();
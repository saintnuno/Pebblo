class Ticket {
	constructor() {
		this.help = {
			name: 'ticket',
			usage: 'ticket [user]',
			description: 'Open a ticket for a user.',
		};
		this.conf = {
			aliases: [],
			staffOnly: true
		};
	}

	async run(client, msg, args) {
		try {
			// If no arguments, return
			if (!args.length)
				return msg.sendEmbed(`> No ticket ID or user given.`, {
					color: 'red',
					author: {
						name: msg.author.tag,
						icon_url: msg.author.avatarURL({ dynamic: true })
					}
				})

			// Fetch member
			let user = await client.utils.fetchMember(msg, client, args[0]);

			// If user is undefined, return
			if (user == null)
				return;

			// Fetch open ticket from database
			const ticket = await client.tickets.findOne({
				where: {
					user: user.id,
					status: true
				}
			});

			// If a ticket already exists, return
			if (ticket)
				return msg.sendEmbed(`> User already has an open ticket <#${ticket._id}>.`, {
					color: 'red',
					author: {
						name: msg.author.tag,
						icon_url: msg.author.avatarURL({ dynamic: true })
					},
					footer: {
						text: 'Open ticket exists'
					},
					timestamp: new Date()
				});

			// Handle the ticket
			await client.utils.handleTicket(msg, client, user.user);

			// React to the message
			msg.react('✅');
		} catch(e) {
			client.logger.error(e);
		}
	}
}

module.exports = new Ticket();



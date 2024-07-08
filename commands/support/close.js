class Close {
	constructor() {
		this.help = {
			name: 'close',
			usage: 'close [ticketID?]',
			description: 'Close a ticket.',
		};
		this.conf = {
			aliases: [],
			staffOnly: true
		};
	}

	async run(client, msg, args) {
		try {
			// Fetch ticket using channel ID
			let ticket = await client.tickets.findOne({
				where: {
					_id: args.length ? args[0] : msg.channel.id
				}
			})

			// If channel isn't a ticket channel, return error
			if (!ticket)
				return msg.sendEmbed(args.length && /^\d+$/.test(args[0]) ? `> No ticket with the ID \`${args[0]}\` found.` : `> You must be in a ticket channel in order to use this command.`, {
					title: 'No ticket channel',
					color: 'red'
				});

			// Get the user
			let user = client.users.cache.get(ticket.user);

			// If user is undefined, return
			if (user == null)
				return client.logger.error(`User is undefined`);

			// The DM channel
			let userChannel = ticket.channelDM.length ? client.channels.cache.get(ticket.channelDM) : '';

			if (userChannel == null)
				return client.logger.error(`UserChannel is undefined`);

			// Send message in ticket channel
			msg.sendEmbed(`> Ticket has been closed. Channel will be deleted in a few seconds.`, {
				title: 'Ticket closed',
				color: 'green'
			});

			// Delete channel after 10 seconds
			setTimeout(() => {
				msg.guild.channels.cache.get(args.length ? args[0] : msg.channel.id).delete();
			}, 10000)

			// Notify the user
			msg.sendEmbed(`> Your ticket has been closed`, {
				title: `Closed by ${msg.author.tag}`,
				color: 'green'
			}, user);

			// Update message count (for message logging on the website later on)
			await client.utils.updateMessageCount(user, client);

			// Set status to closed
			await client.tickets.update({
				status: false
			}, {
				where: {
					_id: args.length ? args[0] : msg.channel.id
				}
			});

			if (!userChannel && !userChannel.length)
				return;

			userChannel.messages.fetch({
					limit: 1
				})
				.then(async (messages) => {
					let messageID = messages.map(m => m)[0].id;
					// Update last message ID (for message logging on the website later on)
					await client.tickets.update({
						lastMessage: messageID
					}, {
						where: {
							_id: args.length ? args[0] : msg.channel.id
						}
					});
				})
				.catch(e => client.logger.error(e));
		} catch (e) {
			client.logger.error(e);
		}
	}
}


module.exports = new Close();
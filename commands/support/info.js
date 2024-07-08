class Info {
	constructor() {
		this.help = {
			name: 'info',
			usage: 'info [user|ticketID]',
			description: 'Get ticket info.',
		};
		this.conf = {
			aliases: [],
			staffOnly: true
		};
	}

	async run(client, msg, args) {
		try {
			// Fetch ticket
			const ticketByID = await client.tickets.findOne({
				where: {
					_id: args[0]
				}
			})

			// If argument isn't a ticket, look for users
			if (!ticketByID) {
				client.logger.info(`No ticket found. Looking for users.`);

				// Fetch user
				let user = await client.utils.fetchMember(msg, client, args[0])

				// Fetch all tickets from the user
				const ticketByUser = await client.tickets.findAll({
					where: {
						user: user.id
					}
				})

				// If no tickets were found, return
				if (!ticketByUser.length)
					return msg.sendEmbed(`> User has no previous tickets.`, {
						color: 'role',
						author: {
							name: user.user.tag,
							icon_url: user.user.avatarURL({
								dynamic: true
							})
						},
						timestamp: new Date(),
						footer: {
							text: msg.member.roles.highest.name
						}
					})

				// Push ticket IDs to string
				let str = `User has **${ticketByUser.length}** tickets:\n`;
				ticketByUser.forEach(i => str += `> ${i._id}\n`);

				// Send message
				return msg.sendEmbed(str, {
					color: 'role',
					author: {
						name: user.user.tag,
						icon_url: user.user.avatarURL({
							dynamic: true
						})
					},
					timestamp: new Date(),
					footer: {
						text: msg.member.roles.highest.name
					}
				})
				// If a ticket was found using the ID
			} else {
				// Embed fields
				let fields = [{
						name: 'ID',
						value: ticketByID._id,
						inline: true
					},
					{
						name: 'User',
						value: ticketByID.user,
						inline: true
					},
					{
						name: 'Status',
						value: ticketByID.status ? 'open' : 'closed',
						inline: true
					},
					{
						name: 'Conversation Length',
						value: ticketByID.messageCount,
						inline: true
					},
					{
						name: 'First Message ID',
						value: ticketByID.firstMessage.length ? ticketByID.firstMessage : 'none',
						inline: true
					},
					{
						name: 'Last Message ID',
						value: ticketByID.lastMessage.length ? ticketByID.lastMessage : 'none',
						inline: true
					},
					{
						name: 'Ticket Created',
						value: ticketByID.date,
						inline: false
					}
				]

				// Send embed
				return msg.sendEmbed({
					color: 'role',
					author: {
						name: msg.guild.members.cache.get(ticketByID.user).user.tag,
						icon_url: msg.guild.members.cache.get(ticketByID.user).user.avatarURL({
							dynamic: true
						})
					},
					fields: fields,
					timestamp: new Date(),
					footer: {
						text: msg.guild.members.cache.get(ticketByID.user).roles.highest.name
					}
				})
			}
		} catch (e) {
			client.logger.error(e);
		}
	}
}

module.exports = new Info();
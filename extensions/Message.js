const Discord = require('discord.js');
const logger = require('../modules/Logger');
module.exports = Discord.Structures.extend('Message', Message => class extends Message {
	async sendEmbed(desc, options = {}, channel, msg) {
		return new Promise((resolve, reject) => {
			if (!desc)
				return logger.error(`Embed description can't be empty.`);
			options = {
				title: options.title || '',
				color: options.color,
				fields: options.fields || [],
				url: options.url || '',
				author: options.author || {},
				thumbnail: options.thumbnail || {},
				image: options.image || {},
				footer: options.footer || {},
				timestamp: options.timestamp || {}
			}

			channel = channel || this.channel;

			const customColors = {
				blue: 0x2394c4,
				red: 0xc61d1d,
				green: 0x80F31F,
				yellow: 0xFFCC00,
				orange: 0xFF8300,
				teal: 0x43b2d3,
				pink: 0xea7ed8,
				default: 0x42d270,
				bot: 0x6dfa5a,
				role: this.member ? this.member.roles.highest.hexColor : 0x60E6B8
			}

			options.color = customColors[options.color] == null ? options.color : customColors[options.color];
			try {
				if (typeof desc !== 'string') {
					options = desc;
					channel.send({embeds: [{
							title: options.title,
							color: options.color,
							fields: options.fields,
							url: options.url,
							author: options.author,
							thumbnail: options.thumbnail,
							image: options.image,
							footer: options.footer,
							timestamp: options.timestamp
						}
					]}).catch(e => logger.error(e));
				} else {
					channel.send({embeds: [{
						title: options.title,
						description: desc,
						color: options.color,
						fields: options.fields,
						url: options.url,
						author: options.author,
						thumbnail: options.thumbnail,
						image: options.image,
						footer: options.footer,
						timestamp: options.timestamp
					}]

					}).catch(e => logger.error(e));
				}
			} catch (e) {
				logger.error(e);
			}
		})
	}
})
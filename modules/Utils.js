const ms = require('ms');
const fetch = require('node-fetch')

class Utils {
  static splitString(data, num) {
    let arr = [];
    for (var i = 0; i < data.length; i += num) {
      arr.push(data.substr(i, num));
    }
    return arr;
  }

  static removeItems(arr, amount) {
    for ( var i = 0; i < amount; i++ ) {
      arr.shift();
    }
  }

  // Convert string (5s, 10m, 2h, 5d)
  static convertStringToMS(str) {
    return ms(str);
  }

  // Convert ms to string (1 day, 2 hours, etc)
  static convertMStoString(MS) {
    return ms(parseInt(MS), { long: true });
  }

  // Create ticket, ticket channel, send embeds
  static async handleTicket(msg, client, user) {
    // Fetch ticket from database
    let ticket = await client.tickets.findOne({
      where: {
        user: user.id,
        status: true
      }
    });

    // Fetch all previous tickets
    let previousTickets = await client.tickets.findAll({
      where: {
        user: user.id,
        status: false
      }
    })

    // If a ticket already exists, return
    if (ticket)
      return;

    // Create the channel
    client.guilds.cache.get(config.discord.guild).channels.create(`${user.username}-${user.discriminator}`, {
        permissionOverwrites: [{
          id: client.guilds.cache.get(config.discord.guild).id,
          deny: ['VIEW_CHANNEL']
        }]
      })
      .then(async (c) => {
        // Set the channel topic
        c.setTopic(`TicketID: ${c.id} | User: ${user.tag} (${user.id})`);

        // Create channel parent
        let category = client.guilds.cache.get(config.discord.guild).channels.cache.filter(c => c.type === 'category' && c.name.toLowerCase() === 'pebblo support').map(c => c.id)[0];

        // If category doesn't exist, create one
        if (category == null)
          await client.guilds.cache.get(config.discord.guild).channels.create('Pebblo Support', {
            type: 'category',
            permissionOverwrites: [{
              id: client.guilds.cache.get(config.discord.guild).id,
              deny: ['VIEW_CHANNEL']
            },
            {
              id: '641487039044386836', // Support
              allow: ['VIEW_CHANNEL']
            },
            {
              id: '665123313592565770', // Developers
              allow: ['VIEW_CHANNEL']
            }]
          }).then(async (cat) => {
            // Set parent
            await c.setParent(cat.id).then(async newChannel => {
                // Bind permissions of the channel to the ones of the parent
                await newChannel.lockPermissions().catch(e => client.logger.error(e));
            });
          }).catch(e => client.logger.error(e));
        else {
          // Set Parent
          await c.setParent(category).then(async newChannel => {
              // Bind permissions of the channel to the ones of the parent
              await newChannel.lockPermissions().catch(e => client.logger.error(e));
          });
          
        }

        // Notify the user that a ticket has been made
        msg.sendEmbed(`> A ticket has been made${msg.channel.type === 'text' ? ` by <@${msg.author.id}>` : ''}. From now on any message you send will be forwarded to a staff member.`, {
          title: 'Support',
          color: 'green'
        }, user)

        let roles = '';
        let servers = '';

        // Push roles and guilds to strings
        client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.cache.filter(r => r.id !== client.guilds.cache.get(config.discord.guild).id).map(r => roles += `<@&${r.id}> `);
        client.guilds.cache.filter(g => g.members.cache.filter(m => m.id === user.id).map(m => m).length).map(g => servers += `${g.name}, `);

        // Fields for embed
        let fields = [{
            name: `Roles`,
            value: roles,
            inline: true
          },
          {
            name: `Mutual Server(s)`,
            value: servers.substring(0, servers.length - 2),
            inline: true
          }
        ];

        // Get dates
        const createdDate = this.timestampToString(user.createdTimestamp);
        const joinedDate = this.timestampToString(client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).joinedTimestamp);

        // Send User info embed
        msg.sendEmbed(`> <@${user.id}> was created ${createdDate} ago, joined ${joinedDate} ago with **${previousTickets.length}** past tickets.`, {
          author: {
            name: user.tag,
            icon_url: user.avatarURL({
              dynamic: true
            })
          },
          color: 'blue',
          fields: fields,
          footer: {
            text: `User ID: ${user.id}`
          },
          timestamp: new Date()
        }, c)

        // Send ticket created embed
        msg.sendEmbed(`> Ticket created for <@${user.id}>${msg.channel.type === 'text' ? ` by <@${msg.author.id}>` : ''}.`, {
          title: 'Ticket Created',
          color: 'blue'
        }, c);

        // Create a ticket in the database
        await client.tickets.create({
          _id: c.id,
          user: user.id,
          channelDM: msg.channel.type === 'dm' ? msg.channel.id : '',
          messageCount: 1,
          date: new Date(),
          status: true,
          firstMessage: msg.channel.type === 'dm' ? msg.id : ''
        })
      })
  }

  // Handle all private messages for a ticket
  static async handleMessage(msg, client) {
    // Fetch ticket from database
    let ticket = await client.tickets.findOne({
      where: {
        user: msg.author.id,
        status: true
      }
    })

    // If no ticket exists, create one (in handleTicket())
    if (!ticket)
      return client.logger.info(`Created ticket for ${msg.author.tag} (${msg.author.id})`);

    // The ticket channel
    let channel = client.channels.cache.get(ticket._id);

    // Check if channel exists
    if (channel == null) {
      // If no channel exists, create a new one
      client.guilds.cache.get(config.discord.guild).channels.create(`${msg.author.username}-${msg.author.discriminator}`)
        .then(async (c) => {
          // Set the channel topic
          c.setTopic(`TicketID: ${c.id} | User: ${msg.author.tag} (${msg.author.id})`);
          // Create channel parent
          let category = client.guilds.cache.get(config.discord.guild).channels.cache.filter(c => c.type === 'category' && c.name.toLowerCase() === 'pebblo support').map(c => c.id)[0];
          // If category doesn't exist, create one
          if (category == null)
            await client.guilds.cache.get(config.discord.guild).channels.create('Pebblo Support', {
              type: 'category'
            }).then(async (cat) => {
              // Set parent
              await c.setParent(cat.id)
              // Bind permissions of the channel to the ones of the parent
              await c.lockPermissions().catch(e => client.logger.error(e));
            }).catch(e => client.logger.error(e));
          else {
            // Set parent
            await c.setParent(category);
            // Bind permissions of the channel to the ones of the parent
            await c.lockPermissions().catch(e => client.logger.error(e));
          }


          // Update channel ID in the database
          await client.tickets.update({
            _id: c.id,
          }, {
            where: {
              user: msg.author.id,
              status: true
            }
          })
        })
      return client.logger.info(`Created a ticket channel because no channel was found for ${msg.author.tag} (${msg.author.id})`)
    }

    // Update message count
    await this.updateMessageCount(msg.author, client)

    // Get the member
    let member = client.guilds.cache.get(config.discord.guild).members.cache.get(msg.author.id);

    // If member is undefined, return
    if (member == null)
      return client.logger.error(`Member is undefined`);

    // If channelDM and firstMessage are empty, update them
    if (!ticket.channelDM.length) {
      await client.tickets.update({
        channelDM: msg.channel.id,
        firstMessage: msg.id
      }, {
        where: {
          user: msg.author.id,
          status: true
        }
      })
    }

    // Send the message to the channel
    msg.sendEmbed(msg.attachments.size ? `${msg.content}\n[${msg.attachments.map(a => a.name)[0]}](${msg.attachments.map(a => a.attachment)[0]})` : `> ${msg.content}`, {
      author: {
        name: msg.author.tag,
        icon_url: msg.author.avatarURL({
          dynamic: true
        })
      },
      color: 'teal',
      footer: {
        text: member.roles.highest.name
      },
      image: {
        url: msg.attachments.size ? msg.attachments.map(a => a.attachment)[0] : (/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|gifv)/g.test(msg.content) ? msg.content.split(' ').filter(i => i.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|gifv)/g))[0] : '')
      },
      timestamp: new Date()
    }, channel)

    // React to the message
    msg.react('✅');
  }

  // Update conversation length
  static async updateMessageCount(user, client) {
    // Fetch ticket
    let ticket = await client.tickets.findOne({
      where: {
        user: user.id,
        status: true
      }
    })

    // If user is undefined, return
    if (user == null)
      return client.logger.error(`User is undefined.`);

    // If no ticket was found, return
    if (!ticket)
      return client.logger.error(`updateMessageCount() failed. No ticket found for ${user.tag} (${user.id}).`);

    // Update message count
    await client.tickets.update({
      messageCount: parseInt(ticket.messageCount) + 1
    }, {
      where: {
        user: user.id,
        status: true
      }
    })
  }

  // Convert timestamp to string
  static timestampToString(timestamp) {
    if (timestamp == null)
      return null;

    let date = Math.round(new Date().getTime());
    var delta = Math.abs(date - timestamp) / 1000;
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;
    var seconds = Math.round(delta % 60);
    // let str = `${days} days, ${hours} hours, ${minutes} min ago`;
    // Only want to return days for now
    let str = `${days} days`
    return str;
  }

  // Fetch guild member by username/id/mention
  static async fetchMember(msg, client, user) {
    return new Promise(async (resolve, reject) => {
      // Check if a user was mentioned. If yes, return member
      if (msg.mentions.users.first())
        return resolve(msg.guild.members.cache.get(msg.mentions.users.first().id));

      // Check if ID was given. If yes, return member
      if (/^\d+$/.test(user)) {
        if (msg.guild.members.cache.get(user) == null)
          return msg.sendEmbed(`> No user with the ID \`${user}\` found.`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            }
          });
        return resolve(msg.guild.members.cache.get(user));
      }

      // Find by username
      let emojis = [':one:', ':two:', ':three:', ':four:', ':five:'];
      // Filter out bots, get all members with { user } in their username
      let users = msg.guild.members.cache.filter(m => m.user.username.toLowerCase().includes(user.toLowerCase()) && !m.user.bot).map(m => m).splice(0, 5);
      // If one result is returned, resolve
      if (users.length === 1)
        return resolve(users[0]);
      // If no result is returned, return
      else if (!users.length)
        return msg.sendEmbed(`No users found.`, {
          color: 'red',
          author: {
            name: msg.author.tag,
            icon_url: msg.author.avatarURL({
              dynamic: true
            })
          }
        })

      // Push all options to string
      let str = '';
      users.forEach(m => str += `${emojis[users.indexOf(m)]} ${m.user.tag}\n`);

      // Send message
      msg.sendEmbed(`Choose one of the following or **cancel**:\n${str}`, {
        color: 'role',
        author: {
          name: msg.author.tag,
          icon_url: msg.author.avatarURL({
            dynamic: true
          })
        }
      })

      // Create message collector
      const filter = m => m.author.id === msg.author.id;
      const collector = msg.channel.createMessageCollector(filter, {
        time: 15000
      });

      // Once a message is sent, handle
      collector.on('collect', m => {
        let answers = ['1', '2', '3', '4', '5', 'cancel'];

        // If message doesn't include one of the options, return
        if (!answers.includes(m.content.toLowerCase())) {
          msg.sendEmbed(`> Invalid option. Canceled query.`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            }
          })
          return collector.stop();
        } else

          // If option is cancel, stop the collector
          if (m.content.toLowerCase() === 'cancel') {
            msg.sendEmbed(`> Canceled query.`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              }
            })
            return collector.stop();
          }
        // Stop the collector
        collector.stop();
      })

      // Once collector is stopped
      collector.on('end', (collected, reason) => {
        // If time ran out, return timeout
        if (reason === 'time')
          return msg.sendEmbed(`> Timeout. Execute command again.`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            }
          })

        // Get chosen number
        let id = collected.map(i => i)[0];
        if (id == null)
          return;
        // Return member
        return resolve(users[parseInt(id) - 1]);
      })
    })
  }

  // Find member or role
  static async fetchMemberOrRole(msg, query) {
    return new Promise(async (resolve, reject) => {
      // If user was mentioned, return member
      if (msg.mentions.users.first())
        return resolve(msg.guild.members.cache.get(msg.mentions.users.first().id));

      // If role was mentioned, return role
      if (msg.mentions.roles.first())
        return resolve(msg.guild.roles.cache.get(msg.mentions.roles.first().id));

      // If query is a number, check if it's a valid role or user ID
      if (/^\d+$/.test(query)) {
        // Check if a user is found
        if (msg.guild.members.cache.get(query) == null) {
          // If no role is found either, return
          if (msg.guild.roles.cache.get(query) == null)
            return msg.sendEmbed(`> No user or role with the ID \`${query}\` found.`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              }
            });
          // If a role was found, resolve the role
          return resolve(msg.guild.roles.cache.get(query));
        } else {
          // If a user was found, resolve the member
          return resolve(msg.guild.members.cache.get(query));
        }
      }

      // Find role or member by name
      // Search for roles first
      let emojis = [':one:', ':two:', ':three:', ':four:', ':five:'];
      // Filter roles (remove @everyone), splice so that 5 options are left
      let results = msg.guild.roles.cache.filter(r => r.id !== msg.guild.id && r.name.toLowerCase().includes(query.toLowerCase())).map(r => r).splice(0, 5);
      // If no roles exist, look for users
      if (!results.length)
        results = msg.guild.members.cache.filter(m => m.user.username.toLowerCase().includes(query.toLowerCase()) && !m.user.bot).map(m => m).splice(0, 5);
      // If there are still no results, return
      if (!results.length)
        return msg.sendEmbed(`> No roles or users found.`, {
          color: 'red',
          author: {
            name: msg.author.tag,
            icon_url: msg.author.avatarURL({
              dynamic: true
            })
          }
        })

      if (results.length === 1)
        return resolve(results[0])

      // Push all options to string
      let str = '';
      results.forEach(i => str += `${emojis[results.indexOf(i)]} ${i.user ? i.user.tag : i.name}\n`);

      // Send message
      msg.sendEmbed(`Choose one of the following or **cancel**:\n${str}`, {
        color: 'role',
        author: {
          name: msg.author.tag,
          icon_url: msg.author.avatarURL({
            dynamic: true
          })
        }
      })

      // Create message collector
      const filter = m => m.author.id === msg.author.id;
      const collector = msg.channel.createMessageCollector(filter, {
        time: 15000
      });

      // Once a message is sent, handle
      collector.on('collect', m => {
        let answers = ['1', '2', '3', '4', '5', 'cancel'];

        // If message doesn't include one of the options, return
        if (!answers.includes(m.content.toLowerCase())) {
          msg.sendEmbed(`> Invalid option. Canceled query.`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            }
          })
          return collector.stop();
        } else

          // If option is cancel, stop the collector
          if (m.content.toLowerCase() === 'cancel') {
            msg.sendEmbed(`> Canceled query.`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              }
            })
            return collector.stop();
          }
        // Stop the collector
        collector.stop();
      })

      // Once collector is stopped
      collector.on('end', (collected, reason) => {
        // If time ran out, return timeout
        if (reason === 'time')
          return msg.sendEmbed(`> Timeout. Execute command again.`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            }
          })

        // Get chosen number
        let id = collected.map(i => i)[0];
        if (id == null)
          return;
        // Return member
        return resolve(results[parseInt(id) - 1]);
      })
    })
  }

  // Generate help embed
  static async generateHelp(msg, client) {
    // List the commands
    let helpString = '';
    client.commands.filter(c => this.getPermissionLevel(msg.author, client).includes(c.conf.permissionLevel) && !c.conf.disabled).map(c => {
      helpString += `> [${c.conf.permissionLevel}] ${config.discord.prefix}${c.help.name} - ${c.help.description}\n\n`
    })

    // Sort the order
    helpString = helpString.split('\n\n').sort().reverse().join('\n\n');

    // Split string every 6th \n\n
    let arr = helpString.match(/(?=[\s\S])(?:.*\n\n?){1,6}/g)

    // Generate embed function
    const generateEmbed = page => {
      const embed = new Discord.MessageEmbed()
        .setAuthor(msg.author.tag, msg.author.avatarURL({
          dynamic: true
        }))
        .setTimestamp()
        .addField(`Page ${page+1}`, `${arr[page]}`) // \`\`\`
        .setFooter(this.getPermissionName(msg.author))
      return embed
    }

    // Save the author
    const author = msg.author;

    // Send the embed, then handle reactions
    msg.channel.send(generateEmbed(0)).then(message => {
      if (arr.length <= 1) return;
      message.react('➡️')
      message.react('🛑')
      const collector = message.createReactionCollector(
        (reaction, user) => ['⬅️', '➡️', '🛑'].includes(reaction.emoji.name) && user.id === author.id,
      )

      let currentIndex = 0
      collector.on('collect', reaction => {
        console.log("hi")
        message.reactions.removeAll().then(async () => {
          if (reaction.emoji.name === '⬅️')
            currentIndex -= 1;
          else if (reaction.emoji.name === '➡️')
            currentIndex += 1;
          else if (reaction.emoji.name === '🛑')
            return message.delete();
          message.edit(generateEmbed(currentIndex))
          if (currentIndex !== 0) await message.react('⬅️')
          if (currentIndex + 1 < arr.length) message.react('➡️')
          message.react('🛑')
        })
      })
    })
  }

  // Return user's permission levels
  static getPermissionLevel(user, client) {
    if (config.discord.admins.includes(user.id))
      return [client.permissionLevels.SUPREME, client.permissionLevels.ADMIN, client.permissionLevels.DEFAULT];

    if (config.discord.staff.includes(user.id))
      return [client.permissionLevels.ADMIN, client.permissionLevels.DEFAULT];

    return [client.permissionLevels.DEFAULT];
  }

  // Get name of user's permission level
  static getPermissionName(user) {
    return config.discord.admins.includes(user.id) ? 'ADMIN' : (config.discord.staff.includes(user.id) ? 'STAFF' : 'DEFAULT');
  }

  static async checkPermission(user, client, cmd) {
    // Get server from database
    const pebblo = await client.pebblo.findOne({
      where: {
        _id: config.discord.guild
      }
    })

    // Default is false
    let bool = false;

    // If server isn't in the database, return
    if (!pebblo)
      return client.logger.error(`Guild ${config.discord.guild} wasn't found in the database`);

    // Filter user/role permissions
    let permissions = pebblo.permissions.filter(i => JSON.parse(i).id === user.id);

    // If the user doesn't have perms, check all the roles
    if (!permissions.length) {
      bool = false;
      // Map the user's roles in the main server
      client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.cache.map(r => {
        // Overwrite permissions
        permissions = pebblo.permissions.filter(i => JSON.parse(i).id === r.id);
        // If the role has permissions
        if (permissions.length) {
          // Check if the command name is in the array. If yes, set bool to true
          if (JSON.parse(permissions[0]).commands.includes(cmd.help.name))
            bool = true
        }
      })
      // If user has permissions
    } else {
      // Check if command name is in the array. If yes, set bool to true
      if (JSON.parse(permissions[0]).commands.includes(cmd.help.name))
        bool = true;
    }

    // Return bool
    return bool;
  }

  // Create moderation cases
  static async createCase(msg, client, user, action, args, duration, channel) {
    // Get all previous moderation cases
    const cases = await client.cases.findAll();

    // console.log(user)
    // Members are usually given as parameters
    // user = user == null ? user : user.user;
    // user = (user == null ? user : user.user);
    user = user == null || user == null ? user : user.user;

    action.toLowerCase() === 'mute' ? (duration == null ? duration = 'permanently' : `for ${duration}`) : null;

    // Get pebblo settings
    const pebblo = await client.pebblo.findOne({
      where: {
        _id: config.discord.guild
      }
    });

    if (!pebblo)
      return client.logger.error(`Can't find server ${config.discord.guild}`);

    // New case number
    const currentCase = cases.length + 1;

    // Create new case in database
    await client.cases.create({
      _id: currentCase.toString(),
      moderator: msg.author.id,
      user: action.toLowerCase() === 'purge' || action.toLowerCase() === 'nuke' ? '' : user.id,
      action: action,
      reason: args ? args : '',
      date: new Date()
    })

    // If mod logging is off, return
    if (!pebblo.modLogging)
      return;

    // Get moderation channel
    const modChannel = client.channels.cache.get(pebblo.modChannel);

    // If channel doesn't exist, return
    if (modChannel == null)
      return client.logger.error(`Can't find moderation channel ${pebblo.modChannel}`);

    // Actions
    const actions = {
      ban: {
        color: 0xc61d1d,
        action: 'banned'
      },
      unban: {
        color: 0x80F31F,
        action: 'unbanned'
      },
      kick: {
        color: 0xFF8300,
        action: 'kicked'
      },
      mute: {
        color: 0xFFCC00,
        action: 'muted'
      },
      unmute: {
        color: 0x80F31F,
        action: 'unmuted'
      },
      purge: {
        color: 0x43b2d3,
        action: 'purged'
      },
      nuke: {
        color: 0xFF8300,
        action: 'nuked'
      }
    }

    // Send embed
    msg.sendEmbed(`> ${action.toLowerCase() === 'purge' ? `${args} message(s) have been **purged** by <@${msg.author.id}> in <#${msg.channel.id}>` : (action.toLowerCase() === 'mute' ? `<@${user.id}> has been **${actions[action].action}** for ${duration} by <@${msg.author.id}>` : (action.toLowerCase() === 'nuke' ? `**${channel.name}** has been **nuked** by <@${msg.author.id}>` : `<@${user.id}> has been **${actions[action].action}** by <@${msg.author.id}>`))}`, {
      color: actions[action].color,
      author: {
        name: action.toLowerCase() === 'purge' || action.toLowerCase() === 'nuke' ? msg.author.tag : user.tag,
        icon_url: action.toLowerCase() === 'purge' || action.toLowerCase() === 'nuke' ? msg.author.avatarURL({
          dynamic: true
        }) : user.avatarURL({
          dynamic: true
        })
      },
      fields: action.toLowerCase() === 'purge' ? [] : [{
        name: 'Reason',
        value: args ? args : 'none'
      }],
      footer: {
        text: `Case ${currentCase}: ${action}`
      },
      timestamp: new Date()
    }, modChannel)

    // React to message
    msg.react('✅');
  }

  static async findBans(msg, query) {
    return new Promise((resolve, reject) => {
      // Fetch bans
      msg.guild.fetchBans()
        .then(async (bans) => {
          // If ID was given
          if (/^\d+$/.test(query)) {
            // If no banned member with the ID is found, return
            if (!bans.filter(b => b.user.id === query).map(b => b).length)
              return msg.sendEmbed(`> No banned user with the ID \`${query}\` found.`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                }
              });
            // Resolve banned user
            return resolve(bans.filter(b => b.user.id === query).map(b => b)[0]);
          }

          // Emojis
          let emojis = [':one:', ':two:', ':three:', ':four:', ':five:'];
          // Filter bans by username
          const results = bans.filter(b => b.user.username.toLowerCase().includes(query.toLowerCase())).map(b => b);

          // If no results were found, return
          if (!results.length)
            return msg.sendEmbed(`> No banned user with the username \`${query.toLowerCase()}\` found.`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              }
            });

          // If one result was found, return
          if (results.length === 1)
            return resolve(results[0]);

          // Push all options to string
          let str = '';
          results.forEach(i => str += `${emojis[results.indexOf(i)]} ${i.user.tag}\n`);

          // Send message
          msg.sendEmbed(`Choose one of the following or **cancel**:\n${str}`, {
            color: 'role',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            }
          })

          // Create message collector
          const filter = m => m.author.id === msg.author.id;
          const collector = msg.channel.createMessageCollector(filter, {
            time: 15000
          });

          // Once a message is sent, handle
          collector.on('collect', m => {
            let answers = ['1', '2', '3', '4', '5', 'cancel'];

            // If message doesn't include one of the options, return
            if (!answers.includes(m.content.toLowerCase())) {
              msg.sendEmbed(`> Invalid option. Canceled query.`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                }
              })
              return collector.stop();
            } else

              // If option is cancel, stop the collector
              if (m.content.toLowerCase() === 'cancel') {
                msg.sendEmbed(`> Canceled query.`, {
                  color: 'red',
                  author: {
                    name: msg.author.tag,
                    icon_url: msg.author.avatarURL({
                      dynamic: true
                    })
                  }
                })
                return collector.stop();
              }
            // Stop the collector
            collector.stop();
          })

          // Once collector is stopped
          collector.on('end', (collected, reason) => {
            // If time ran out, return timeout
            if (reason === 'time')
              return msg.sendEmbed(`> Timeout. Execute command again.`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                }
              })

            // Get chosen number
            let id = collected.map(i => i)[0];
            if (id == null)
              return;
            // Resolve ban
            return resolve(results[parseInt(id) - 1]);
          })
        })
    })
  }

  // Handle mutes
  static async handleMute(msg, client, user, duration) {
    // Fetch active mute if one exists
    const mute = await client.mutes.findOne({
      where: {
        _id: user.id,
        active: true
      }
    })

    // If mute exists, return
    if (mute)
      return msg.sendEmbed(`> <@${user.id}> is already muted.`, {
        color: 'red',
        author: {
          name: msg.author.tag,
          icon_url: msg.author.avatarURL({ dynamic: true })
        },
        footer: {
          text: 'Error'
        },
        timestamp: new Date()
      })

    const roles = [];

    // If user is a staff member, push role IDs to roles 
    if (this.getPermissionLevel(user, client).length > 1)
      msg.guild.members.cache.get(user.id).roles.cache.filter(r => r !== msg.guild.roles.everyone).map(r => r.id).forEach(id => roles.push(id));

    // Remove roles from member (will be added back once unmuted)
    roles.length ? msg.guild.members.cache.get(user.id).roles.remove(roles) : null;

    const finishedMute = await client.mutes.findOne({
      where: {
        _id: user.id,
        active: false
      }
    })

    // Create mute in database if user wasn't muted before
    if (!finishedMute)
      await client.mutes.create({
        _id: user.id,
        active: true,
        roles: roles,
        duration: duration,
        unmuteDate: new Date(new Date().setTime(new Date().getTime() + duration)),
        date: new Date()
      })
      .catch(e => client.logger.error(e))
    else
      await client.mutes.update({
        active: true,
        roles: roles,
        duration: duration,
        unmuteDate: new Date(new Date().setTime(new Date().getTime() + duration)),
        date: new Date()
      }, {
        where: {
          _id: user.id,
          active: false
        }
      })

    // Get Muted roles
    let muteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'muted').map(r => r)[0];
    let staffMuteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'staff muted').map(r => r)[0];

    // If user is a staff member, add staff muted role, else add normal muted role
    if (roles.length)
      await msg.guild.members.cache.get(user.id).roles.add(staffMuteRole.id)
    else
      await msg.guild.members.cache.get(user.id).roles.add(muteRole.id)

    // Handle unmute
    await this.handleUnmute(msg, client, user, false);
  }

  // Handle unmute
  static async handleUnmute(msg, client, user, force) {
    // Fetch mute from database
    const mute = await client.mutes.findOne({
      where: {
        _id: user.id,
        active: true
      }
    })

    // If user isn't muted, return
    if (!mute)
      return client.logger.error('User isn\'t muted.');

    // If force is set to true
    if (force === true) {
        // Get Muted roles
        let muteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'muted').map(r => r)[0];
        let staffMuteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'staff muted').map(r => r)[0];
  
        // Add previous roles back
        await msg.guild.members.cache.get(user.id).roles.add(mute.roles)
  
        // Remove muted role
        if (mute.roles.length)
          await msg.guild.members.cache.get(user.id).roles.remove(staffMuteRole.id)
        else
          await msg.guild.members.cache.get(user.id).roles.remove(muteRole.id)
  
        // Update status to false in database
        await client.mutes.update({
          active: false
        }, {
          where: {
            _id: user.id,
            active: true
          }
        })
    } else {
       // Set timeout
    setTimeout(async () => {
      // Get Muted roles
      let muteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'muted').map(r => r)[0];
      let staffMuteRole = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === 'staff muted').map(r => r)[0];

      // Add previous roles back
      await msg.guild.members.cache.get(user.id).roles.add(mute.roles)

      // Remove muted role
      if (mute.roles.length)
        await msg.guild.members.cache.get(user.id).roles.remove(staffMuteRole.id)
      else
        await msg.guild.members.cache.get(user.id).roles.remove(muteRole.id)

      // Update status to false in database
      await client.mutes.update({
        active: false
      }, {
        where: {
          _id: user.id,
          active: true
        }
      })
    }, mute.duration)
    }
  }

  static async handleUnmuteOnReady(client, user) {
    // Fetch mute from database
    const mute = await client.mutes.findOne({
      where: {
        _id: user.id,
        active: true
      }
    })

    user = user.user ? user.user : user;

    if (!mute)
      return;

    const timeDifference = mute.unmuteDate - new Date();

    // If time difference between unmuteDate and muteDate is smaller than or equal to 0, unmute
    if (timeDifference <= 0) {
        // Get Muted roles
        let muteRole = client.guilds.cache.get(config.discord.guild).roles.cache.filter(r => r.name.toLowerCase() === 'muted').map(r => r)[0];
        let staffMuteRole = client.guilds.cache.get(config.discord.guild).roles.cache.filter(r => r.name.toLowerCase() === 'staff muted').map(r => r)[0];

        // Add previous roles back
        await client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.add(mute.roles)

        // Remove muted role
        if (mute.roles.length)
          await client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.remove(staffMuteRole.id)
        else
          await client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.remove(muteRole.id)

        // Update status to false in database
        await client.mutes.update({
          active: false
        }, {
          where: {
            _id: user.id,
            active: true
          }
        })
    // If user is still muted
    } else {
      setTimeout(async () => {
          // Get Muted roles
          let muteRole = client.guilds.cache.get(config.discord.guild).roles.cache.filter(r => r.name.toLowerCase() === 'muted').map(r => r)[0];
          let staffMuteRole = client.guilds.cache.get(config.discord.guild).roles.cache.filter(r => r.name.toLowerCase() === 'staff muted').map(r => r)[0];
  
          // Add previous roles back
          await client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.add(mute.roles)
  
          // Remove muted role
          if (mute.roles.length)
            await client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.remove(staffMuteRole.id)
          else
            await client.guilds.cache.get(config.discord.guild).members.cache.get(user.id).roles.remove(muteRole.id)
  
          // Update status to false in database
          await client.mutes.update({
            active: false
          }, {
            where: {
              _id: user.id,
              active: true
            }
          })
      }, timeDifference)
    }
  }

  // Collect/Await messages
  static async collectMessages(msg, amount, timeout) {
    return new Promise(async(resolve, reject) => {
      // Message queue
      let queue = [];
      
      // Discord message collector
      let collector;
      if (!timeout)
        collector = new Discord.MessageCollector(msg.channel, m => m.author.id === msg.author.id);
      else
        collector = new Discord.MessageCollector(msg.channel, m => m.author.id === msg.author.id, {
          time: timeout
        });

        // Once message is sent
        collector.on('collect', c => {
          // Push message to queue
          queue.push(c);
          
          // If queue length is equal to amount, stop
          if (queue.length === amount)
            collector.stop();
        })

        // Once collector has stopped
        collector.on('end', async(collected, reason) => {
          // If reason is time, send timeout message
          if (reason === 'time')
            msg.sendEmbed(`> Timeout. Execute command again.`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              }
            })

          // Map collected messages
          let messages = collected.map(c => c.content);
          
          // Resolve messages
          return resolve(messages);
        })
    })
  }

  // Fetch songs
  static async getSongs(client, query) {
    return new Promise(async (resolve, reject) => {
      // Youtube search module
      const { YouTube } = require('youtube-sr');

      // Fetch results
      YouTube.searchOne(query)
      .then(res => {
        return resolve(res);
      })
      .catch(err => client.logger.error(err));
    })
  }

  // Song handler
  static async handlePlay(msg, client, song) {
    // Push song to queueConstruct
    client.queueConstruct.songs.push(song);

    // ytdl-core
    const ytdl = require('discord-ytdl-core');

    // Play song
    let stream = ytdl(song.url, {
      filter: 'audioonly',
      opusEncoded: true,
      encoderArgs: encoderArgstoset,
      bitrate: 320,
      seek: seekTime,
      quality: "highestaudio",
      liveBuffer: 40000,
      highWaterMark: 1 << 25,
    })
  }
}

module.exports = Utils;
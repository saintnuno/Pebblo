class Permissions {
    constructor() {
      this.help = {
        name: 'permissions',
        usage: 'permissions [add|remove|get] [role|user] [command?]',
        description: 'Handle permissions.',
      };
      this.conf = {
        aliases: ['perms'],
        adminOnly: true
      };
    }
  
    async run(client, msg, args) {
      // Fetch server from the database
      const pebblo = await client.pebblo.findOne({
        where: {
          _id: config.discord.guild
        }
      })
  
      // If it doesn't exist, return error
      if (!pebblo)
        return client.logger.error(`Guild ${config.discord.guild} wasn't found in the database`);
  
      const method = args[0];
      const name = args[1];
  
      // If no method (<add|remove|get>) is given, return
      if (!method)
        return msg.sendEmbed(`> Missing Method <get|add|remove>`, {
          color: 'red',
          author: {
            name: msg.author.tag,
            icon_url: msg.author.avatarURL({
              dynamic: true
            })
          },
          footer: {
            text: 'Missing argument'
          },
          timestamp: new Date()
        });
  
      const commandName = args[2];
  
      /*
          Format of permission object:
          {
              id: <userID>,
              commands: [<commands>]
          }
      */
  
      // Get permissions
      if (method.toLowerCase() === 'get') {
        // If name isn't given, return
        if (!name)
          return msg.sendEmbed(`> Missing role/member name`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            },
            footer: {
              text: 'Missing argument'
            },
            timestamp: new Date()
          });
  
        // Find role or member
        const target = await client.utils.fetchMemberOrRole(msg, name);
  
        // Filter user/role permissions
        const permissions = pebblo.permissions.filter(i => JSON.parse(i).id === target.id);
  
        // Parse JSON
        permissions.forEach(p => {
          permissions[permissions.indexOf(p)] = JSON.parse(p);
        })
  
        // If the user/role doesn't have any assigned permissions, return default perms
        if (!permissions.length || !permissions[0].commands.length)
          return msg.sendEmbed(msg.guild.members.cache.get(target.id) ? `> Permission level **${client.utils.getPermissionName(target)}**` : `> Role **${target.name}** (${target.id}) has no permissions.`, {
            color: 'role',
            author: {
              name: target.user ? target.user.tag : target.name,
              icon_url: target.user ? target.user.avatarURL({
                dynamic: true
              }) : ''
            },
            fields: [
              msg.guild.members.cache.get(target.id) ? {
                name: 'Commands',
                value: `${client.commands.filter(c => client.utils.getPermissionLevel(target, client).includes(c.conf.permissionLevel)).map(c => `[${c.conf.permissionLevel}] ${c.help.name}`).sort().reverse().join('\n')}`
              } : []
            ],
            footer: {
              text: 'No assigned commands'
            },
            timestamp: new Date()
          })
  
        let permissionString = '';
        // If target is a member, push all default commands to the string
        msg.guild.members.cache.get(target.id) ? `${permissionString += client.commands.filter(c => client.utils.getPermissionLevel(target, client).includes(c.conf.permissionLevel)).map(c => `[${c.conf.permissionLevel}] ${c.help.name}`).sort().reverse().join('\n')}\n` : '';
  
        // Push all "special" commands to the string
        permissions.forEach(p => {
          p.commands.forEach(c => {
            // Get command
            const cmd = client.commands.get(c);
  
            // If command doesn't exist, return error
            if (!cmd)
              return client.logger.error(`Command ${c} wasn't found`);
  
            // Add commands to string
            permissionString += `\n**[${cmd.conf.permissionLevel}] ${cmd.help.name}**`;
          })
        })
  
        // Split string into array
        permissionString = permissionString.split('\n');
  
        // Sort array and ignore the stars
        permissionString.sort(function(a, b) {
          function getRaw(s) {
            return s.replace(/[^*]*?/gm, '').trim();
          }
  
          return getRaw(a).localeCompare(getRaw(b));
        });
  
        // Return to string
        permissionString = permissionString.reverse().join('\n');
  
        // Send embed
        return msg.sendEmbed(`> ${msg.guild.members.cache.get(target.id) ? `Permission level **${client.utils.getPermissionName(target)}**` : `Role **${target.name}** (${target.id})`}`, {
          color: 'role',
          author: {
            name: target.user ? target.user.tag : target.name,
            icon_url: target.user ? target.user.avatarURL({
              dynamic: true
            }) : ''
          },
          fields: [{
            name: 'Commands',
            value: permissionString
          }],
          footer: {
            text: 'Assigned commands are bold'
          },
          timestamp: new Date()
        })
      } else
        // Add permissions
        if (method.toLowerCase() === 'add') {
          // If name isn't given, return
          if (!name)
            return msg.sendEmbed(`> Missing role/member name`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              },
              footer: {
                text: 'Missing argument'
              },
              timestamp: new Date()
            });
  
          // If command isn't given, return
          if (!commandName)
            return msg.sendEmbed(`> Missing command name`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              },
              footer: {
                text: 'Missing argument'
              },
              timestamp: new Date()
            });
  
          // Get command
          const cmd = client.commands.get(commandName) || client.commands.find(c => c.conf.aliases && c.conf.aliases.includes(commandName));
  
          // If cmd doesn't exist, return
          if (!cmd)
            return msg.sendEmbed(`> Command **${commandName}** doesn't exist`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              },
              footer: {
                text: 'Error'
              },
              timestamp: new Date()
            });
  
          // Find role or member
          const target = await client.utils.fetchMemberOrRole(msg, name);
  
          // Filter user/role permissions
          let permissions = pebblo.permissions.filter(i => JSON.parse(i).id === target.id);
  
          // Full array
          let finalPermissions = pebblo.permissions;
  
          // Parse JSON
          permissions.forEach(p => {
            permissions[permissions.indexOf(p)] = JSON.parse(p);
          })
  
          // Get the user's previous permissions
          let obj = permissions[0];
  
          // If user has no previous permissions, overwrite obj
          if (!permissions.length)
            obj = {
              id: target.id,
              commands: []
            }
  
          // If user already has permission to use the command, return
          if (obj.commands.includes(cmd.help.name) || client.utils.getPermissionLevel(target, client).includes(cmd.conf.permissionLevel))
            return msg.sendEmbed(`> ${msg.guild.members.cache.get(target.id) ? `<@${target.id}>` : `<@&${target.id}>`} already has permission to use this command.`, {
              color: 'red',
              author: {
                name: msg.author.tag,
                icon_url: msg.author.avatarURL({
                  dynamic: true
                })
              },
              footer: {
                text: 'Error'
              },
              timestamp: new Date()
            });
  
  
          // Index of the existing object, if one exists
          const index = finalPermissions.indexOf(JSON.stringify(permissions[0]))
  
          // Push command name to commands
          obj.commands.push(cmd.help.name)
  
          // If user already has permissions, replace object with obj. If not, push obj
          if (permissions.length)
            finalPermissions[index] = JSON.stringify(obj);
          else
            finalPermissions.push(JSON.stringify(obj));
  
          // Update permissions in the database
          await client.pebblo.update({
            permissions: finalPermissions
          }, {
            where: {
              _id: config.discord.guild
            }
          })
  
          // Send embed
          msg.sendEmbed(`> ${msg.guild.members.cache.get(target.id) ? `<@${target.id}>` : `<@&${target.id}>`} now has permission to use **${cmd.help.name}**`, {
            color: 'role',
            author: {
              name: target.user ? target.user.tag : target.name,
              icon_url: target.user ? target.user.avatarURL({
                dynamic: true
              }) : ''
            },
            footer: {
              text: 'Assigned permission'
            },
            timestamp: new Date()
          })
        } else
          // Remove permission
          if (method.toLowerCase() === 'remove') {
            if (!name)
              return msg.sendEmbed(`> Missing role/member name`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                },
                footer: {
                  text: 'Missing argument'
                },
                timestamp: new Date()
              });
  
            // If command isn't given, return
            if (!commandName)
              return msg.sendEmbed(`> Missing command name`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                },
                footer: {
                  text: 'Missing argument'
                },
                timestamp: new Date()
              });
  
            // Get command
            const cmd = client.commands.get(commandName) || client.commands.find(c => c.conf.aliases && c.conf.aliases.includes(commandName));
  
            // If cmd doesn't exist, return
            if (!cmd)
              return msg.sendEmbed(`> Command **${commandName}** doesn't exist`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                },
                footer: {
                  text: 'Error'
                },
                timestamp: new Date()
              });
  
            // Find role or member
            const target = await client.utils.fetchMemberOrRole(msg, name);
  
            // Filter user/role permissions
            let permissions = pebblo.permissions.filter(i => JSON.parse(i).id === target.id); 
  
            // Full array
            let finalPermissions = pebblo.permissions;
  
            // Parse JSON
            permissions.forEach(p => {
              permissions[permissions.indexOf(p)] = JSON.parse(p);
            })
  
            // Get the user's previous permissions
            let obj = permissions[0];
  
            // If user has no previous permissions, return
            if (!permissions.length)
              return msg.sendEmbed(`> ${msg.guild.members.cache.get(target.id) ? `<@${target.id}>` : `<@&${target.id}>`} has no assigned permissions.`, {
                color: 'red',
                author: {
                  name: msg.author.tag, 
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                },
                footer: {
                  text: 'Error'
                },
                timestamp: new Date()
              });
  
            // If commands don't include the executed command, return
            if (!obj.commands.includes(cmd.help.name))
              return msg.sendEmbed(`> ${msg.guild.members.cache.get(target.id) ? `<@${target.id}>` : `<@&${target.id}>`} ${client.utils.getPermissionLevel(target, client).includes(cmd.conf.permissionLevel) ? ' has permission to use this command due to their rank.' : ` doesn't have permission to use this command.`}`, {
                color: 'red',
                author: {
                  name: msg.author.tag,
                  icon_url: msg.author.avatarURL({
                    dynamic: true
                  })
                },
                footer: {
                  text: 'Error'
                },
                timestamp: new Date()
              });
  
            // Index of the existing object
            const index = finalPermissions.indexOf(JSON.stringify(permissions[0]))
  
            // Remove command from commands
            obj.commands.splice(obj.commands.indexOf(cmd.help.name), 1);
  
            // Replace element in the array with new element (stringified object)
            finalPermissions[index] = JSON.stringify(obj);
  
            // Update permissions in the database
            await client.pebblo.update({
              permissions: finalPermissions
            }, {
              where: {
                _id: config.discord.guild
              }
            })
  
            // Send embed
            msg.sendEmbed(`> ${msg.guild.members.cache.get(target.id) ? `<@${target.id}>` : `<@&${target.id}>`} no longer has permission to use **${cmd.help.name}**`, {
              color: 'role',
              author: {
                name: target.user ? target.user.tag : target.name,
                icon_url: target.user ? target.user.avatarURL({
                  dynamic: true
                }) : ''
              },
              footer: {
                text: 'Removed permission'
              },
              timestamp: new Date()
            })
          }
    }
  }
  
  module.exports = new Permissions();
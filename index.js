global.Discord = require('discord.js');
global.config = require('./config');
const Database = require('./structures/database/Database');
const { PlayerManager, Player } = require('discord.js-lavalink');
const fs = require('fs');

// Require and configure .env
require('dotenv').config();

// Load extensions
require('./extensions/Message');

class Client extends Discord.Client {
  constructor() {
    super();

    // Modules
    this.utils = require('./modules/Utils');
    this.logger = require('./modules/Logger');

    // Database
    this.db = new Database(this);
    this.db.sync({ alter: true, force: true });
    // this.db.sync({
    //   force: true
    // })

    // Song queue
    this.queue = [];

    // Queue construct
    this.queueConstruct = {};

    // Models
    this.tickets = this.db.connection.import('./structures/database/models/tickets');
    this.pebblo = this.db.connection.import('./structures/database/models/pebblo');
    this.cases = this.db.connection.import('./structures/database/models/cases');
    this.mutes = this.db.connection.import('./structures/database/models/mutes');

    // Commands
    this.commands = new Discord.Collection();
    this.aliases = new Discord.Collection();

    // Permission levels
    this.permissionLevels = {
      DEFAULT: 0,
      DONATOR: 1,
      STAFF: 2,
      ADMIN: 3
    };
  }
}

const client = new Client();

client.on('error', e => {
  client.logger.error(`Client error: ${e}`);
})

process.on('uncaughtException', e => {
  client.logger.error(`Uncaught Exception: ${e}`);
})

// // typingStart Event
// client.on('typingStart', (channel, user) => {
//   console.log(channel.id)
//   console.log(user.tag)
// })

// Ready Event
client.on('ready', async () => {
  try {
    // Clear logs
    fs.writeFileSync('./error/log.txt', '');

    // Set status
    client.user.setPresence({
      activity: {
        name: `my DMs`,
        type: 'WATCHING'
      }
    })

    // If guild doesn't exist, return
    if (client.guilds.cache.get(config.discord.guild) == null)
      return client.logger.error(`Can't find a guild with the ID ${config.discord.guild}`);
    
    // Find guild in database
    const pebblo = await client.pebblo.findOne({
      where: {
        _id: config.discord.guild
      }
    });

    // If it doesn't exist, create it
    if (!pebblo) {
      await client.pebblo.create();
      client.logger.db(`Added ${client.guilds.cache.get(config.discord.guild).name} (${config.discord.guild}) to the database`);
    }

    // client.pebblo.create();
    // client.cases.create();
    // client.tickets.create();
    // client.mutes.create()


    // Handle info logs
    let admins = config.discord.admins.length ? '' : 'none ';
    let staff = config.discord.staff.length ? '' : 'none ';

    client.logger.info(`${client.user.tag} is online`)
    client.logger.info(`${client.guilds.cache.size} server(s)`)
    client.logger.info(`Prefix: ${config.discord.prefix}`)

    for (var i = 0; i < config.discord.admins.length; i++) {
      if (client.users.cache.get(config.discord.admins[i]) != null) {
        admins += `${client.users.cache.get(config.discord.admins[i]).tag},`
      } else {
        client.logger.error(`Failed to fetch admin ${config.discord.admins[i]}`);
      }
    }

    for (var i = 0; i < config.discord.staff.length; i++) {
      if (client.users.cache.get(config.discord.staff[i]) != null) {
        staff += `${client.users.cache.get(config.discord.staff[i]).tag},`
      } else {
        client.logger.error(`Failed to fetch staff member ${config.discord.staff[i]}`);
      }
    }

    admins = admins.substring(0, admins.length - 1);
    staff = staff.substring(0, staff.length - 1);

    client.logger.info(`Admins: ${admins}`);
    client.logger.info(`Staff: ${staff}`);

    // Connect to the database
    client.db.connect();

    // Handle unmutes
    const guildMembers = client.guilds.cache.get(config.discord.guild).members.cache.filter(m => !m.user.bot).map(m => m);
    guildMembers.forEach(async (m) => {
      await client.utils.handleUnmuteOnReady(client, m.user)
    })
    
    // Lavalink
    // this.player = new PlayerManager(client, config.lavalink.nodes, {
    //   user: client.user.id,
    //   shards: 1
    // });

    // Lavalink Events
    // this.player.on('ready', node => client.logger.info(`${node.host}: Ready.`));
    // this.player.on('disconnect', (node, event) => client.logger.info(`${node.host}: Disconnected with code ${event.code} and reason ${event.reason || "No Reason Specified"}`));
    // this.player.on('raw', (node, data) => client.logger.info(node.host, data));
    // this.player.on('error', (node, error) => client.logger.error(node.host, error));

  } catch (e) {
    client.logger.error(e);
  }
})


// Message Event
client.on('message', async (msg) => {
  if (msg.author.bot || msg.author.id === client.user.id)
    return;

  // Handle tickets and messages
  if (!msg.guild) {
    await client.utils.handleTicket(msg, client, msg.author);
    await client.utils.handleMessage(msg, client);
    return;
  }

  // Command Handler
  const categories = await fs.readdirSync('./commands');
  for (var i = 0; i < categories.length; i++) {
    let thisCommands = await fs.readdirSync(`./commands/${categories[i]}`);
    thisCommands.forEach(c => {
      try {
        let command = require(`./commands/${categories[i]}/${c}`);

        client.commands.set(command.help.name, command);
        if (!command.conf)
          command.conf = {
            disabled: false,
            aliases: false,
            staffOnly: false,
            options: false,
            hidden: false
          };

        command.conf.disabled = command.conf.disabled ? command.conf.disabled : false;
        command.conf.aliases = command.conf.aliases ? command.conf.aliases : [];
        command.conf.options = command.conf.options ? command.conf.options : [];
        command.conf.hidden = command.conf.hidden ? command.conf.hidden : false;
        command.conf.staffOnly = command.conf.staffOnly ? command.conf.staffOnly : false;
        command.conf.permissionLevel = !command.conf.staffOnly && !command.conf.adminOnly ? client.permissionLevels.DEFAULT : (command.conf.staffOnly ? client.permissionLevels.STAFF : (command.conf.adminOnly ? client.permissionLevels.ADMIN : false))

        if (!command.help.category)
          command.help.category = categories[i];

        client.commands.set(command.help.name, command);

        if (!command.conf || !command.conf.aliases)
          return;

        command.conf.aliases.forEach(alias => {
          client.aliases.set(alias, command.help.name)
        })
      } catch (err) {
        client.logger.error(`Failed to load command ${c}\n${err.stack || err}`);
      }
    })
  }

  // Variables
  const prefix = config.discord.prefix;
  const args = msg.content.split(' ').slice(1);
  const commandName = msg.content.slice(prefix.length).toLowerCase().split(/\s+/)[0];
  const cmd = client.commands.get(commandName) || client.commands.find(c => c.conf.aliases && c.conf.aliases.includes(commandName));

  // If msg doesn't start with prefix, return
  if (!msg.content.startsWith(prefix))
    return;

  // Handle permissions
  if (cmd) {
    // Permission check
    let permission = await client.utils.checkPermission(msg.author, client, cmd);
    // Staff only commands
    if (cmd.conf.staffOnly && !config.discord.staff.includes(msg.author.id) && !config.discord.admins.includes(msg.author.id) && !permission) return;
    // Admin commands
    if (cmd.conf.adminOnly && !config.discord.admins.includes(msg.author.id) && !permission) return;
    if (cmd.help.category === 'admin' && !config.discord.admins.includes(msg.author.id) && !permission) return;
    // Moderation commands
    if (cmd.help.category === 'moderation' && !config.discord.staff.includes(msg.author.id) && !config.discord.admins.includes(msg.author.id) && !permission) return;
    // Disabled commands
    if (cmd.conf.disabled) return;


    // Usage handler
    if (cmd.help.usage.split(' ').length === 1 || !cmd.help.usage.split(' ')[1].length)
      return cmd.run(client, msg, args);

    let arguments = cmd.help.usage.split(' ').splice(1);

    // Reformat the array
    arguments.forEach(i => {
      // Remove [] in the argument options
      arguments[arguments.indexOf(i)] = i.substring(1, i.length - 1);

      // Add all suboptions to an array
      let subOptions = [];
      let splitOptions = i.substring(1, i.length - 1).split('|');
      splitOptions.forEach(j => subOptions.push(j))

      // Create an array instead of a string
      arguments[arguments.indexOf(i.substring(1, i.length - 1))] = subOptions;
    });

    let usageString = '';
    // Get the optional arguments
    arguments.forEach(i => {
      let optionalArguments;
      i.forEach(j => {
        optionalArguments = [];
        // Check if the argument is optional
        if (j.includes('?'))
          optionalArguments.push(j);

        let index = arguments.indexOf(i);

        // If string already includes the args, return
        if (usageString.includes(i.join('|')))
          return;

        // Format the way the args are inserted into the string (** or without)
        !args[index] && !optionalArguments.length ? (cmd.help.usage.split(' ').indexOf(`[${i.join('|')}]`) === args.length + 1 ? usageString += ` **[${i.join('|')}]**` : usageString += ` [${i.join('|')}]`) : usageString += ` [${i.join('|')}]`;

        // If the usageString isnt complete, return
        // arguments.filter(i => !(/\w+[?]/g.test(i)))
        if (usageString.split(' ').length !== arguments.length + 1)
          return;

        // If the argument isn't given and the argument length isn't the length of the usage args (not including optional args), return, else run the cmd
        if (!args[index] && arguments.filter(i => !(/\w+[?]/g.test(i))).length !== args.length)
          return msg.sendEmbed(`> ${config.discord.prefix}${cmd.help.name}${usageString}`, {
            color: 'red',
            author: {
              name: msg.author.tag,
              icon_url: msg.author.avatarURL({
                dynamic: true
              })
            },
            footer: {
              text: `Missing argument`
            },
            timestamp: new Date()
          })
        else
          return cmd.run(client, msg, args)
      })
    })
  } else {
    return;
  }
})

// On typingStart
// client.on('typingStart', async (channel, user) => {
//   // Fetch case
//   console.log(channel.name == null ? 'yes' : 'no lul')
//   console.log(user.tag)
//   const ticket = await client.tickets.findOne({
//     where: {
//       _id: channel.name == null ? user.id : channel.id
//     }
//   });

//   console.log(channel.name == null ? user.id : channel.id)
//   console.log("eh")
//   // If no ticket is found, return
//   if (!ticket)
//     return client.logger.error(`No ticket found. Failed to initiate startTyping()`);
  
// })

try {
  // Login
  client.login(config.discord.token)
} catch (e) {
  client.logger.error(e)
}

  // Event Handler
  fs.readdir('./events/', (err, files) => {
    if (err)
      return client.logger.error('Failed to load events.');
      files.forEach(f => {
        const eventFunction = require(`./events/${f}`);
        if (eventFunction.disabled)
          return;

        const event = eventFunction.event || f.split('.')[0];
        const emitter = (typeof eventFunction.emitter === 'string' ? client[eventFunction.emitter] : eventFunction.emitter) || client;
        const once = eventFunction.once;

        try {
          emitter[once ? 'once' : 'on'](event, (...args) => eventFunction.run(client, ...args));
        } catch(err) {
          client.logger.error(error.stack);
        }
      })
  })
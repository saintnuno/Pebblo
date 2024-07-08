class Eval {
    constructor() {
        this.help = {
            name: 'eval',
            usage: 'eval [args]',
            description: 'Eval stuff',
        };
        this.conf = {
            aliases: ['ev'],
            adminOnly: true
        };
    }

    async run(client, msg, args) {
        if (msg.content.toLowerCase().includes('client.token')) return;
        
        if(/--silent|--s/.test(args[0])) {
            args = msg.content.split(' ').splice(2).join(' ');
            let evaled = await eval(args);
            return msg.channel.send(this.clean(evaled));
        } else {
        
        try {
            let evaled = await eval(args.join(' '));
            if (typeof evaled !== 'string')
                evaled = require('util').inspect(evaled);
                
                msg.sendEmbed(`**Input**\n\`\`\`${args.join(' ')}\`\`\`\n**Output**:\n\`\`\`${this.clean(evaled)}\`\`\``, {color: 'role'});
        } catch(e) {
            msg.sendEmbed(`Error occurred:\n${e}`, {color: 'red'});
        }
        }
    }

    clean(text) {
        if (typeof (text) === 'string') {
            return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
        }
        else {
            return text;
        }
    }
}

module.exports = new Eval();

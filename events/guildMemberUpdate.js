exports.run = (client, oldMember, newMember) => {
    // Determine what has changed
    const changed = (oldMember.user.username !== newMember.user.username ? 'username' : (oldMember.roles.cache.size !== newMember.roles.cache.size ? 'role' : (oldMember.user.avatarURL() !== newMember.user.avatarURL() ? 'avatar' : (oldMember.nickname !== newMember.nickname ? 'nickname' : null))))
    
    // If update hasn't been integrated yet, return
    if (changed == null)
        return client.logger.warn('guildMemberUpdate has returned null.');

    // Set title
    // const title = (changed === 'username' ? 'Name change' : (changed === 'role' ? ''))
    let title;
    let desc;

    // Map roles
    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);
    
    // Set Title
    // -- Username change
    if (changed === 'username') {
        title = 'Name change';
        desc = `> **Before:** ${oldMember.user.username}\n> **After:** ${newMember.user.username}`;
    }
    else 
    // -- Add/remove roles
    if (changed === 'role') {
        if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            title = 'Role added';
            const addedRoles = newRoles.filter(function(val) {
                return oldRoles.indexOf(val) == -1;
            });
            desc = `> <@&${addedRoles[0]}>`;
        } else
        if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            title = 'Role removed';
            const removedRoles = oldRoles.filter(function(val) {
                return newRoles.indexOf(val) == -1;
            });
            desc = `> <@&${removedRoles[0]}>`;
        }
    } else
    // -- Avatar update
    if (changed === 'avatar') {
        title = 'Avatar update';
        desc = `> <@${newMember.id}>`;
    } else
    // -- Nickname change
    if (changed === 'nickname') {
        if (oldMember.nickname == null && newMember.nickname !== oldMember.user.username) {
            title = 'Nickname added';
        } else
        if (oldMember.nickname != null && newMember.nickname === null) {
            title = 'Nickname removed';
        } else
        if (oldMember.nickname != null && newMember.nickname != null && oldMember.nickname !== newMember.nickname) {
            title = 'Nickname change';
        }
        desc = `> **Before:** ${oldMember.nickname === null ? oldMember.user.username : oldMember.nickname}\n> **After:** ${newMember.nickname === null ? newMember.user.username : newMember.nickname}`;
    }
    
    // Create embed
    const embed = new Discord.MessageEmbed()
        .setColor(config.colors.blue)
        .setTitle(title)
        .setAuthor(newMember.user.tag, newMember.user.avatarURL({ dynamic: true }))
        .setDescription(desc)
        .setTimestamp()
        .setFooter(`ID: ${newMember.id}`)
        changed === 'avatar' ? embed.setThumbnail(newMember.user.avatarURL()) : null;

    // Send embed into the member logging channel
    client.channels.cache.get(config.discord.memberLogging).send(embed);
}
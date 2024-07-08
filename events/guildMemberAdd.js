exports.run = (client, member) => {
    // Create embed
    const embed = new Discord.MessageEmbed()
        .setColor(config.colors.blue)
        .setTitle('Member joined')
        .setAuthor(member.user.tag, member.user.avatarURL({ dynamic: true }))
        .setDescription(`<@${member.id}>`)
        .setTimestamp()
        .setFooter(`ID: ${member.id}`);

    // Send embed into the member logging channel
    client.channels.cache.get(config.discord.memberLogging).send(embed);
}
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('pebblo', {
        _id: {
            primaryKey: true,
            type: DataTypes.STRING,
            defaultValue: config.discord.guild
        },
        prefix: {
            type: DataTypes.STRING,
            defaultValue: config.discord.prefix
        },
        modLogging: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        modChannel: {
            type: DataTypes.STRING,
            defaultValue: config.discord.modChannel
        },
        permissions: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        }
    })
}
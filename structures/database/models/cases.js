module.exports = (sequelize, DataTypes) => {
    return sequelize.define('cases', {
        _id: {
            primaryKey: true,
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        moderator: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        user: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        action: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        reason: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: new Date()
        }
    })
}
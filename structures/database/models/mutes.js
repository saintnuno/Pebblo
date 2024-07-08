module.exports = (sequelize, DataTypes) => {
    return sequelize.define('mutes', {
        _id: {
            primaryKey: true,
            type: DataTypes.STRING,
            defaultValue: ''
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        roles: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        duration: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        unmuteDate: {
            type: DataTypes.DATE,
            defaultValue: new Date()
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: new Date()
        }
    })
}
const { DataTypes } = require('sequelize');
const snowflake = require('node-snowflake').Snowflake;

module.exports = (sequelize) => {
    return sequelize.define('users', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: snowflake.generate()
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        avatar: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email_code: {
            type: DataTypes.STRING,
            defaultValue: ''
        },
        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        theme: {
            type: DataTypes.STRING,
            defaultValue: 'dark'
        },
        subscription: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        suspended: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        staff: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        developer: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        registered_at: {
            type: DataTypes.DATE,
            defaultValue: new Date().toISOString()
        }
    });
};
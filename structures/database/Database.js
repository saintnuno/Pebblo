const sequelize = require('sequelize');
require('dotenv').config();
// const config = require('../../config');
// const logger = require('../../modules/Logger');

module.exports = class Database {
    constructor() {
        this.connection = new sequelize('botaku', 'postgres', 'Nuriel24-2=22', {
            host: 'localhost',
            port: 5434,
            dialect: 'postgres',
            logging: false,
            define: {
                timestamps: false,
                freezeTableName: true
            }
        })
    }

    async connect() {
        try {
            await this.connection.authenticate().catch(err => console.log(err));
            logger.db('Successfully connected to the database')
        } catch(e) {
            logger.error(e)
        }
    }

    async destroy() {
        await this.connection.close();
        logger.db('Closed connection to the database')
    }

    async sync(opt = {}) {
        // console.log("test")
        await this.connection.authenticate().then(() => {
            logger.db('Synced the database')
            return this.connection.sync(opt)
        }).catch(err => console.log(err));
    }
}
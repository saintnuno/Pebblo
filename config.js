const cfg = [];
require('dotenv').config();

// Discord general settings
cfg.discord =  {
    prefix: '?',
    guild: '841431351311073300', //'735098350809907201',
    modChannel: '841432863043223613', //'793946505891414058',
    memberLogging: '841432902247383073',
    token: process.env.CLIENT_TOKEN,
    admins: ['199801459469058048'], // '253544423110082589'
    staff: []
};

// Database login
cfg.db = {
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
};

// Colors
cfg.colors = {
    blue: '#2394c4',
    red: '#c61d1d'
};

// Lavalink data (not complete  -+*9+63)
cfg.lavalink = {
    nodes: [{ 'host': 'localhost', 'port': 8643, 'password': process.env.LAVALINK_PASS}]
};

module.exports = cfg;
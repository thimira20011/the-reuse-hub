const Database = require('better-sqlite3');
const db = new Database('./data.sqlite');
module.exports = db;
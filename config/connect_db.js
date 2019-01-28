const dbconfig = require('../config/database.js');
const mysql = require('mysql2/promise');
const pool = mysql.createPool(dbconfig);

module.exports = pool;
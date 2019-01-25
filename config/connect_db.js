var dbconfig = require('../config/database.js');
var mysql = require('mysql2/promise');
var pool = mysql.createPool(dbconfig);

module.exports = pool;
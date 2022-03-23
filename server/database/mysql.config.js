const mysql = require('mysql');
const config = require('./config');

// 创建连接池
const createPool = () => {
    return mysql.createPool({
        host: config.database.HOST,
        port: config.database.PORT,
        database: config.database.DATABASE,
        user: config.database.USER,
        password: config.database.PASSWORD
    });
}

module.exports = { createPool }

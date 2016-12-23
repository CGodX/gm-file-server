const mysql = require('mysql');
// 数据库连接池
const pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'gm-file-server'
});


module.exports = pool;

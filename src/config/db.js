const knex = require('knex')

// 云托管环境变量格式：MYSQL_ADDRESS=10.3.106.76:3306
const [host, port] = (process.env.MYSQL_ADDRESS || '127.0.0.1:3306').split(':')

const db = knex({
    client: 'mysql2',
    connection: {
        host: host,
        port: parseInt(port) || 3306,
        user: process.env.MYSQL_USERNAME || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'lingxue',
        charset: 'utf8mb4',
        keepAliveInitialDelay: 10000,
        enableKeepAlive: true
    },
    pool: {
        min: 1,
        max: 10,
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
        propagateCreateError: false
    }
})

// 测试连接
db.raw('SELECT 1')
    .then(() => console.log('✅ MySQL 连接成功'))
    .catch(err => console.error('❌ MySQL 连接失败:', err.message))

module.exports = db

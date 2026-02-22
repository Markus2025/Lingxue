/**
 * 数据库自动初始化脚本
 * 在服务首次启动时安全地建库建表（使用 IF NOT EXISTS，幂等操作）
 */
const mysql2 = require('mysql2/promise')
const path = require('path')
const fs = require('fs')

async function initDb() {
    const [host, port] = (process.env.MYSQL_ADDRESS || '127.0.0.1:3306').split(':')
    const user = process.env.MYSQL_USERNAME || 'root'
    const password = process.env.MYSQL_PASSWORD || ''

    let conn
    try {
        // 不指定 database，先连接 MySQL 本体建库
        conn = await mysql2.createConnection({
            host,
            port: parseInt(port) || 3306,
            user,
            password,
            charset: 'utf8mb4',
            multipleStatements: true
        })

        console.log('🔧 开始执行数据库初始化...')

        // 读取 init.sql 文件
        const sqlPath = path.join(__dirname, '../../sql/init.sql')
        const sql = fs.readFileSync(sqlPath, 'utf8')

        await conn.query(sql)
        console.log('✅ 数据库初始化完成（所有表已就绪）')
    } catch (err) {
        console.error('❌ 数据库初始化失败:', err.message)
        // 非致命错误：初始化失败不阻止服务启动
        // 如果表已存在（IF NOT EXISTS），该操作是幂等的不会报错
    } finally {
        if (conn) await conn.end()
    }
}

module.exports = initDb

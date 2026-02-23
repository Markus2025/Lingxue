const express = require('express')
const cors = require('cors')
const logger = require('./config/logger')
const errorHandler = require('./middleware/errorHandler')
const initDb = require('./utils/initDb')

// 云托管环境变量自动注入，本地开发时读 .env
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const app = express()
const PORT = process.env.PORT || 80

// ========== 中间件 ==========
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        openid: req.headers['x-wx-openid'] || 'anonymous',
        ip: req.headers['x-forwarded-for'] || req.ip
    })
    next()
})

// ========== 路由 ==========
app.get('/', (req, res) => {
    res.json({
        code: 0,
        msg: '邻学后端服务运行中',
        data: {
            version: '1.0.0',
            env: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        }
    })
})

// 健康检查（云托管用）
app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

// === 临时路由：用于执行迁移和Mock数据插入 ===
app.post('/api/operation/temp-seed', async (req, res) => {
    try {
        logger.info('触发临时 seed 脚本...')

        // 1. 先执行数据库结构修改 (增加 JSON 列)
        const db = require('./config/db');
        const hasContactQuestions = await db.schema.hasColumn('cards', 'contact_questions');
        const hasPreTags = await db.schema.hasColumn('cards', 'pre_answered_tags');

        if (!hasContactQuestions || !hasPreTags) {
            await db.schema.alterTable('cards', table => {
                if (!hasContactQuestions) {
                    table.json('contact_questions').defaultTo(null).comment('联系前的防骚扰问题 [{q, a}]');
                }
                if (!hasPreTags) {
                    table.json('pre_answered_tags').defaultTo(null).comment('预设的服务承诺标签 ["标签1"]');
                }
            });
            logger.info('数据库列添加成功');
        }

        // 2. 执行数据插入 (使用子进程防止直接载入阻塞)
        const { exec } = require('child_process');
        const path = require('path');
        const scriptPath = path.join(__dirname, '../scripts/seed-mock.js');

        exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                logger.error(`Seed 子进程执行错误: ${error}`);
                return res.status(500).json({ code: 500, msg: error.message });
            }
            logger.info(`Seed 子进程标准输出: ${stdout}`);
            logger.error(`Seed 子进程标准错误: ${stderr}`);
            // 不能在这里响应，因为exec是异步的，我们可以先响应"已在后台执行"，或者如果脚本快就等
        });

        res.json({ code: 0, msg: '数据库迁移已执行，Seed 脚本已在后台启动！请查看云托管日志。' })
    } catch (err) {
        logger.error('Seed 路由错误:', err)
        res.status(500).json({ code: 500, msg: err.message })
    }
})

// 业务路由
const userRoutes = require('./routes/user')
const cardRoutes = require('./routes/card')
const contactRoutes = require('./routes/contact')
const favoriteRoutes = require('./routes/favorite')
const operationRoutes = require('./routes/operation')

app.use('/api/user', userRoutes)
app.use('/api/cards', cardRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/operation', operationRoutes)

// ========== 错误处理 ==========
app.use(errorHandler)

// ========== 启动服务 ==========
app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`邻学后端服务已启动 -> 端口 ${PORT}`)
    // 自动初始化数据库（幂等，已存在的表不受影响）
    await initDb()
})

module.exports = app

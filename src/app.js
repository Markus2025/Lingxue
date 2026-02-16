const express = require('express')
const cors = require('cors')
const logger = require('./config/logger')
const errorHandler = require('./middleware/errorHandler')

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
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`邻学后端服务已启动 -> 端口 ${PORT}`)
})

module.exports = app

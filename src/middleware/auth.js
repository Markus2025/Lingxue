/**
 * 鉴权中间件
 * 从 wx.cloud.callContainer 自动注入的请求头中提取 openid
 */
const db = require('../config/db')
const logger = require('../config/logger')

async function auth(req, res, next) {
    const openid = req.headers['x-wx-openid']

    if (!openid) {
        return res.json({ code: 1002, msg: '未授权：缺少用户身份' })
    }

    req.openid = openid
    req.unionid = req.headers['x-wx-unionid'] || null

    try {
        // 查询用户信息并挂载到 req.user
        const user = await db('users').where({ openid }).first()
        if (!user) {
            return res.json({ code: 1002, msg: '用户未注册，请先登录' })
        }
        req.user = user
    } catch (err) {
        logger.error('鉴权查询用户失败:', err.message)
        return res.json({ code: 500, msg: '鉴权服务异常' })
    }

    next()
}

/**
 * 可选鉴权：有 openid 就解析，没有也放行（用于首页等公开页面）
 */
async function optionalAuth(req, res, next) {
    const openid = req.headers['x-wx-openid']
    if (openid) {
        req.openid = openid
        try {
            const user = await db('users').where({ openid }).first()
            req.user = user || null
        } catch (err) {
            logger.error('可选鉴权查询失败:', err.message)
        }
    }
    next()
}

module.exports = { auth, optionalAuth, requireHeaders }

/**
 * 仅检查微信 header 注入 (用于 login 接口，不检查 DB)
 */
function requireHeaders(req, res, next) {
    const openid = req.headers['x-wx-openid']
    if (!openid) {
        return res.json({ code: 1002, msg: '未授权：缺少用户身份' })
    }
    req.openid = openid
    req.unionid = req.headers['x-wx-unionid'] || null
    next()
}

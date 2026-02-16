const logger = require('../config/logger')

/**
 * 统一错误处理中间件
 */
function errorHandler(err, req, res, next) {
    logger.error('服务端错误:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    })

    res.status(err.status || 500).json({
        code: err.code || 5000,
        msg: err.message || '服务器内部错误'
    })
}

module.exports = errorHandler

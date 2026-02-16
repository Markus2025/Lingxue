const winston = require('winston')

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`
        })
    ),
    transports: [
        new winston.transports.Console()
    ]
})

module.exports = logger

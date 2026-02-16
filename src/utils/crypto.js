/**
 * 敏感数据加解密工具
 * 用于手机号、微信号等敏感字段的存储加密
 */

const crypto = require('crypto')

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

function getKey() {
    const key = process.env.ENCRYPT_KEY
    if (!key || key.length < 32) {
        throw new Error('ENCRYPT_KEY 环境变量未设置或长度不足 32 位')
    }
    return Buffer.from(key.slice(0, 32), 'utf8')
}

/**
 * 加密字符串
 * @param {string} text - 原始文本
 * @returns {string} 加密后的字符串（iv:encrypted 格式）
 */
function encrypt(text) {
    if (!text) return text
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
}

/**
 * 解密字符串
 * @param {string} encryptedText - 加密的字符串
 * @returns {string} 解密后的原始文本
 */
function decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText
    const [ivHex, encrypted] = encryptedText.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

module.exports = { encrypt, decrypt }

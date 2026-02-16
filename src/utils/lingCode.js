/**
 * 邻学码生成工具
 * 规则：6 位大写字母+数字组合，唯一性保证
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去除容易混淆的 I/O/0/1

/**
 * 生成一个随机 6 位邻学码
 */
function randomCode() {
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }
    return code
}

/**
 * 生成唯一的邻学码（带数据库碰撞检测）
 * @param {import('knex').Knex} db - Knex 数据库实例
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<string>} 唯一的邻学码
 */
async function generate(db, maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        const code = randomCode()
        const exists = await db('users').where({ ling_code: code }).first()
        if (!exists) return code
    }
    throw new Error('邻学码生成失败：重试次数过多')
}

module.exports = { generate, randomCode }

const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// POST /api/contact/:cardId - 发起联系
router.post('/:cardId', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { cardId } = req.params

        // 查找目标卡片
        const card = await db('cards')
            .join('users', 'cards.user_id', 'users.id')
            .select('cards.*', 'users.wechat_id', 'users.phone')
            .where('cards.id', cardId)
            .whereNull('cards.deleted_at')
            .first()

        if (!card) {
            return res.json({ code: 1003, msg: '卡片不存在' })
        }

        // 不能联系自己
        if (card.user_id === req.user.id) {
            return res.json({ code: 1001, msg: '不能联系自己' })
        }

        // 记录联系日志
        await db('contact_logs').insert({
            requester_id: req.user.id,
            target_id: card.user_id,
            card_id: parseInt(cardId),
            contacted_at: new Date()
        })

        // 返回联系方式（脱敏处理）
        res.json({
            code: 0,
            msg: 'success',
            data: {
                wechat_id: card.wechat_id || null,
                phone: card.phone || null
            }
        })
    } catch (err) {
        next(err)
    }
})

// GET /api/contact/history - 联系记录列表
router.get('/history', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { page = 1, pageSize = 20 } = req.query
        const offset = (parseInt(page) - 1) * parseInt(pageSize)

        const query = db('contact_logs')
            .join('cards', 'contact_logs.card_id', 'cards.id')
            .join('users', 'cards.user_id', 'users.id')
            .select(
                'contact_logs.id',
                'contact_logs.contacted_at',
                'cards.id as card_id',
                'cards.bio',
                'cards.slogan',
                'users.nickname',
                'users.avatar',
                'users.school'
            )
            .where('contact_logs.requester_id', req.user.id)
            .orderBy('contact_logs.contacted_at', 'desc')

        const total = await query.clone().count('contact_logs.id as count').first()
        const list = await query.limit(parseInt(pageSize)).offset(offset)

        res.json({
            code: 0,
            msg: 'success',
            data: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: total.count,
                list
            }
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router

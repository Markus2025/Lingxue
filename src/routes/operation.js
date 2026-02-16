const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')

// POST /api/operation/report - 举报
router.post('/report', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { card_id, reason, description } = req.body

        if (!card_id || !reason) {
            return res.json({ code: 1001, msg: '参数不完整' })
        }

        await db('reports').insert({
            reporter_id: req.user.id,
            target_card_id: parseInt(card_id),
            reason,
            description: description || '',
            status: 'pending',
            created_at: new Date()
        })

        res.json({ code: 0, msg: '举报已提交，我们会尽快处理' })
    } catch (err) {
        next(err)
    }
})

// POST /api/operation/feedback - 提交反馈
router.post('/feedback', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { type, content, images, contact } = req.body

        if (!content) {
            return res.json({ code: 1001, msg: '请输入反馈内容' })
        }

        await db('feedbacks').insert({
            user_id: req.user.id,
            type: type || 'suggestion',
            content,
            images: JSON.stringify(images || []),
            contact: contact || null,
            status: 'pending',
            created_at: new Date()
        })

        res.json({ code: 0, msg: '反馈已提交，感谢您的建议' })
    } catch (err) {
        next(err)
    }
})

// GET /api/operation/search/hot - 热搜榜
router.get('/search/hot', optionalAuth, async (req, res, next) => {
    try {
        const db = require('../config/db')

        const list = await db('search_hot')
            .orderBy('count', 'desc')
            .limit(20)
            .select('keyword', 'count', 'is_hot', 'is_new')

        res.json({ code: 0, msg: 'success', data: list })
    } catch (err) {
        next(err)
    }
})

// GET /api/operation/stats - 数据统计（用于数据中心组件）
router.get('/stats', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')

        // 我的卡片浏览量
        const card = await db('cards')
            .where({ user_id: req.user.id })
            .whereNull('deleted_at')
            .select('view_count')
            .first()

        // 被联系次数
        const contactCount = await db('contact_logs')
            .where('target_id', req.user.id)
            .count('id as count')
            .first()

        // 被收藏次数
        const favoriteCount = await db('favorites')
            .join('cards', 'favorites.card_id', 'cards.id')
            .where('cards.user_id', req.user.id)
            .whereNull('favorites.deleted_at')
            .count('favorites.id as count')
            .first()

        res.json({
            code: 0,
            msg: 'success',
            data: {
                view_count: card ? card.view_count : 0,
                contact_count: contactCount.count,
                favorite_count: favoriteCount.count
            }
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router

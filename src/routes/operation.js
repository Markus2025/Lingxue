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

        // 我的卡片基本信息
        const card = await db('cards')
            .where({ user_id: req.user.id })
            .whereNull('deleted_at')
            .select('id', 'view_count')
            .first()

        // 被联系次数总计
        const contactCount = await db('contact_logs')
            .where('target_id', req.user.id)
            .count('id as count')
            .first()

        // --- 历史趋势数据 (近30天) ---
        const dateObj = new Date()
        const offsetMs = dateObj.getTimezoneOffset() * 60 * 1000
        const localDate = new Date(dateObj.getTime() - offsetMs)
        const todayStr = localDate.toISOString().split('T')[0]

        // 30天前的日期
        const thirtyDaysAgo = new Date(localDate.getTime() - 29 * 24 * 60 * 60 * 1000)
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0]

        let dailyViews = []
        if (card) {
            dailyViews = await db('card_daily_views')
                .where('card_id', card.id)
                .where('view_date', '>=', startDateStr)
                .where('view_date', '<=', todayStr)
                .select(db.raw('DATE_FORMAT(view_date, "%Y-%m-%d") as date'), 'view_count as count')
        }

        const dailyContacts = await db('contact_logs')
            .where('target_id', req.user.id)
            .where('contacted_at', '>=', startDateStr + ' 00:00:00')
            .select(db.raw('DATE_FORMAT(contacted_at, "%Y-%m-%d") as date'), db.raw('COUNT(*) as count'))
            .groupByRaw('DATE_FORMAT(contacted_at, "%Y-%m-%d")')

        // 简易计算趋势 (最近7天 vs 上一个7天)，这里前端使用趋势百分比展示
        const calcTrend = (arr) => {
            const arr7 = arr.slice(-7)
            const prev7 = arr.slice(-14, -7)
            const sum7 = arr7.reduce((a, b) => a + Number(b.count || 0), 0)
            const sumPrev = prev7.reduce((a, b) => a + Number(b.count || 0), 0)
            if (sumPrev === 0) return sum7 > 0 ? 100 : 0
            return Math.floor(((sum7 - sumPrev) / sumPrev) * 100)
        }

        res.json({
            code: 0,
            msg: 'success',
            data: {
                view_count: card ? card.view_count : 0,
                contact_count: contactCount.count,
                favorite_count: favoriteCount.count,
                views_trend: calcTrend(dailyViews),
                contacts_trend: calcTrend(dailyContacts),
                daily_views: dailyViews,
                daily_contacts: dailyContacts,
                start_date: startDateStr,
                end_date: todayStr
            }
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router

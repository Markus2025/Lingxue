const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// POST /api/favorites/:cardId - 收藏/取消收藏（切换）
router.post('/:cardId', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { cardId } = req.params

        // 查找现有收藏
        const existing = await db('favorites')
            .where({ user_id: req.user.id, card_id: parseInt(cardId) })
            .first()

        if (existing) {
            if (existing.deleted_at) {
                // 恢复收藏
                await db('favorites').where({ id: existing.id }).update({ deleted_at: null })
                res.json({ code: 0, msg: 'success', data: { favorited: true } })
            } else {
                // 取消收藏（软删除）
                await db('favorites').where({ id: existing.id }).update({ deleted_at: new Date() })
                res.json({ code: 0, msg: 'success', data: { favorited: false } })
            }
        } else {
            // 新增收藏
            await db('favorites').insert({
                user_id: req.user.id,
                card_id: parseInt(cardId),
                created_at: new Date()
            })
            res.json({ code: 0, msg: 'success', data: { favorited: true } })
        }
    } catch (err) {
        next(err)
    }
})

// GET /api/favorites - 收藏列表
router.get('/', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { page = 1, pageSize = 20 } = req.query
        const offset = (parseInt(page) - 1) * parseInt(pageSize)

        const query = db('favorites')
            .join('cards', 'favorites.card_id', 'cards.id')
            .join('users', 'cards.user_id', 'users.id')
            .select(
                'favorites.id as favorite_id',
                'favorites.created_at as favorited_at',
                'cards.*',
                'users.nickname',
                'users.avatar',
                'users.school',
                'users.major',
                'users.edu_verified'
            )
            .where('favorites.user_id', req.user.id)
            .whereNull('favorites.deleted_at')
            .whereNull('cards.deleted_at')
            .orderBy('favorites.created_at', 'desc')

        const total = await query.clone().count('favorites.id as count').first()
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

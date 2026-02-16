const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// POST /api/favorites/:cardId - 收藏/取消收藏（切换）
router.post('/:cardId', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { cardId } = req.params
        const { category_id } = req.body

        const existing = await db('favorites')
            .where({ user_id: req.user.id, card_id: parseInt(cardId) })
            .first()

        if (existing) {
            if (existing.deleted_at) {
                await db('favorites').where({ id: existing.id }).update({
                    deleted_at: null,
                    category_id: category_id || existing.category_id
                })
                await db('cards').where({ id: parseInt(cardId) }).increment('favorite_count', 1)
                res.json({ code: 0, msg: 'success', data: { favorited: true } })
            } else {
                await db('favorites').where({ id: existing.id }).update({ deleted_at: new Date() })
                await db('cards').where({ id: parseInt(cardId) }).decrement('favorite_count', 1)
                res.json({ code: 0, msg: 'success', data: { favorited: false } })
            }
        } else {
            await db('favorites').insert({
                user_id: req.user.id,
                card_id: parseInt(cardId),
                category_id: category_id || null,
                created_at: new Date()
            })
            await db('cards').where({ id: parseInt(cardId) }).increment('favorite_count', 1)
            res.json({ code: 0, msg: 'success', data: { favorited: true } })
        }
    } catch (err) {
        next(err)
    }
})

// GET /api/favorites - 收藏列表（支持分类筛选）
router.get('/', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { page = 1, pageSize = 20, category_id } = req.query
        const offset = (parseInt(page) - 1) * parseInt(pageSize)

        let query = db('favorites')
            .join('cards', 'favorites.card_id', 'cards.id')
            .join('users', 'cards.user_id', 'users.id')
            .select(
                'favorites.id as favorite_id',
                'favorites.category_id',
                'favorites.created_at as favorited_at',
                'cards.id as card_id',
                'cards.slogan', 'cards.skills', 'cards.tags',
                'cards.price_min', 'cards.price_max',
                'users.id as user_id', 'users.nickname', 'users.avatar',
                'users.school', 'users.major', 'users.grade',
                'users.location', 'users.edu_verified'
            )
            .where('favorites.user_id', req.user.id)
            .whereNull('favorites.deleted_at')
            .whereNull('cards.deleted_at')
            .orderBy('favorites.created_at', 'desc')

        // 按分类筛选
        if (category_id) {
            query = query.where('favorites.category_id', parseInt(category_id))
        }

        const total = await query.clone().count('favorites.id as count').first()
        const list = await query.limit(parseInt(pageSize)).offset(offset)

        res.json({
            code: 0,
            msg: 'success',
            data: { page: parseInt(page), pageSize: parseInt(pageSize), total: total.count, list }
        })
    } catch (err) {
        next(err)
    }
})

// PUT /api/favorites/:favoriteId/category - 移动收藏到分类
router.put('/:favoriteId/category', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { favoriteId } = req.params
        const { category_id } = req.body

        await db('favorites')
            .where({ id: parseInt(favoriteId), user_id: req.user.id })
            .update({ category_id: category_id || null })

        res.json({ code: 0, msg: 'success' })
    } catch (err) {
        next(err)
    }
})

// ===== 收藏分类 CRUD =====

// GET /api/favorites/categories - 获取我的收藏分类
router.get('/categories', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const list = await db('favorite_categories')
            .where({ user_id: req.user.id })
            .orderBy('sort_order', 'asc')

        res.json({ code: 0, msg: 'success', data: list })
    } catch (err) {
        next(err)
    }
})

// POST /api/favorites/categories - 创建收藏分类
router.post('/categories', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { name } = req.body

        if (!name || !name.trim()) {
            return res.json({ code: 1001, msg: '请输入分类名称' })
        }

        const [id] = await db('favorite_categories').insert({
            user_id: req.user.id,
            name: name.trim(),
            created_at: new Date()
        })

        res.json({ code: 0, msg: 'success', data: { id, name: name.trim() } })
    } catch (err) {
        next(err)
    }
})

// DELETE /api/favorites/categories/:id - 删除收藏分类
router.delete('/categories/:id', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { id } = req.params

        // 将该分类下的收藏移到"未分类"
        await db('favorites')
            .where({ user_id: req.user.id, category_id: parseInt(id) })
            .update({ category_id: null })

        await db('favorite_categories')
            .where({ id: parseInt(id), user_id: req.user.id })
            .delete()

        res.json({ code: 0, msg: 'success' })
    } catch (err) {
        next(err)
    }
})

module.exports = router

const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')

// GET /api/cards - 卡片列表（分页 + 筛选）
router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { page = 1, pageSize = 20, category, minPrice, maxPrice, mode, region, sort } = req.query

        // 1. 构建基础查询（包含 Join 和 过滤条件）
        const baseQuery = db('cards')
            .join('users', 'cards.user_id', 'users.id')
            .whereNull('cards.deleted_at')
            .where('cards.status', 'active')

        // 分类筛选
        if (category && category !== 'all') {
            baseQuery.whereRaw('JSON_CONTAINS(cards.skills, ?)', [JSON.stringify(category)])
        }

        // 价格区间筛选
        if (minPrice) baseQuery.where('cards.price_min', '>=', parseInt(minPrice))
        if (maxPrice) baseQuery.where('cards.price_max', '<=', parseInt(maxPrice))

        // 授课模式筛选
        if (mode === 'online') baseQuery.where('cards.mode_online', true)
        if (mode === 'offline') baseQuery.where('cards.mode_offline', true)

        // 地区筛选
        if (region) baseQuery.where('cards.region', 'like', `%${region}%`)

        // 2. 获取总数
        const totalResult = await baseQuery.clone().count('cards.id as count').first()
        const total = totalResult ? totalResult.count : 0

        // 3. 构建详细查询并获取列表
        let listQuery = baseQuery.clone().select(
            'cards.*',
            'users.nickname',
            'users.avatar',
            'users.school',
            'users.major',
            'users.grade',
            'users.location',
            'users.edu_verified',
            'users.ling_code'
        )

        // 排序
        if (sort === 'newest') listQuery = listQuery.orderBy('cards.created_at', 'desc')
        else if (sort === 'price_asc') listQuery = listQuery.orderBy('cards.price_min', 'asc')
        else if (sort === 'price_desc') listQuery = listQuery.orderBy('cards.price_min', 'desc')
        else listQuery = listQuery.orderBy('cards.updated_at', 'desc')

        // 分页
        const offset = (parseInt(page) - 1) * parseInt(pageSize)
        const list = await listQuery.limit(parseInt(pageSize)).offset(offset)

        res.json({
            code: 0,
            msg: 'success',
            data: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                list
            }
        })
    } catch (err) {
        next(err)
    }
})

// GET /api/cards/search - 搜索卡片
router.get('/search', optionalAuth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { keyword, page = 1, pageSize = 20 } = req.query

        if (!keyword) {
            return res.json({ code: 1001, msg: '请输入搜索关键词' })
        }

        // 判断是否为邻学码精准搜索（6位字母数字）
        if (/^[A-Za-z0-9]{6}$/.test(keyword.trim())) {
            const user = await db('users')
                .where('ling_code', keyword.trim().toUpperCase())
                .first()

            if (user) {
                const card = await db('cards')
                    .where('user_id', user.id)
                    .whereNull('deleted_at')
                    .first()

                return res.json({
                    code: 0,
                    msg: 'success',
                    data: {
                        type: 'ling_code',
                        page: 1,
                        pageSize: 1,
                        total: card ? 1 : 0,
                        list: card ? [{ ...card, ...user }] : []
                    }
                })
            }
        }

        // 关键词搜索（MySQL LIKE）
        const offset = (parseInt(page) - 1) * parseInt(pageSize)
        const searchTerm = `%${keyword}%`

        // 1. 构建基础查询
        const baseQuery = db('cards')
            .join('users', 'cards.user_id', 'users.id')
            .whereNull('cards.deleted_at')
            .where('cards.status', 'active')
            .where(function () {
                this.where('users.nickname', 'like', searchTerm)
                    .orWhere('cards.bio', 'like', searchTerm)
                    .orWhere('cards.slogan', 'like', searchTerm)
                    .orWhereRaw('JSON_SEARCH(cards.skills, "one", ?) IS NOT NULL', [keyword])
            })

        // 2. 获取总数
        const totalResult = await baseQuery.clone().count('cards.id as count').first()
        const total = totalResult ? totalResult.count : 0

        // 3. 构建详细查询
        const list = await baseQuery.clone()
            .select('cards.*', 'users.nickname', 'users.avatar', 'users.school', 'users.major', 'users.grade', 'users.location', 'users.edu_verified', 'users.ling_code')
            .orderBy('cards.updated_at', 'desc')
            .limit(parseInt(pageSize))
            .offset(offset)

        // 异步记录热搜词
        db('search_hot')
            .insert({ keyword, count: 1, updated_at: new Date() })
            .onConflict('keyword')
            .merge({ count: db.raw('count + 1'), updated_at: new Date() })
            .catch(() => { })

        res.json({
            code: 0,
            msg: 'success',
            data: {
                type: 'keyword',
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                list
            }
        })
    } catch (err) {
        next(err)
    }
})

// GET /api/cards/:id - 卡片详情
router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { id } = req.params

        const card = await db('cards')
            .join('users', 'cards.user_id', 'users.id')
            .select('cards.*', 'users.nickname', 'users.avatar', 'users.school', 'users.major', 'users.grade', 'users.location', 'users.edu_verified', 'users.ling_code', 'users.gender')
            .where('cards.id', id)
            .whereNull('cards.deleted_at')
            .first()

        if (!card) {
            return res.json({ code: 1003, msg: '卡片不存在' })
        }

        // 增加浏览量
        await db('cards').where('id', id).increment('view_count', 1)

        // 如果已登录，查询是否已收藏
        let is_favorited = false
        if (req.user) {
            const fav = await db('favorites')
                .where({ user_id: req.user.id, card_id: id })
                .whereNull('deleted_at')
                .first()
            is_favorited = !!fav
        }

        res.json({
            code: 0,
            msg: 'success',
            data: { ...card, is_favorited }
        })
    } catch (err) {
        next(err)
    }
})

// POST /api/cards - 创建或更新我的卡片
router.post('/', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const {
            bio, slogan, skills, tags, price_min, price_max,
            mode_online, mode_offline, region,
            time_slots, dimensions, teaching_format, service_name
        } = req.body

        const cardData = {
            bio, slogan,
            skills: JSON.stringify(skills || []),
            tags: JSON.stringify(tags || []),
            price_min: price_min || 0,
            price_max: price_max || 0,
            mode_online: mode_online || false,
            mode_offline: mode_offline || false,
            region: region || '',
            time_slots: JSON.stringify(time_slots || []),
            dimensions: JSON.stringify(dimensions || {}),
            teaching_format: teaching_format || '',
            service_name: service_name || '',
            status: 'active',
            updated_at: new Date()
        }

        // 查找是否已有卡片
        const existing = await db('cards').where({ user_id: req.user.id }).whereNull('deleted_at').first()

        let cardId
        if (existing) {
            await db('cards').where({ id: existing.id }).update(cardData)
            cardId = existing.id
        } else {
            cardData.user_id = req.user.id
            cardData.created_at = new Date()
                ;[cardId] = await db('cards').insert(cardData)
        }

        const card = await db('cards').where({ id: cardId }).first()
        res.json({ code: 0, msg: 'success', data: card })
    } catch (err) {
        next(err)
    }
})

module.exports = router

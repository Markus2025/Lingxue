const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// POST /api/user/login - 微信登录（自动注册）
router.post('/login', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { openid, unionid } = req

        // 查找现有用户
        let user = await db('users').where({ openid }).first()

        if (!user) {
            // 自动注册新用户
            const lingCode = require('../utils/lingCode')
            const code = await lingCode.generate(db)

            const [id] = await db('users').insert({
                openid,
                unionid,
                ling_code: code,
                created_at: new Date()
            })

            user = await db('users').where({ id }).first()
        }

        // 更新最后登录时间
        await db('users').where({ openid }).update({ last_login_at: new Date() })

        res.json({
            code: 0,
            msg: 'success',
            data: {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar,
                ling_code: user.ling_code,
                edu_verified: user.edu_verified,
                is_new: !user.nickname // 没有昵称说明是新用户
            }
        })
    } catch (err) {
        next(err)
    }
})

// GET /api/user/profile - 获取当前用户资料
router.get('/profile', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')

        if (!req.user) {
            return res.json({ code: 1003, msg: '用户不存在' })
        }

        res.json({
            code: 0,
            msg: 'success',
            data: req.user
        })
    } catch (err) {
        next(err)
    }
})

// PUT /api/user/profile - 更新用户资料
router.put('/profile', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { nickname, avatar, phone, wechat_id, gender, school, major, grade } = req.body

        const updateData = {}
        if (nickname !== undefined) updateData.nickname = nickname
        if (avatar !== undefined) updateData.avatar = avatar
        if (phone !== undefined) updateData.phone = phone
        if (wechat_id !== undefined) updateData.wechat_id = wechat_id
        if (gender !== undefined) updateData.gender = gender
        if (school !== undefined) updateData.school = school
        if (major !== undefined) updateData.major = major
        if (grade !== undefined) updateData.grade = grade

        updateData.updated_at = new Date()

        await db('users').where({ openid: req.openid }).update(updateData)

        const user = await db('users').where({ openid: req.openid }).first()
        res.json({ code: 0, msg: 'success', data: user })
    } catch (err) {
        next(err)
    }
})

// POST /api/user/ling-code/reset - 重置邻学码
router.post('/ling-code/reset', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const lingCode = require('../utils/lingCode')

        const newCode = await lingCode.generate(db)
        await db('users').where({ openid: req.openid }).update({
            ling_code: newCode,
            updated_at: new Date()
        })

        res.json({ code: 0, msg: 'success', data: { ling_code: newCode } })
    } catch (err) {
        next(err)
    }
})

module.exports = router

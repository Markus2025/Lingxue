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
                school: user.school,
                major: user.major,
                grade: user.grade,
                location: user.location,
                ling_code: user.ling_code,
                edu_verified: user.edu_verified,
                real_name_verified: user.real_name_verified,
                is_new: !user.nickname
            }
        })
    } catch (err) {
        next(err)
    }
})

// GET /api/user/profile - 获取当前用户资料
router.get('/profile', auth, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.json({ code: 1003, msg: '用户不存在' })
        }

        // 过滤敏感字段
        const { phone, wechat_id, ...safeUser } = req.user
        res.json({ code: 0, msg: 'success', data: safeUser })
    } catch (err) {
        next(err)
    }
})

// PUT /api/user/profile - 更新用户资料
router.put('/profile', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const allowedFields = ['nickname', 'avatar', 'phone', 'wechat_id', 'gender', 'school', 'major', 'grade', 'location']
        const updateData = {}

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field]
            }
        })

        updateData.updated_at = new Date()

        await db('users').where({ openid: req.openid }).update(updateData)

        const user = await db('users').where({ openid: req.openid }).first()
        const { phone, wechat_id, ...safeUser } = user
        res.json({ code: 0, msg: 'success', data: safeUser })
    } catch (err) {
        next(err)
    }
})

// POST /api/user/verify-edu - 教育邮箱认证
router.post('/verify-edu', auth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { email, code } = req.body

        if (!email || !code) {
            return res.json({ code: 1001, msg: '请填写完整信息' })
        }

        // 验证邮箱格式（必须是 .edu / .edu.cn 结尾）
        const eduPattern = /\.(edu|edu\.cn|ac\.cn)$/i
        if (!eduPattern.test(email)) {
            return res.json({ code: 1002, msg: '请使用教育邮箱' })
        }

        // TODO: 对接真实邮箱验证码服务
        // 目前 MVP 阶段直接通过

        await db('users').where({ openid: req.openid }).update({
            edu_verified: 1,
            edu_email: email,
            updated_at: new Date()
        })

        res.json({ code: 0, msg: '认证成功' })
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

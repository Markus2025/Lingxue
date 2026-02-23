const express = require('express')
const router = express.Router()
const { optionalAuth } = require('../middleware/auth')
const logger = require('../config/logger')

// POST /api/ai/search — AI 智能搜索
router.post('/search', optionalAuth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { query } = req.body

        if (!query || !query.trim()) {
            return res.json({ code: 400, msg: '请输入搜索内容' })
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return res.status(500).json({ code: 500, msg: 'AI 服务未配置' })
        }

        const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

        // 系统提示词：让 AI 理解业务场景并返回结构化筛选条件
        const systemPrompt = `你是一个大学生技能互助平台「邻学」的智能搜索引擎。用户会用自然语言描述他们想找的人或服务。

数据库中每张卡片有以下字段：
- skills: JSON数组，每项有 {id, name, type}。id 是筛选用的唯一标识
- region: 城市名（如"杭州"、"北京"）
- price_min: 价格（整数，0 表示免费）
- mode_online: 是否线上
- mode_offline: 是否线下
- bio: 个人简介
- slogan: 一句话介绍

可用的技能 id 和名称（这些是平台上所有分类）：
academic: math1=数学与应用数学, cs1=计算机科学与技术, cs2=软件工程, phy1=物理学, chem1=化学, econ2=金融学, biz2=会计学, law1=法学, med1=临床医学, edu1=教育学, lit1=汉语言文学, lit2=新闻学, fl1=英语, artd2=美术学
global: exam1=雅思, exam2=托福, exam4=四六级, exam5=考研英语, oral1=英语口语陪练, min1=日语, min2=韩语, abroad1=选校定位咨询, abroad2=文书/PS辅导
tech: dev1=后端开发, dev2=前端开发, dev3=移动端开发, dev4=游戏开发, ai1=AI工具应用, ai2=数据分析, des1=平面设计, des2=UI/UX设计, des3=视频剪辑
arts: inst1=钢琴, inst2=吉他, inst5=古筝, vocal1=流行唱法, paint1=素描, paint2=水彩, paint4=书法, paint5=iPad插画
sports: ball1=网球, ball2=羽毛球, ball3=篮球, ball5=足球, fit1=健身陪练, fit2=瑜伽, out1=游泳
life: life1=美妆护肤, life2=穿搭指导, life3=驾驶陪练, life4=摄影跟拍, play1=游戏搭子, play8=剧本杀DM

你的任务是：
1. 理解用户的需求
2. 生成搜索分析步骤（用于展示"思考过程"给用户看）
3. 返回结构化的SQL筛选条件

请严格按照以下 JSON 格式返回（不要包含markdown标记）：
{
  "steps": ["分析步骤1", "分析步骤2", "分析步骤3"],
  "filters": {
    "skill_ids": ["id1", "id2"],
    "region": "城市名或null",
    "max_price": 数字或null,
    "mode": "online/offline/null",
    "keyword": "用于全文搜索bio/slogan的关键词或null"
  }
}`

        // 调用 Gemini API
        const fetch = require('node-fetch')
        const geminiRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + '\n\n用户搜索：' + query }] }
                ],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024
                }
            })
        })

        if (!geminiRes.ok) {
            const errText = await geminiRes.text()
            logger.error('Gemini API 错误:', errText)
            return res.status(502).json({ code: 502, msg: 'AI 服务暂时不可用' })
        }

        const geminiData = await geminiRes.json()
        const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // 解析 AI 返回的 JSON
        let aiResult
        try {
            // 去除可能的 markdown 代码块标记
            const cleanText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            aiResult = JSON.parse(cleanText)
        } catch (e) {
            logger.error('AI 返回解析失败:', aiText)
            // 降级为普通全文搜索
            aiResult = {
                steps: ['正在分析您的需求...', '使用关键词进行搜索'],
                filters: { keyword: query, skill_ids: [], region: null, max_price: null, mode: null }
            }
        }

        // 构建数据库查询
        const { filters, steps } = aiResult
        let dbQuery = db('cards')
            .join('users', 'cards.user_id', 'users.id')
            .whereNull('cards.deleted_at')
            .where('cards.status', 'active')
            .select(
                'cards.*',
                'users.nickname', 'users.avatar', 'users.school',
                'users.major', 'users.grade', 'users.location', 'users.edu_verified'
            )

        // 技能 ID 筛选
        if (filters.skill_ids && filters.skill_ids.length > 0) {
            dbQuery = dbQuery.where(function () {
                for (const sid of filters.skill_ids) {
                    this.orWhereRaw(
                        `JSON_SEARCH(cards.skills, 'one', ?, NULL, '$[*].id') IS NOT NULL`,
                        [sid]
                    )
                }
            })
        }

        // 地区筛选
        if (filters.region) {
            dbQuery = dbQuery.where('cards.region', 'like', `%${filters.region}%`)
        }

        // 价格筛选
        if (filters.max_price !== null && filters.max_price !== undefined) {
            dbQuery = dbQuery.where('cards.price_min', '<=', parseInt(filters.max_price))
        }

        // 授课模式筛选
        if (filters.mode === 'online') dbQuery = dbQuery.where('cards.mode_online', true)
        if (filters.mode === 'offline') dbQuery = dbQuery.where('cards.mode_offline', true)

        // 全文关键词搜索
        if (filters.keyword) {
            dbQuery = dbQuery.where(function () {
                this.where('cards.bio', 'like', `%${filters.keyword}%`)
                    .orWhere('cards.slogan', 'like', `%${filters.keyword}%`)
                    .orWhere('users.nickname', 'like', `%${filters.keyword}%`)
            })
        }

        const results = await dbQuery.limit(30)

        res.json({
            code: 0,
            msg: 'success',
            data: {
                steps: steps || [],
                query,
                filters,
                total: results.length,
                list: results
            }
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router

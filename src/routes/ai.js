const express = require('express')
const router = express.Router()
const { optionalAuth } = require('../middleware/auth')
const logger = require('../config/logger')

/**
 * POST /api/ai/search — 智能搜索（AI + 传统双模式）
 * 
 * 策略：
 * 1. 先尝试 AI 搜索（Gemini API）
 * 2. 如果 AI 不可用（无 Key / 网络不通 / 解析失败），自动降级为传统关键词搜索
 * 3. 返回 { mode: 'ai' | 'traditional' } 让前端知道用了哪种
 */
router.post('/search', optionalAuth, async (req, res, next) => {
    try {
        const db = require('../config/db')
        const { query } = req.body

        if (!query || !query.trim()) {
            return res.json({ code: 400, msg: '请输入搜索内容' })
        }

        const keyword = query.trim()
        let mode = 'traditional'  // 默认传统模式
        let steps = []
        let filters = null

        // ========== 第一步：尝试 AI 搜索 ==========
        const apiKey = process.env.GEMINI_API_KEY
        if (apiKey) {
            try {
                const aiResult = await callGeminiSearch(keyword, apiKey)
                if (aiResult) {
                    mode = 'ai'
                    steps = aiResult.steps || []
                    filters = aiResult.filters
                    logger.info(`AI 搜索成功, filters: ${JSON.stringify(filters)}`)
                }
            } catch (aiErr) {
                logger.warn(`AI 搜索失败，降级到传统搜索: ${aiErr.message}`)
                // 静默降级，不抛错
            }
        } else {
            logger.info('GEMINI_API_KEY 未配置，使用传统搜索')
        }

        // ========== 第二步：构建数据库查询 ==========
        let dbQuery = db('cards')
            .join('users', 'cards.user_id', 'users.id')
            .whereNull('cards.deleted_at')
            .where('cards.status', 'active')
            .select(
                'cards.*',
                'users.nickname', 'users.avatar', 'users.school',
                'users.major', 'users.grade', 'users.location', 'users.edu_verified'
            )

        if (mode === 'ai' && filters) {
            // ---- AI 模式：使用结构化筛选条件 ----
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

            // 地区
            if (filters.region) {
                dbQuery = dbQuery.where('cards.region', 'like', `%${filters.region}%`)
            }

            // 价格
            if (filters.max_price !== null && filters.max_price !== undefined) {
                dbQuery = dbQuery.where('cards.price_min', '<=', parseInt(filters.max_price))
            }

            // 授课模式
            if (filters.mode === 'online') dbQuery = dbQuery.where('cards.mode_online', true)
            if (filters.mode === 'offline') dbQuery = dbQuery.where('cards.mode_offline', true)

            // 关键词补充
            if (filters.keyword) {
                dbQuery = dbQuery.where(function () {
                    this.where('cards.bio', 'like', `%${filters.keyword}%`)
                        .orWhere('cards.slogan', 'like', `%${filters.keyword}%`)
                        .orWhere('users.nickname', 'like', `%${filters.keyword}%`)
                })
            }
        } else {
            // ---- 传统模式：多字段 LIKE 模糊匹配 ----
            steps = [
                '正在搜索相关内容...',
                '匹配技能、简介和用户信息...',
                '整理搜索结果...'
            ]

            // 分词：简单按空格/逗号分开
            const keywords = keyword.split(/[\s,，、]+/).filter(k => k.length > 0)

            dbQuery = dbQuery.where(function () {
                for (const kw of keywords) {
                    this.orWhere('cards.bio', 'like', `%${kw}%`)
                        .orWhere('cards.slogan', 'like', `%${kw}%`)
                        .orWhere('users.nickname', 'like', `%${kw}%`)
                        .orWhere('users.school', 'like', `%${kw}%`)
                        .orWhere('users.major', 'like', `%${kw}%`)
                        .orWhere('cards.region', 'like', `%${kw}%`)
                        .orWhereRaw(
                            `JSON_SEARCH(cards.skills, 'one', ?, NULL, '$[*].name') IS NOT NULL`,
                            [kw]
                        )
                }
            })
        }

        const results = await dbQuery.limit(30)

        res.json({
            code: 0,
            msg: 'success',
            data: {
                mode,      // 'ai' 或 'traditional'
                steps,
                query: keyword,
                filters,
                total: results.length,
                list: results
            }
        })
    } catch (err) {
        next(err)
    }
})

/**
 * 调用 Gemini API 做搜索意图解析
 * 返回 { steps: string[], filters: object } 或 null
 */
async function callGeminiSearch(query, apiKey) {
    const fetch = require('node-fetch')
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const systemPrompt = `你是「邻学」平台的智能搜索引擎。用户用自然语言描述想找的人或服务。

数据库卡片有以下字段:
- skills: JSON数组, 每项 {id, name, type}
- region: 城市名(北京/上海/杭州等)
- price_min: 整数价格(0=免费)
- mode_online/mode_offline: 授课模式
- bio/slogan: 个人简介

可用技能ID(部分):
academic: math1=数学, cs1=计算机科学, cs2=软件工程, phy1=物理, econ2=金融, biz2=会计, law1=法学, med1=临床医学, fl1=英语, lit1=汉语言文学
global: exam1=雅思, exam2=托福, exam4=四六级, exam5=考研英语, oral1=英语口语陪练, min1=日语, min2=韩语
tech: dev1=后端开发, dev2=前端开发, ai1=AI工具, ai2=数据分析, des1=平面设计, des2=UI/UX设计, des3=视频剪辑
arts: inst1=钢琴, inst2=吉他, inst5=古筝, vocal1=流行唱法, paint1=素描, paint4=书法
sports: ball1=网球, ball2=羽毛球, ball3=篮球, fit1=健身陪练, fit2=瑜伽, out1=游泳
life: life1=美妆, life3=驾驶陪练, life4=摄影跟拍, play1=游戏搭子, play8=剧本杀DM

任务:
1. 理解用户需求
2. 生成3条简短分析步骤
3. 返回结构化筛选条件

严格返回JSON(无markdown):
{"steps":["步骤1","步骤2","步骤3"],"filters":{"skill_ids":["id"],"region":"城市或null","max_price":数字或null,"mode":"online/offline或null","keyword":"关键词或null"}}`

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + '\n\n用户搜索：' + query }] }
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
        }),
        timeout: 10000  // 10 秒超时
    })

    if (!response.ok) {
        throw new Error(`Gemini API HTTP ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // 解析 JSON
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanText)
}

module.exports = router

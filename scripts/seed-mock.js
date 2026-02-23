// scripts/seed-mock.js
/**
 * 邻学 - Mock数据生成脚本
 * 用于生成 500 个逼真的带有三步走策略但无实际联系方式的用户和卡片数据
 * 
 * 运行方式: node scripts/seed-mock.js (需要在有.env的环境下或云托管容器中)
 */

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: __dirname + '/../.env' });
}

const db = require('../src/config/db');

// 数据池
const CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州',
    '天津', '重庆', '长沙', '郑州', '青岛', '东莞', '宁波', '无锡', '合肥', '济南',
    '佛山', '福州', '泉州', '大连', '南通', '常州', '徐州', '沈阳', '温州', '长春',
    '哈尔滨', '石家庄', '南宁', '昆明', '南昌', '贵阳', '大庆', '洛阳', '廊坊', '嘉兴',
    '扬州', '厦门', '绍兴', '台州', '金华', '湛江', '保定', '临沂', '盐城', '泰州',
    '海口', '珠海', '洛阳', '乌鲁木齐', '兰州', '呼和浩特', '银川', '西宁', '三亚', '桂林'
];

const UNIVERSITIES = [
    '清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中国科学技术大学',
    '武汉大学', '中山大学', '哈尔滨工业大学', '西安交通大学', '四川大学', '华中科技大学', '同济大学',
    '北京师范大学', '中国人民大学', '南开大学', '天津大学', '东南大学', '中南大学', '吉林大学',
    '北京航空航天大学', '西北工业大学', '中国社会科学院大学', '中央财经大学', '上海财经大学',
    '北京外国语大学', '上海外国语大学', '中国传媒大学', '北京邮电大学', '北京交通大学', '重庆大学',
    '电子科技大学', '大连理工大学', '山东大学', '厦门大学', '湖南大学', '华南理工大学'
];

const MAJORS = [
    '计算机科学与技术', '软件工程', '临床医学', '法学', '汉语言文学', '金融学', '会计学', '外语（英/小语种）',
    '数学与应用数学', '物理学', '化学', '生物科学', '心理学', '新闻学', '建筑学', '土木工程',
    '机械工程', '电气工程', '材料科学与工程', '环境工程', '艺术设计', '音乐表演', '体育教育'
];

const GRADES = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士在读', '已毕业'];

const BIOS = [
    '性格超级好，非常有耐心，平时喜欢弹吉他。如果你也喜欢音乐就更好了~ 可以教你如何从零开始。',
    '高考理综280+，数学140+。带过两届高三，对基础薄弱的学生有自己的一套方法。不严厉，主打亦师亦友。',
    '热爱网球，国家二级运动员。如果你想纠正动作或者找个高质量的陪练，找我准没错。',
    '学长脾气有点急，但是讲课绝对干货满满。只带冲刺提分的，如果只是想随便学学请勿扰。',
    '擅长少儿编程（Scratch/Python）。带过机构大班，现在想自己出来做，一对一效果更好。',
    '四六级 600+，雅思 7.5。平时可以一起练口语。不需要你基础很好，只要敢说就行！',
    '美院在读，曾获全省速写一等奖。可以带零基础素描，或者帮你准备艺考。',
    '很随和的女大学生，理科思维比较强。擅长初中全科辅导，或者是高中的数理化。周末有空。',
    '平时社团活动比较多，但承诺的上课时间绝对不鸽。教小孩子有一套，能让他们坐得住。',
    '只教真正的干货，没有套路。适合想快速掌握一门技能的朋友。'
];

const SLOGANS = [
    '耐心满分，亦师亦友', '硬核提分，不讲废话', '带你体验学习的乐趣',
    '专业陪跑，共同成长', '零基础也能轻松掌握', '让成绩稳步提升'
];

const SKILL_POOLS = [
    [{ name: '高中数学', type: 'teaching' }, { name: '作业辅导', type: 'accompaniment' }],
    [{ name: '英语口语', type: 'teaching' }, { name: '雅思备考', type: 'teaching' }],
    [{ name: '网球陪练', type: 'accompaniment' }, { name: '体能训练', type: 'teaching' }],
    [{ name: '钢琴启蒙', type: 'teaching' }, { name: '乐理基础', type: 'teaching' }],
    [{ name: 'Python编程', type: 'teaching' }, { name: '少儿编程', type: 'teaching' }],
    [{ name: '初中全科', type: 'accompaniment' }, { name: '心理疏导', type: 'accompaniment' }],
    [{ name: '素描色彩', type: 'teaching' }]
];

const TAGS_POOL = ['接梗达人', '早起冠军', 'MBTI: ENFP', '深夜网抑云', '猫奴', '资深吃货', '运动狂魔', '拖延症克星', '耐心LvMAX', '社恐一枚'];

const DIMENSIONS_NAMES = ['耐心度', '专业度', '亲和力', '严格度', '趣味性', '准时率', '幽默感', '沟通力'];

const QA_POOL = [
    { q: '是否可以接受线上授课？', a: true },
    { q: '是否能够提供安静的学习环境？', a: true },
    { q: '上课期间能保持专注吗？', a: true },
    { q: '是否接受每次课后留作业？', a: true },
    { q: '是否接受价格在标价基础上浮动10%？', a: true }
];

const PRE_TAGS_POOL = [
    '✅ 接受免费试讲15分钟', '❌ 不接受临时改时间', '✅ 提供详细课后反馈', '✅ 985/211在校生',
    '❌ 不包过级', '✅ 接受零基础', '✅ 可按次付费'
];

// 辅助函数
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSample = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};
const generateRandomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

async function runSeeder() {
    console.log('🌱 开始生成 Mock 数据...');

    try {
        console.log('🗑️ 正在查找旧的 Mock 数据...');
        const oldUsers = await db('users').where('openid', 'like', 'mock%').select('id');
        if (oldUsers.length > 0) {
            console.log(`🗑️ 找到 ${oldUsers.length} 条旧数据，开始分批清理...`);
            const oldUserIds = oldUsers.map(u => u.id);
            for (let i = 0; i < oldUserIds.length; i += 100) {
                const batchIds = oldUserIds.slice(i, i + 100);
                await db('cards').whereIn('user_id', batchIds).del();
                await db('users').whereIn('id', batchIds).del();
            }
        }
        console.log('✅ 清理完毕，开始批量写入新数据...');

        const TOTAL = 500;
        const BATCH_SIZE = 50;
        const currentRunId = Date.now().toString().slice(-6);

        for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
            const userObjs = [];
            const openIds = [];

            for (let i = 1; i <= BATCH_SIZE; i++) {
                const index = batch + i;
                const userIdRaw = `mock_${currentRunId}_${String(index).padStart(3, '0')}`;
                const gender = randomInt(1, 2);

                const INTERNET_NAMES = [
                    '一只小废柴', '起名字好难', '学习使我快乐', '退堂鼓表演艺术家', '熬夜秃头小宝贝',
                    '早起毁一天', '我不吃香菜', '快乐的小胖纸', '减肥失败的一天', '努力搬砖的汪',
                    '没有感情的刷题机器', '在知识的海洋里溺水', '想要一杯奶茶', '今天也要加油鸭', '不想起床',
                    '薛定谔的猫', '光合作用', '地球原住民', '普通市民小X', '在逃公主',
                    '宇宙第一可爱', '是你的小甜甜呀', '有点酷的女孩', '冷漠脸', '别说话吻我',
                    '暴走萝莉', '佛系青年', '随遇而安', '心如止水', '看透一切',
                    '代码敲击者', 'BUG制造机', 'CV工程师', '脱发主力军', '秃头披风侠',
                    '深夜EMO选手', '不瘦十斤不换头像', '这辈子都不可能早睡', '明天再说', '随便吧'
                ];

                const PROFESSIONS = ['学姐', '学长', '老师', '同学', '教练', '大大', '大佬'];
                const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';

                let nickname = '';
                const nameType = Math.random();

                if (nameType < 0.6) {
                    nickname = randomEl(INTERNET_NAMES);
                    if (Math.random() > 0.5) {
                        const emojis = ['✨', '🔥', '🐾', '🌸', '🍉', '👻', '👾', '🚀', '💡', '🎵'];
                        nickname += ' ' + randomEl(emojis);
                    }
                } else if (nameType < 0.85) {
                    nickname = randomEl(surnames.split('')) + randomEl(PROFESSIONS);
                } else {
                    const names = '伟芳娜秀英敏静丽强磊军洋勇艳杰娟涛明超秀兰霞平刚桂英';
                    nickname = randomEl(surnames.split('')) + randomEl(names.split('')) + (Math.random() > 0.5 ? randomEl(names.split('')) : '');
                }

                // --------- 多元化头像生成 ---------
                const avatarChance = Math.random();
                let avatarUrl = '';
                if (avatarChance < 0.25) {
                    // 25% 真人占位图
                    avatarUrl = `https://i.pravatar.cc/300?u=${userIdRaw}`;
                } else if (avatarChance < 0.5) {
                    // 25% 像素风格基础款
                    avatarUrl = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${userIdRaw}`;
                } else {
                    // 50% 插画风、二次元动漫风、电影感 (使用 DiceBear 优质库)
                    const dicebearStyles = ['adventurer', 'avataaars', 'lorelei', 'micah', 'notionists', 'personas', 'croodles'];
                    const style = randomEl(dicebearStyles);
                    avatarUrl = `https://api.dicebear.com/8.x/${style}/svg?seed=${userIdRaw}`;
                }

                userObjs.push({
                    openid: userIdRaw,
                    nickname: nickname,
                    avatar: avatarUrl,
                    gender: gender,
                    phone: null,
                    wechat_id: null,
                    school: randomEl(UNIVERSITIES),
                    major: randomEl(MAJORS),
                    grade: randomEl(GRADES),
                    location: randomEl(CITIES),
                    ling_code: generateRandomId(),
                    edu_verified: Math.random() < 0.3 ? 1 : 0,
                    status: 'active',
                    created_at: new Date()
                });
                openIds.push(userIdRaw);
            }

            // 批量插入用户
            await db('users').insert(userObjs);

            // 获取刚插入的用户的自增 ID
            const insertedUsers = await db('users').whereIn('openid', openIds).select('id', 'location');

            const cardObjs = [];
            for (let user of insertedUsers) {
                const isDetailed = Math.random() < 0.6;
                const priceBase = randomInt(50, 300);

                const cardObj = {
                    user_id: user.id,
                    bio: isDetailed ? randomEl(BIOS) : (Math.random() > 0.5 ? '欢迎联系我！' : null),
                    slogan: isDetailed ? randomEl(SLOGANS) : null,
                    skills: JSON.stringify(randomEl(SKILL_POOLS)),
                    tags: JSON.stringify(randomSample(TAGS_POOL, randomInt(2, 5))),
                    price_min: isDetailed ? priceBase : 0,
                    price_max: isDetailed ? priceBase + 50 : 0,
                    mode_online: Math.random() > 0.5 ? 1 : 0,
                    mode_offline: Math.random() > 0.5 ? 1 : 0,
                    region: user.location,
                    contact_questions: JSON.stringify(randomSample(QA_POOL, randomInt(1, 3))),
                    pre_answered_tags: JSON.stringify(randomSample(PRE_TAGS_POOL, randomInt(1, 4))),
                    view_count: randomInt(10, 500),
                    contact_count: randomInt(0, 50),
                    favorite_count: randomInt(0, 100),
                    status: 'active',
                    created_at: new Date()
                };

                if (isDetailed) {
                    const dims = randomSample(DIMENSIONS_NAMES, 5).map(name => ({ name, value: randomInt(4, 5) }));
                    cardObj.dimensions = JSON.stringify(dims);
                    cardObj.time_slots = JSON.stringify([
                        { dayIndex: randomInt(4, 6), startTime: '09:00', endTime: '12:00' },
                        { dayIndex: randomInt(4, 6), startTime: '14:00', endTime: '18:00' }
                    ]);
                    cardObj.teaching_format = '一对一辅导';
                    cardObj.service_name = '精品陪练/辅导';
                } else {
                    cardObj.dimensions = JSON.stringify([]);
                    cardObj.time_slots = JSON.stringify([]);
                    cardObj.teaching_format = '';
                    cardObj.service_name = '';
                }

                if (!cardObj.mode_online && !cardObj.mode_offline) cardObj.mode_online = 1;

                cardObjs.push(cardObj);
            }

            // 批量插入卡片
            if (cardObjs.length > 0) {
                await db('cards').insert(cardObjs);
            }
            console.log(`...已生成 ${batch + BATCH_SIZE} 条记录`);
        }
    } catch (e) {
        console.error('❌ 数据清理或生成过程中报错：', e);
        process.exit(1);
    }

    console.log('✅ 500条Mock数据生成完毕！所有用户的 wechat_id 均为空，随时可演示『通知Ta补充』流程。');
    process.exit(0);
}

runSeeder().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
});

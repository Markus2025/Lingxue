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

    // 生成 500 次
    for (let i = 1; i <= 500; i++) {
        const isDetailed = Math.random() < 0.6; // 60% 充实卡片，40%简略

        // 1. 生成用户数据
        const userIdRaw = `mock_user_${String(i).padStart(3, '0')}`;
        const gender = randomInt(1, 2);

        // 随机中文名生成逻辑简化版
        const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';
        const names = '伟芳娜秀英敏静丽强磊军洋勇艳杰娟涛明超秀兰霞平刚桂英';
        const nickname = randomEl(surnames.split('')) + randomEl(names.split('')) + (Math.random() > 0.5 ? randomEl(names.split('')) : '');

        const userObj = {
            openid: userIdRaw,
            nickname: nickname,
            // Pravatar 提供真人占位头像
            avatar: `https://i.pravatar.cc/300?u=${userIdRaw}`,
            gender: gender,
            // **关键：清空真实的联系方式，用来触发“通知补充”闭环**
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
        };

        const [userId] = await db('users').insert(userObj);

        // 2. 生成卡片数据
        const priceBase = randomInt(50, 300);

        const cardObj = {
            user_id: userId,
            bio: isDetailed ? randomEl(BIOS) : (Math.random() > 0.5 ? '欢迎联系我！' : null),
            slogan: isDetailed ? randomEl(SLOGANS) : null,
            skills: JSON.stringify(randomEl(SKILL_POOLS)),
            tags: JSON.stringify(randomSample(TAGS_POOL, randomInt(2, 5))),
            price_min: isDetailed ? priceBase : 0,
            price_max: isDetailed ? priceBase + 50 : 0,
            mode_online: Math.random() > 0.5 ? 1 : 0,
            mode_offline: Math.random() > 0.5 ? 1 : 0,
            region: userObj.location,

            // 组装“三步走”所需过滤和标签数据
            contact_questions: JSON.stringify(randomSample(QA_POOL, randomInt(1, 3))),
            pre_answered_tags: JSON.stringify(randomSample(PRE_TAGS_POOL, randomInt(1, 4))),

            // 初始化浏览等数据，制造活跃度
            view_count: randomInt(10, 500),
            contact_count: randomInt(0, 50),
            favorite_count: randomInt(0, 100),
            status: 'active',
            created_at: new Date()
        };

        // 处理详略差别
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

        // 保证线上线下至少含一个
        if (!cardObj.mode_online && !cardObj.mode_offline) cardObj.mode_online = 1;

        await db('cards').insert(cardObj);

        if (i % 50 === 0) {
            console.log(`...已生成 ${i} 条记录`);
        }
    }

    console.log('✅ 500条Mock数据生成完毕！所有用户的 wechat_id 均为空，随时可演示『通知Ta补充』流程。');
    process.exit(0);
}

runSeeder().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
});

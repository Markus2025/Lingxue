// scripts/seed-mock.js
/**
 * 邻学 - Mock数据生成脚本 v3
 * 用于生成 500 个逼真的数据，skills 与前端筛选栏完全对齐
 * 
 * 运行方式: node scripts/seed-mock.js (需要在有.env的环境下或云托管容器中)
 */

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: __dirname + '/../.env' });
}

const db = require('../src/config/db');

// ============= 前端筛选栏完全对齐的技能池 =============
// 每个 item 的 id 与 filter-tabs/index.js 中的 id 完全一致
const SKILL_ITEMS = [
    // 大学学业与考研
    { id: 'math1', name: '数学与应用数学', category: 'academic' },
    { id: 'math2', name: '信息与计算科学', category: 'academic' },
    { id: 'math3', name: '统计学', category: 'academic' },
    { id: 'phy1', name: '物理学', category: 'academic' },
    { id: 'phy2', name: '应用物理学', category: 'academic' },
    { id: 'chem1', name: '化学', category: 'academic' },
    { id: 'chem2', name: '应用化学', category: 'academic' },
    { id: 'cs1', name: '计算机科学与技术', category: 'academic' },
    { id: 'cs2', name: '软件工程', category: 'academic' },
    { id: 'cs3', name: '网络工程', category: 'academic' },
    { id: 'cs4', name: '信息安全', category: 'academic' },
    { id: 'ee1', name: '电子信息工程', category: 'academic' },
    { id: 'ee2', name: '通信工程', category: 'academic' },
    { id: 'ee3', name: '电气工程及其自动化', category: 'academic' },
    { id: 'mech1', name: '机械设计制造及其自动化', category: 'academic' },
    { id: 'mech2', name: '车辆工程', category: 'academic' },
    { id: 'civil1', name: '土木工程', category: 'academic' },
    { id: 'civil2', name: '建筑学', category: 'academic' },
    { id: 'agro1', name: '农学', category: 'academic' },
    { id: 'agro4', name: '动物医学', category: 'academic' },
    { id: 'econ1', name: '经济学', category: 'academic' },
    { id: 'econ2', name: '金融学', category: 'academic' },
    { id: 'econ3', name: '国际经济与贸易', category: 'academic' },
    { id: 'biz1', name: '工商管理', category: 'academic' },
    { id: 'biz2', name: '会计学', category: 'academic' },
    { id: 'biz3', name: '财务管理', category: 'academic' },
    { id: 'law1', name: '法学', category: 'academic' },
    { id: 'law2', name: '知识产权', category: 'academic' },
    { id: 'edu1', name: '教育学', category: 'academic' },
    { id: 'edu2', name: '学前教育', category: 'academic' },
    { id: 'edu4', name: '体育教育', category: 'academic' },
    { id: 'lit1', name: '汉语言文学', category: 'academic' },
    { id: 'lit2', name: '新闻学', category: 'academic' },
    { id: 'lit5', name: '网络与新媒体', category: 'academic' },
    { id: 'fl1', name: '英语', category: 'academic' },
    { id: 'fl2', name: '日语', category: 'academic' },
    { id: 'fl3', name: '翻译', category: 'academic' },
    { id: 'med1', name: '临床医学', category: 'academic' },
    { id: 'med2', name: '护理学', category: 'academic' },
    { id: 'med5', name: '药学', category: 'academic' },
    { id: 'artd1', name: '音乐表演', category: 'academic' },
    { id: 'artd2', name: '美术学', category: 'academic' },
    { id: 'artd3', name: '视觉传达设计', category: 'academic' },

    // 语言与全球化
    { id: 'abroad1', name: '选校定位咨询', category: 'global' },
    { id: 'abroad2', name: '文书/PS辅导', category: 'global' },
    { id: 'abroad3', name: '面试模拟', category: 'global' },
    { id: 'exam1', name: '雅思', category: 'global' },
    { id: 'exam2', name: '托福', category: 'global' },
    { id: 'exam3', name: 'GRE/GMAT', category: 'global' },
    { id: 'exam4', name: '四六级', category: 'global' },
    { id: 'exam5', name: '考研英语', category: 'global' },
    { id: 'min1', name: '日语', category: 'global' },
    { id: 'min2', name: '韩语', category: 'global' },
    { id: 'min3', name: '法语', category: 'global' },
    { id: 'min4', name: '德语', category: 'global' },
    { id: 'min5', name: '西班牙语', category: 'global' },
    { id: 'oral1', name: '英语口语陪练', category: 'global' },
    { id: 'oral2', name: '商务英语', category: 'global' },

    // IT科技与软件
    { id: 'dev1', name: '后端开发', category: 'tech' },
    { id: 'dev2', name: '前端开发', category: 'tech' },
    { id: 'dev3', name: '移动端开发', category: 'tech' },
    { id: 'dev4', name: '游戏开发', category: 'tech' },
    { id: 'dev6', name: '全栈开发', category: 'tech' },
    { id: 'ai1', name: 'AI工具应用', category: 'tech' },
    { id: 'ai2', name: '数据分析', category: 'tech' },
    { id: 'ai3', name: '机器学习', category: 'tech' },
    { id: 'des1', name: '平面设计', category: 'tech' },
    { id: 'des2', name: 'UI/UX设计', category: 'tech' },
    { id: 'des3', name: '视频剪辑', category: 'tech' },
    { id: 'des4', name: '3D建模与渲染', category: 'tech' },
    { id: 'des6', name: '插画设计', category: 'tech' },

    // 艺术修养
    { id: 'inst1', name: '钢琴', category: 'arts' },
    { id: 'inst2', name: '吉他', category: 'arts' },
    { id: 'inst3', name: '尤克里里', category: 'arts' },
    { id: 'inst4', name: '小提琴', category: 'arts' },
    { id: 'inst5', name: '古筝', category: 'arts' },
    { id: 'inst6', name: '架子鼓', category: 'arts' },
    { id: 'vocal1', name: '流行唱法', category: 'arts' },
    { id: 'vocal2', name: 'KTV技巧', category: 'arts' },
    { id: 'vocal5', name: '乐理知识', category: 'arts' },
    { id: 'paint1', name: '素描', category: 'arts' },
    { id: 'paint2', name: '水彩', category: 'arts' },
    { id: 'paint4', name: '书法', category: 'arts' },
    { id: 'paint5', name: 'iPad插画', category: 'arts' },
    { id: 'paint6', name: '摄影后期', category: 'arts' },

    // 运动健康
    { id: 'ball1', name: '网球', category: 'sports' },
    { id: 'ball2', name: '羽毛球', category: 'sports' },
    { id: 'ball3', name: '篮球', category: 'sports' },
    { id: 'ball4', name: '乒乓球', category: 'sports' },
    { id: 'ball5', name: '足球', category: 'sports' },
    { id: 'ball8', name: '匹克球', category: 'sports' },
    { id: 'fit1', name: '健身陪练', category: 'sports' },
    { id: 'fit2', name: '瑜伽', category: 'sports' },
    { id: 'fit4', name: '跑步伴跑', category: 'sports' },
    { id: 'fit5', name: '减脂指导', category: 'sports' },
    { id: 'out1', name: '游泳', category: 'sports' },
    { id: 'out2', name: '滑板', category: 'sports' },
    { id: 'out4', name: '飞盘', category: 'sports' },
    { id: 'out5', name: '骑行', category: 'sports' },

    // 生活与综合技能
    { id: 'life1', name: '美妆护肤', category: 'life' },
    { id: 'life2', name: '穿搭指导', category: 'life' },
    { id: 'life3', name: '驾驶陪练', category: 'life' },
    { id: 'life4', name: '摄影跟拍', category: 'life' },
    { id: 'life5', name: '修图P图', category: 'life' },
    { id: 'play1', name: '游戏搭子', category: 'life' },
    { id: 'play2', name: '围棋象棋', category: 'life' },
    { id: 'play4', name: '塔罗占卜', category: 'life' },
    { id: 'play5', name: '旅行攻略', category: 'life' },
    { id: 'play6', name: '探店搭子', category: 'life' },
    { id: 'play7', name: '宠物寄养/遛狗', category: 'life' },
    { id: 'play8', name: '剧本杀DM', category: 'life' }
];

// 数据池
const CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '苏州',
    '天津', '重庆', '长沙', '郑州', '青岛', '东莞', '宁波', '无锡', '合肥', '济南',
    '佛山', '福州', '泉州', '大连', '南通', '常州', '徐州', '沈阳', '温州', '长春',
    '哈尔滨', '石家庄', '南宁', '昆明', '南昌', '贵阳', '厦门', '珠海', '三亚', '桂林'
];

const UNIVERSITIES = [
    '清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学', '中国科学技术大学',
    '武汉大学', '中山大学', '哈尔滨工业大学', '西安交通大学', '四川大学', '华中科技大学', '同济大学',
    '北京师范大学', '中国人民大学', '南开大学', '天津大学', '东南大学', '中南大学', '吉林大学',
    '北京航空航天大学', '西北工业大学', '中央财经大学', '上海财经大学',
    '北京外国语大学', '上海外国语大学', '中国传媒大学', '北京邮电大学', '重庆大学',
    '电子科技大学', '大连理工大学', '山东大学', '厦门大学', '湖南大学', '华南理工大学'
];

const MAJORS = [
    '计算机科学与技术', '软件工程', '临床医学', '法学', '汉语言文学', '金融学', '会计学', '英语',
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
    '只教真正的干货，没有套路。适合想快速掌握一门技能的朋友。',
    '资深游戏玩家，王者荣耀省服前50，可以带你上分也可以一起开黑玩耍。',
    '喜欢摄影和旅行，可以教你拍出高级感的照片，也可以帮你在校园里跟拍。',
    '瑜伽 RYT200 认证教练，可以带你入门或者一起日常练习。',
    '前新东方老师，现在全职做一对一辅导。主攻考研英语和雅思口语。'
];

const SLOGANS = [
    '耐心满分，亦师亦友', '硬核提分，不讲废话', '带你体验学习的乐趣',
    '专业陪跑，共同成长', '零基础也能轻松掌握', '让成绩稳步提升',
    '有趣有料，绝不枯燥', '认真负责，使命必达'
];

const TAGS_POOL = ['认真负责', '超有耐心', '风趣幽默', '逻辑清晰', '温柔亲切', '严格要求', '善于沟通', '经验丰富', '热情开朗', '细心体贴', '接梗达人', '佛系青年', '耐心LvMAX', '超级靠谱', '话多星人', '温和系'];

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

// 整数一口价池
const PRICE_POOL = [0, 0, 30, 50, 50, 80, 80, 100, 100, 120, 150, 150, 180, 200, 200, 250, 300];

const INTERNET_NAMES = [
    '一只小废柴', '起名字好难', '学习使我快乐', '退堂鼓表演艺术家', '熬夜秃头小宝贝',
    '早起毁一天', '我不吃香菜', '快乐的小胖纸', '减肥失败的一天', '努力搬砖的汪',
    '没有感情的刷题机器', '在知识的海洋里溺水', '想要一杯奶茶', '今天也要加油鸭', '不想起床',
    '薛定谔的猫', '光合作用', '地球原住民', '普通市民小X', '在逃公主',
    '宇宙第一可爱', '是你的小甜甜呀', '有点酷的女孩', '冷漠脸', '别说话吻我',
    '暴走萝莉', '佛系青年', '随遇而安', '心如止水', '看透一切',
    '代码敲击者', 'BUG制造机', 'CV工程师', '脱发主力军', '秃头披风侠',
    '深夜EMO选手', '不瘦十斤不换头像', '这辈子都不可能早睡', '明天再说', '随便吧',
    '摸鱼冠军', '划水小能手', '论文写不完', '考研上岸中', '实验室常驻居民'
];

const PROFESSIONS = ['学姐', '学长', '老师', '同学', '教练', '大大', '大佬'];
const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';

// 辅助函数
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSample = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
};
const generateRandomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

function generateCard(userId, filterItem, city) {
    const isAcademic = filterItem.id.match(/^[a-z]+[0-9]+$/) && !filterItem.id.match(/^(ai|des|life|play|fit|out|ball|inst|paint|vocal)[0-9]+$/);
    const tags = isAcademic
        ? randomSample(PRE_TAGS_POOL.filter(t => !t.includes('改时间')), 2)
        : randomSample(PRE_TAGS_POOL, 2);

    // 随机分配授课形式 (线上/线下)
    const modeRand = Math.random();
    let mode_online = false;
    let mode_offline = false;
    if (modeRand < 0.3) {
        mode_online = true;  // 仅线上 (30%)
    } else if (modeRand < 0.6) {
        mode_offline = true; // 仅线下 (30%)
    } else {
        mode_online = true;
        mode_offline = true; // 线上线下均可 (40%)
    }

    const isDetailed = Math.random() < 0.6;

    // ---- 从筛选栏项目池中随机抽取 1-3 个技能 ----
    const skillCount = randomInt(1, 3);
    const selectedSkills = randomSample(SKILL_ITEMS, skillCount).map(item => ({
        name: item.name,
        id: item.id,
        type: Math.random() > 0.4 ? 'teaching' : 'accompaniment'
    }));

    // ---- 整数一口价 ----
    const price = randomEl(PRICE_POOL);

    const cardObj = {
        user_id: userId,
        bio: isDetailed ? randomEl(BIOS) : (Math.random() > 0.5 ? '欢迎联系我！' : null),
        slogan: isDetailed ? randomEl(SLOGANS) : null,
        skills: JSON.stringify(selectedSkills),
        tags: JSON.stringify(randomSample(TAGS_POOL, randomInt(2, 5))),
        price_min: price,
        price_max: price,
        mode_online: mode_online ? 1 : 0,
        mode_offline: mode_offline ? 1 : 0,
        region: city,
        contact_questions: JSON.stringify(randomSample(QA_POOL, randomInt(1, 3))),
        pre_answered_tags: JSON.stringify(randomSample(PRE_TAGS_POOL, randomInt(1, 4))),
        view_count: randomInt(10, 500),
        contact_count: randomInt(0, 50),
        favorite_count: randomInt(0, 100),
        status: 'active',
        exposure: 0,
        created_at: new Date()
    };

    if (isDetailed) {
        const dims = randomSample(DIMENSIONS_NAMES, 5).map(name => ({ name, value: randomInt(4, 5) }));
        cardObj.dimensions = JSON.stringify(dims);
        cardObj.time_slots = JSON.stringify([
            { dayIndex: randomInt(0, 6), startTime: '09:00', endTime: '12:00' },
            { dayIndex: randomInt(0, 6), startTime: '14:00', endTime: '18:00' }
        ]);
        cardObj.teaching_format = '一对一辅导';
        cardObj.service_name = '精品陪练/辅导';
    } else {
        cardObj.dimensions = JSON.stringify([]);
        cardObj.time_slots = JSON.stringify([]);
        cardObj.teaching_format = '';
        cardObj.service_name = '';
    }

    return cardObj;
}

function generateNickname() {
    const nameType = Math.random();
    let nickname = '';

    if (nameType < 0.6) {
        nickname = randomEl(INTERNET_NAMES);
        if (Math.random() > 0.5) {
            const emojis = ['✨', '🔥', '🐾', '🌸', '🍉', '👻', '👾', '🚀', '💡', '🎵'];
            nickname += ' ' + randomEl(emojis);
        }
    } else if (nameType < 0.85) {
        nickname = randomEl(SURNAMES.split('')) + randomEl(PROFESSIONS);
    } else {
        const names = '伟芳娜秀英敏静丽强磊军洋勇艳杰娟涛明超秀兰霞平刚桂英';
        nickname = randomEl(SURNAMES.split('')) + randomEl(names.split('')) + (Math.random() > 0.5 ? randomEl(names.split('')) : '');
    }
    return nickname;
}

function generateAvatar(userIdRaw) {
    const avatarChance = Math.random();
    if (avatarChance < 0.25) {
        return `https://i.pravatar.cc/300?u=${userIdRaw}`;
    } else if (avatarChance < 0.5) {
        return `https://api.dicebear.com/8.x/pixel-art/svg?seed=${userIdRaw}`;
    } else {
        const styles = ['adventurer', 'avataaars', 'lorelei', 'micah', 'notionists', 'personas', 'croodles'];
        return `https://api.dicebear.com/8.x/${randomEl(styles)}/svg?seed=${userIdRaw}`;
    }
}

async function runSeeder() {
    console.log('🌱 开始生成 Mock 数据 v3（技能对齐筛选栏 + 整数一口价）...');

    try {
        // 1. 清理旧数据
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

        // 2. 生成数据
        const TOTAL = 500;
        const BATCH_SIZE = 50;
        const currentRunId = Date.now().toString().slice(-6);

        for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
            const userObjs = [];
            const openIds = [];

            for (let i = 1; i <= BATCH_SIZE; i++) {
                const index = batch + i;
                const userIdRaw = `mock_${currentRunId}_${String(index).padStart(3, '0')}`;

                userObjs.push({
                    openid: userIdRaw,
                    nickname: generateNickname(),
                    avatar: generateAvatar(userIdRaw),
                    gender: randomInt(1, 2),
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

                // ---- 从筛选栏项目池中随机抽取 1-3 个技能 ----
                const skillCount = randomInt(1, 3);
                const selectedSkills = randomSample(SKILL_ITEMS, skillCount).map(item => ({
                    name: item.name,
                    id: item.id,
                    type: Math.random() > 0.4 ? 'teaching' : 'accompaniment'
                }));

                // ---- 整数一口价 ----
                const price = randomEl(PRICE_POOL);

                const cardObj = {
                    user_id: user.id,
                    bio: isDetailed ? randomEl(BIOS) : (Math.random() > 0.5 ? '欢迎联系我！' : null),
                    slogan: isDetailed ? randomEl(SLOGANS) : null,
                    skills: JSON.stringify(selectedSkills),
                    tags: JSON.stringify(randomSample(TAGS_POOL, randomInt(2, 5))),
                    price_min: price,
                    price_max: price,
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
                        { dayIndex: randomInt(0, 6), startTime: '09:00', endTime: '12:00' },
                        { dayIndex: randomInt(0, 6), startTime: '14:00', endTime: '18:00' }
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

            if (cardObjs.length > 0) {
                await db('cards').insert(cardObjs);
            }
            console.log(`...已生成 ${batch + BATCH_SIZE} 条记录`);
        }
    } catch (e) {
        console.error('❌ 数据清理或生成过程中报错：', e);
        process.exit(1);
    }

    console.log('✅ 500 条 Mock 数据生成完毕！技能已对齐筛选栏，价格为整数一口价。');
    process.exit(0);
}

runSeeder().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
});

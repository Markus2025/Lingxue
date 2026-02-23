// scripts/run-migration.js
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: __dirname + '/../.env' });
}

const db = require('../src/config/db');

async function run() {
    try {
        console.log('开始执行数据库迁移...');

        // 检查列是否存在
        const hasContactQuestions = await db.schema.hasColumn('cards', 'contact_questions');
        const hasPreTags = await db.schema.hasColumn('cards', 'pre_answered_tags');

        if (!hasContactQuestions || !hasPreTags) {
            await db.schema.alterTable('cards', table => {
                if (!hasContactQuestions) {
                    table.json('contact_questions').defaultTo(null).comment('联系前的防骚扰问题 [{q, a}]');
                    console.log('✅ 添加 contact_questions 列');
                }
                if (!hasPreTags) {
                    table.json('pre_answered_tags').defaultTo(null).comment('预设的服务承诺标签 ["标签1"]');
                    console.log('✅ 添加 pre_answered_tags 列');
                }
            });
            console.log('数据库结构更新成功！');
        } else {
            console.log('所需的列已经存在，无需迁移。');
        }
    } catch (err) {
        console.error('迁移失败:', err);
    } finally {
        process.exit(0);
    }
}

run();

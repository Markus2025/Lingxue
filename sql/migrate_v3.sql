-- sql/migrate_v3.sql
-- 适配三步走联系流程：增加防骚扰问题和服务承诺标签字段

USE lingxue;

ALTER TABLE `cards`
ADD COLUMN `contact_questions` JSON DEFAULT NULL COMMENT '联系前的防骚扰问题 [{q, a}]',
ADD COLUMN `pre_answered_tags` JSON DEFAULT NULL COMMENT '预设的服务承诺标签 ["标签1"]';

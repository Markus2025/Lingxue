-- =============================================
-- 邻学 v1 → v2 数据库增量迁移脚本
-- 在 已存在 v1 表的数据库上执行此脚本
-- =============================================

USE lingxue;

-- 1. users 表新增字段
ALTER TABLE `users`
  ADD COLUMN `location` VARCHAR(128) DEFAULT NULL COMMENT '所在地区' AFTER `grade`,
  ADD COLUMN `real_name_verified` TINYINT DEFAULT 0 COMMENT '实名认证：0未认证/1已认证' AFTER `edu_email`;

-- 2. cards 表新增字段
ALTER TABLE `cards`
  ADD COLUMN `tags` JSON DEFAULT NULL COMMENT '趣味标签' AFTER `skills`,
  ADD COLUMN `service_name` VARCHAR(64) DEFAULT NULL COMMENT '服务名称' AFTER `teaching_format`,
  ADD COLUMN `contact_count` INT DEFAULT 0 COMMENT '被联系次数' AFTER `view_count`,
  ADD COLUMN `favorite_count` INT DEFAULT 0 COMMENT '被收藏次数' AFTER `contact_count`;

-- 3. contact_logs 表新增 status 字段
ALTER TABLE `contact_logs`
  ADD COLUMN `status` VARCHAR(16) DEFAULT 'contacted' COMMENT '状态' AFTER `card_id`;

-- 4. 新增收藏分类表
CREATE TABLE IF NOT EXISTS `favorite_categories` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '所属用户',
  `name` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. favorites 表新增 category_id
ALTER TABLE `favorites`
  ADD COLUMN `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '所属分类' AFTER `card_id`,
  ADD INDEX `idx_category` (`category_id`);

-- 6. feedbacks 表新增 contact
ALTER TABLE `feedbacks`
  ADD COLUMN `contact` VARCHAR(128) DEFAULT NULL COMMENT '联系方式' AFTER `images`;

-- 7. search_hot 表新增标记字段
ALTER TABLE `search_hot`
  ADD COLUMN `is_hot` TINYINT DEFAULT 0 COMMENT '是否热门' AFTER `count`,
  ADD COLUMN `is_new` TINYINT DEFAULT 0 COMMENT '是否新词' AFTER `is_hot`;

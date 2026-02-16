-- =============================================
-- 邻学小程序 MySQL 数据库初始化脚本 v2
-- 数据库：lingxue
-- 字符集：utf8mb4（支持 emoji）
-- 更新：2026-02-16 补充前端审阅发现的字段差距
-- =============================================

CREATE DATABASE IF NOT EXISTS lingxue
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE lingxue;

-- ----- 1. 用户表 -----
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL COMMENT '微信 openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信 unionid',
  `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(512) DEFAULT NULL COMMENT '头像 URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0未知/1男/2女',
  `phone` VARCHAR(255) DEFAULT NULL COMMENT '手机号（加密存储）',
  `wechat_id` VARCHAR(255) DEFAULT NULL COMMENT '微信号（加密存储）',
  `school` VARCHAR(128) DEFAULT NULL COMMENT '学校',
  `major` VARCHAR(128) DEFAULT NULL COMMENT '专业',
  `grade` VARCHAR(32) DEFAULT NULL COMMENT '年级',
  `location` VARCHAR(128) DEFAULT NULL COMMENT '所在地区',
  `ling_code` VARCHAR(6) DEFAULT NULL COMMENT '邻学码（6位唯一）',
  `edu_verified` TINYINT DEFAULT 0 COMMENT '学生认证：0未认证/1已认证',
  `edu_email` VARCHAR(128) DEFAULT NULL COMMENT '教育邮箱',
  `real_name_verified` TINYINT DEFAULT 0 COMMENT '实名认证：0未认证/1已认证',
  `status` VARCHAR(16) DEFAULT 'active' COMMENT '状态：active/banned/deleted',
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,

  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_ling_code` (`ling_code`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';


-- ----- 2. 卡片表（核心业务表） -----
CREATE TABLE IF NOT EXISTS `cards` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '所属用户 ID',
  `bio` TEXT DEFAULT NULL COMMENT '个人简介',
  `slogan` VARCHAR(255) DEFAULT NULL COMMENT '一句话介绍',
  `skills` JSON DEFAULT NULL COMMENT '技能标签 [{name,icon,type}]',
  `tags` JSON DEFAULT NULL COMMENT '趣味标签 ["接梗达人 🤣","早起冠军 ☀️"]',
  `price_min` INT DEFAULT 0 COMMENT '最低价格',
  `price_max` INT DEFAULT 0 COMMENT '最高价格',
  `mode_online` TINYINT DEFAULT 0 COMMENT '支持线上',
  `mode_offline` TINYINT DEFAULT 0 COMMENT '支持线下',
  `region` VARCHAR(128) DEFAULT NULL COMMENT '服务地区',
  `time_slots` JSON DEFAULT NULL COMMENT '空闲时间段 [{day,startTime,endTime}]',
  `dimensions` JSON DEFAULT NULL COMMENT '五边形维度 [{name,value}]',
  `teaching_format` VARCHAR(64) DEFAULT NULL COMMENT '授课形式描述',
  `service_name` VARCHAR(64) DEFAULT NULL COMMENT '服务名称（如：1对1咨询）',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `contact_count` INT DEFAULT 0 COMMENT '被联系次数',
  `favorite_count` INT DEFAULT 0 COMMENT '被收藏次数',
  `status` VARCHAR(16) DEFAULT 'active' COMMENT '状态：active/hidden/banned',
  `embedding` JSON DEFAULT NULL COMMENT 'AI搜索向量（预留）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,

  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_price` (`price_min`, `price_max`),
  FULLTEXT KEY `ft_search` (`bio`, `slogan`) WITH PARSER ngram,

  CONSTRAINT `fk_cards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='技能卡片表';


-- ----- 3. 联系记录表 -----
CREATE TABLE IF NOT EXISTS `contact_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `requester_id` BIGINT UNSIGNED NOT NULL COMMENT '发起联系的用户',
  `target_id` BIGINT UNSIGNED NOT NULL COMMENT '被联系的用户',
  `card_id` BIGINT UNSIGNED NOT NULL COMMENT '关联卡片',
  `status` VARCHAR(16) DEFAULT 'contacted' COMMENT '状态：contacted/pending',
  `contacted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_requester` (`requester_id`),
  INDEX `idx_target` (`target_id`),
  INDEX `idx_card` (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系记录表';


-- ----- 4. 收藏分类表 -----
CREATE TABLE IF NOT EXISTS `favorite_categories` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '所属用户',
  `name` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏分类表';


-- ----- 5. 收藏表 -----
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '收藏者',
  `card_id` BIGINT UNSIGNED NOT NULL COMMENT '被收藏的卡片',
  `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '所属分类',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,

  UNIQUE KEY `uk_user_card` (`user_id`, `card_id`),
  INDEX `idx_card` (`card_id`),
  INDEX `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';


-- ----- 6. 举报表 -----
CREATE TABLE IF NOT EXISTS `reports` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `reporter_id` BIGINT UNSIGNED NOT NULL COMMENT '举报人',
  `target_card_id` BIGINT UNSIGNED NOT NULL COMMENT '被举报卡片',
  `reason` VARCHAR(64) NOT NULL COMMENT '举报原因',
  `description` TEXT DEFAULT NULL COMMENT '详细描述',
  `status` VARCHAR(16) DEFAULT 'pending' COMMENT '状态：pending/resolved/dismissed',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_reporter` (`reporter_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报记录表';


-- ----- 7. 反馈表 -----
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '反馈用户',
  `type` VARCHAR(32) DEFAULT 'suggestion' COMMENT '类型：suggestion/bug/complaint',
  `content` TEXT NOT NULL COMMENT '反馈内容',
  `images` JSON DEFAULT NULL COMMENT '附图 URL 列表',
  `contact` VARCHAR(128) DEFAULT NULL COMMENT '联系方式（选填）',
  `status` VARCHAR(16) DEFAULT 'pending' COMMENT '状态：pending/read/replied',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';


-- ----- 8. 热搜表 -----
CREATE TABLE IF NOT EXISTS `search_hot` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `keyword` VARCHAR(64) NOT NULL COMMENT '搜索关键词',
  `count` INT DEFAULT 1 COMMENT '搜索次数',
  `is_hot` TINYINT DEFAULT 0 COMMENT '是否热门',
  `is_new` TINYINT DEFAULT 0 COMMENT '是否新词',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_keyword` (`keyword`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热搜词表';

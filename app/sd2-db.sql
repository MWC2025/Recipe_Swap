-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 30, 2022 at 09:54 AM
-- Server version: 8.0.24
-- PHP Version: 7.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
 /*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
 /*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 /*!40101 SET NAMES utf8mb4 */;

-- Ensure database exists and is selected
CREATE DATABASE IF NOT EXISTS `sd2-db`;
USE `sd2-db`;

--
-- Table structure for table `test_table`
--
DROP TABLE IF EXISTS `test_table`;

CREATE TABLE `test_table` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(512) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `test_table`
--
INSERT INTO `test_table` (`id`, `name`) VALUES
(1, 'Lisa'),
(2, 'Kimia');

-- App database SQL

-- Drop existing tables in FK‑safe order
DROP TABLE IF EXISTS app_recipe_tag_links;
DROP TABLE IF EXISTS app_swaps;
DROP TABLE IF EXISTS app_recipes;
DROP TABLE IF EXISTS app_tags;
DROP TABLE IF EXISTS app_users;

-- Users
CREATE TABLE app_users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Recipes
CREATE TABLE app_recipes (
    recipe_id     INT AUTO_INCREMENT PRIMARY KEY,
    author_id     INT          NOT NULL,
    recipe_title  VARCHAR(150) NOT NULL,
    summary       TEXT         NOT NULL,
    ingredients   TEXT         NOT NULL,
    instructions  TEXT         NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app_recipes_author (author_id),
    CONSTRAINT fk_app_recipes_author
        FOREIGN KEY (author_id) REFERENCES app_users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tags
CREATE TABLE app_tags (
    tag_id   INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Junction table Recipe–Tags
CREATE TABLE app_recipe_tag_links (
    recipe_id INT NOT NULL,
    tag_id    INT NOT NULL,
    PRIMARY KEY (recipe_id, tag_id),
    INDEX idx_app_links_recipe (recipe_id),
    INDEX idx_app_links_tag (tag_id),
    CONSTRAINT fk_app_links_recipe
        FOREIGN KEY (recipe_id) REFERENCES app_recipes(recipe_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_app_links_tag
        FOREIGN KEY (tag_id) REFERENCES app_tags(tag_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Swaps
CREATE TABLE app_swaps (
    swap_id             INT AUTO_INCREMENT PRIMARY KEY,
    requester_id        INT      NOT NULL,
    requested_recipe_id INT      NOT NULL,
    offered_recipe_id   INT      NOT NULL,
    swap_status         ENUM('pending','accepted','declined','cancelled')
                         NOT NULL DEFAULT 'pending',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NULL,
    INDEX idx_app_swaps_requester (requester_id),
    INDEX idx_app_swaps_requested (requested_recipe_id),
    INDEX idx_app_swaps_offered (offered_recipe_id),
    CONSTRAINT fk_app_swaps_requester
        FOREIGN KEY (requester_id)        REFERENCES app_users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_app_swaps_requested
        FOREIGN KEY (requested_recipe_id) REFERENCES app_recipes(recipe_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_app_swaps_offered
        FOREIGN KEY (offered_recipe_id)   REFERENCES app_recipes(recipe_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data

INSERT INTO app_users (username, email_address, password_hash) VALUES
('student_sarah',  'sarah@example.com',  'hash1'),
('coach_jamal',    'jamal@example.com',  'hash2'),
('parent_priya',   'priya@example.com',  'hash3');

INSERT INTO app_recipes (author_id, recipe_title, summary, ingredients, instructions) VALUES
(1, 'Dorm Room Pasta',
 'Simple pasta dish for beginners',
 'pasta, tomato sauce, garlic, olive oil, salt, pepper',
 'Boil pasta; cook sauce with garlic; combine and season.'),
(2, 'Lift Day Power Bowl',
 'High-protein bowl for training days',
 'chicken breast, rice, broccoli, olive oil, spices',
 'Grill chicken; steam broccoli; cook rice; assemble in a bowl.');

INSERT INTO app_tags (tag_name) VALUES
('vegetarian'),
('quick'),
('high-protein');

INSERT INTO app_recipe_tag_links (recipe_id, tag_id) VALUES
(1, 1),
(1, 2),
(2, 3);

INSERT INTO app_swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES
(1, 2, 1, 'pending');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
 /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
 /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS comment_votes;
DROP TABLE IF EXISTS forum_comments;
DROP TABLE IF EXISTS forum_posts;
DROP TABLE IF EXISTS recipe_tags;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS swaps;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email_address VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  points INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  recipe_title VARCHAR(150) NOT NULL,
  summary TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image_path VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recipes_author
    FOREIGN KEY (author_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE TABLE tags (
  tag_id INT AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE recipe_tags (
  recipe_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (recipe_id, tag_id),
  CONSTRAINT fk_app_links_recipe
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_links_tag
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
    ON DELETE CASCADE
);

CREATE TABLE swaps (
  swap_id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  requested_recipe_id INT NOT NULL,
  offered_recipe_id INT NOT NULL,
  swap_status ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  CONSTRAINT fk_swaps_requester
    FOREIGN KEY (requester_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_swaps_requested
    FOREIGN KEY (requested_recipe_id) REFERENCES recipes(recipe_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_swaps_offered
    FOREIGN KEY (offered_recipe_id) REFERENCES recipes(recipe_id)
    ON DELETE CASCADE
);

CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_recipe_review (recipe_id, user_id),
  CONSTRAINT fk_reviews_recipe
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE TABLE forum_posts (
  post_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  ingredient_tag VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE forum_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  upvotes INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE comment_votes (
  vote_id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY unique_vote (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO users (username, email_address, password_hash, is_admin, points) VALUES
('admin_sarah', 'sarah@example.com', '$2b$10$gFZpa4AWcybnWJ50Sy4VNebRgrrUgWhlJxbDVC3ON2ay0nYejoX06', TRUE, 40),
('coach_jamal', 'jamal@example.com', '$2b$10$VoB/UXpyHSSYd7KSzXnJneURDP1nTSzAs5cmiwTW2/KkUy.i96DdK', FALSE, 30),
('parent_priya', 'priya@example.com', '$2b$10$OZ3s1j.sRrg8WE7.MSGuZuy3G0ZxqElqi09z/Mx1iVOJG7l8u/6VC', FALSE, 20),
('gym_gabriel', 'gabriel@example.com', '$2b$10$xqhn8CjhhAkpfLTM/YeomOM6EQx58mwVoz24vmXeVC/SpwGgz9s4q', FALSE, 15),
('veggie_victoria', 'victoria@example.com', '$2b$10$s5Fqtzd3GWQlDfYgLz3f1.85G6ZsKbEdj5bohLXPc4ZB9ZvTB5Vaa', FALSE, 10);

INSERT INTO recipes (author_id, recipe_title, summary, ingredients, instructions, image_path) VALUES
(1, 'Dorm Room Pasta',
 'Simple one-pot pasta that a beginner can cook with just a hob and one pan.',
 'dried pasta, jarred tomato sauce, garlic, olive oil, salt, pepper, mixed herbs, grated cheese',
 'Cook pasta in salted water. In a pan, fry garlic in olive oil, add tomato sauce and herbs, simmer. Combine with drained pasta and serve with cheese.',
 '/images/recipe1.jpg'),
(2, 'Lift Day Power Bowl',
 'High-protein chicken, rice and veg bowl designed for training days and easy meal prep.',
 'chicken breasts, rice, broccoli, olive oil, smoked paprika, garlic powder, salt, pepper',
 'Bake seasoned chicken, cook rice, steam broccoli, then assemble into bowls for meal prep.',
 '/images/recipe2.jpg'),
(3, 'Five-Minute Breakfast Mug Omelette',
 'Microwave omelette in a mug for busy mornings, with optional veg and cheese add-ins.',
 'eggs, milk, cheese, onion, bell pepper, salt, pepper',
 'Whisk everything in a mug and microwave until just set, stirring once halfway.',
 '/images/recipe3.jpg'),
(4, 'Sheet-Pan Cajun Chicken',
 'Meal-prep friendly chicken traybake with sweet potato and peppers.',
 'chicken thighs, sweet potato, red pepper, olive oil, cajun seasoning, salt, pepper',
 'Toss everything with oil and seasoning on a tray and roast until cooked through.',
 '/images/recipe4.jpg'),
(5, 'One-Pan Chickpea Veggie Skillet',
 'Budget-friendly vegetarian skillet with chickpeas and mixed vegetables.',
 'chickpeas, onion, bell pepper, courgette, garlic, spices, olive oil',
 'Fry onion and garlic, add vegetables and chickpeas, season and cook until tender.',
 '/images/recipe5.jpg');

INSERT INTO tags (tag_name) VALUES
('vegetarian'),
('quick'),
('high-protein'),
('meal-prep'),
('budget'),
('one-pan');

INSERT INTO recipe_tags (recipe_id, tag_id) VALUES
(1, 2),
(1, 5),
(1, 6),
(2, 3),
(2, 4),
(3, 2),
(3, 3),
(4, 3),
(4, 4),
(4, 6),
(5, 1),
(5, 5),
(5, 6);

INSERT INTO swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES
(1, 2, 1, 'pending'),
(2, 3, 2, 'declined'),
(5, 4, 5, 'accepted');

INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES
(1, 2, 4, 'Quick and easy for busy evenings.'),
(2, 3, 5, 'Great meal prep option and very filling.'),
(3, 1, 4, 'Perfect for busy mornings before lectures.'),
(5, 4, 5, 'Tasty veggie option that works well with meal prep.');

INSERT INTO forum_posts (user_id, title, content, ingredient_tag) VALUES
(1, 'Best cheap protein sources?',
 'Looking for ideas I can use in student recipes that are high-protein but budget friendly.',
 'high-protein'),
(3, 'Quick breakfasts before uni',
 'What do you all make when you have 10 minutes before leaving the house?',
 'quick'),
(5, 'Favourite one-pan dinners',
 'Share your favourite one-pan / one-pot ideas that avoid too much washing up.',
 'one-pan');

INSERT INTO forum_comments (post_id, user_id, comment, upvotes) VALUES
(1, 2, 'Tinned tuna, eggs, and Greek yoghurt are my go-to cheap proteins.', 2),
(1, 5, 'Chickpeas and lentils are great in curries and salads.', 3),
(2, 4, 'Overnight oats with protein powder saves me on 8am lectures.', 1),
(3, 1, 'One-pan chicken and sweet potato with frozen veg is my weeknight staple.', 2);

INSERT INTO comment_votes (comment_id, user_id) VALUES
(1, 1),
(1, 3),
(2, 2),
(3, 1),
(4, 5);

SET FOREIGN_KEY_CHECKS = 1;
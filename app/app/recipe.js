// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    
    res.render("index");
});


app.get("/init", function (req, res) {
  const queries = [
    "DROP TABLE IF EXISTS recipe_tags",
    "DROP TABLE IF EXISTS swaps",
    "DROP TABLE IF EXISTS recipes",
    "DROP TABLE IF EXISTS tags",
    "DROP TABLE IF EXISTS users",

    "CREATE TABLE users ( \
      user_id       INT AUTO_INCREMENT PRIMARY KEY, \
      username      VARCHAR(50)  NOT NULL UNIQUE, \
      email_address VARCHAR(255) NOT NULL UNIQUE, \
      password_hash VARCHAR(255) NOT NULL, \
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP \
    )",

    "CREATE TABLE recipes ( \
      recipe_id     INT AUTO_INCREMENT PRIMARY KEY, \
      author_id     INT          NOT NULL, \
      recipe_title  VARCHAR(150) NOT NULL, \
      summary       TEXT         NOT NULL, \
      ingredients   TEXT         NOT NULL, \
      instructions  TEXT         NOT NULL, \
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      CONSTRAINT fk_recipes_author \
        FOREIGN KEY (author_id) REFERENCES users(user_id) \
        ON DELETE CASCADE \
    )",

    "CREATE TABLE tags ( \
      tag_id   INT AUTO_INCREMENT PRIMARY KEY, \
      tag_name VARCHAR(50) NOT NULL UNIQUE \
    )",

    "CREATE TABLE recipe_tags ( \
      recipe_id INT NOT NULL, \
      tag_id    INT NOT NULL, \
      PRIMARY KEY (recipe_id, tag_id), \
      CONSTRAINT fk_app_links_recipe \
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_links_tag \
        FOREIGN KEY (tag_id) REFERENCES tags(tag_id) \
        ON DELETE CASCADE \
    )",

    "CREATE TABLE swaps ( \
      swap_id             INT AUTO_INCREMENT PRIMARY KEY, \
      requester_id        INT      NOT NULL, \
      requested_recipe_id INT      NOT NULL, \
      offered_recipe_id   INT      NOT NULL, \
      swap_status         ENUM('pending','accepted','declined','cancelled') \
                         NOT NULL DEFAULT 'pending', \
      created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      updated_at          DATETIME NULL, \
      CONSTRAINT fk_swaps_requester \
        FOREIGN KEY (requester_id)        REFERENCES users(user_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_swaps_requested \
        FOREIGN KEY (requested_recipe_id) REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_swaps_offered \
        FOREIGN KEY (offered_recipe_id)   REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE \
    )"
  ];

  Promise.all(queries.map(function (q) { return db.query(q); }))
    .then(function () {
      res.send("Database initialised");
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error initialising DB");
    });
});

app.get("/seed", function (req, res) {
  const steps = [
    "DELETE FROM recipe_tags",
    "DELETE FROM swaps",
    "DELETE FROM recipes",
    "DELETE FROM tags",
    "DELETE FROM users",

    "INSERT INTO users (username, email_address, password_hash) VALUES \
    ('student_sarah',  'sarah@example.com',  'hash1'), \
    ('coach_jamal',    'jamal@example.com',  'hash2'), \
    ('parent_priya',   'priya@example.com',  'hash3')",

    "INSERT INTO recipes (author_id, recipe_title, summary, ingredients, instructions) VALUES \
    (1, 'Dorm Room Pasta', \
     'Simple pasta dish for beginners', \
     'pasta, tomato sauce, garlic, olive oil, salt, pepper', \
     'Boil pasta; cook sauce with garlic; combine and season.'), \
    (2, 'Lift Day Power Bowl', \
     'High-protein bowl for training days', \
     'chicken breast, rice, broccoli, olive oil, spices', \
     'Grill chicken; steam broccoli; cook rice; assemble in a bowl.')",

    "INSERT INTO tags (tag_name) VALUES \
    ('vegetarian'), \
    ('quick'), \
    ('high-protein')",

    "INSERT INTO recipe_tags (recipe_id, tag_id) VALUES \
    (1, 1), \
    (1, 2), \
    (2, 3)",

    "INSERT INTO swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES \
    (1, 2, 1, 'pending')"
  ];

  steps.reduce(function (p, sql) {
    return p.then(function () { return db.query(sql); });
  }, Promise.resolve())
    .then(function () {
      res.send("Seeded");
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error seeding data");
    });
});
//user profile page
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users").then(users => {
    res.render("users", { users });
  });
});

//recipes  page
app.get("/recipes", (req, res) => {
  db.query("SELECT * FROM users").then(users => {
    res.render("recipes", { recipe });
  });
});


app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT * FROM app_users WHERE user_id = ?", [userId]).then(user => {
    if (!user.length) return res.send("User not found");

    db.query("SELECT * FROM app_recipes WHERE user_id = ?", [userId]).then(recipes => {
      res.render("profile", { user: user[0], recipes });
    });
  });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Recipe app running at http://127.0.0.1:3000/`);
});
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


app.get("/init", (req, res) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100),
      email VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS recipes (
      recipe_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      title VARCHAR(255),
      description TEXT,
      ingredients TEXT,
      instructions TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tags (
      tag_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS recipe_tags (
      recipe_id INT,
      tag_id INT
    )`
  ];

  // run queries in sequence
  Promise.all(queries.map(q => db.query(q)))
    .then(() => res.send("Database initialized"))
    .catch(err => {
      console.error(err);
      res.status(500).send("Error initialising DB");
    });
});

app.get("/seed", (req, res) => {
  const steps = [
    "DELETE FROM recipe_tags",
    "DELETE FROM recipes",
    "DELETE FROM users",
    "DELETE FROM tags",
    `INSERT INTO users (username, email) VALUES
      ('Sarah', 'sarah@student.com'),
      ('Jamal', 'jamal@fitness.com'),
      ('Priya', 'priya@work.com'),
      ('Daniel', 'daniel@uni.com')`,
    `INSERT INTO recipes (user_id, title, description, ingredients, instructions) VALUES
      (1, 'Quick Pancakes', 'Easy breakfast', 'Flour, Eggs', 'Mix & cook'),
      (2, 'Protein Bowl', 'Gym meal', 'Chicken, Rice', 'Cook & serve'),
      (3, 'Family Pasta', 'Quick dinner', 'Pasta, Sauce', 'Boil & mix'),
      (4, 'Student Noodles', 'Cheap meal', 'Noodles', 'Cook fast')`,
    `INSERT INTO tags (name) VALUES
      ('Quick'), ('Healthy'), ('Vegetarian'), ('Student')`,
    `INSERT INTO recipe_tags (recipe_id, tag_id) VALUES
      (1,1), (2,2), (3,1), (4,4)`
  ];

  steps.reduce(
    (p, sql) => p.then(() => db.query(sql)),
    Promise.resolve()
  )
    .then(() => res.send("Seeded!"))
    .catch(err => {
      console.error(err);
      res.status(500).send("Error seeding data");
    });
});
//user profile page
app.get("/users", (req, res) => {
  db.query("SELECT * FROM app_users").then(users => {
    res.render("users", { users });
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
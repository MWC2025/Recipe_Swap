// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

//turns form data from browser into a normal js object
app.use(express.urlencoded({ extended: true }));

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
    )",

    ("CREATE TABLE reviews ( \
      review_id    INT AUTO_INCREMENT PRIMARY KEY,\
      recipe_id    INT NOT NULL,\
     user_id      INT NOT NULL,\
      rating       INT NOT NULL,\
      comment      TEXT NOT NULL,\
     created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\
      CONSTRAINT fk_reviews_recipe \
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)\
        ON DELETE CASCADE,\
     CONSTRAINT fk_reviews_user\
        FOREIGN KEY (user_id) REFERENCES users(user_id) \
        ON DELETE CASCADE \
    )")
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
    ('parent_priya',   'priya@example.com',  'hash3'), \
    ('gym_gabriel',    'gabriel@example.com','hash4'), \
    ('veggie_victoria','victoria@example.com','hash5')",

    "INSERT INTO recipes (author_id, recipe_title, summary, ingredients, instructions) VALUES \
    (1, 'Dorm Room Pasta', \
     'Simple one-pot pasta that a beginner can cook with just a hob and one pan.', \
     'dried pasta, jarred tomato sauce, 2 cloves garlic (minced), 2 tbsp olive oil, salt, black pepper, dried mixed herbs, grated cheese (optional)', \
     '1) Bring a pot of salted water to a boil and cook the pasta according to packet instructions. 2) While the pasta cooks, heat olive oil in a pan on medium, add minced garlic and cook for 1–2 minutes until fragrant. 3) Pour in the tomato sauce, season with salt, pepper and mixed herbs, and simmer for 5 minutes. 4) Drain the pasta, reserving a splash of cooking water, then toss pasta into the sauce, loosening with the water if needed. 5) Serve hot and top with grated cheese if using.' \
    ), \
    (2, 'Lift Day Power Bowl', \
     'High-protein chicken, rice and veg bowl designed for training days and easy meal prep.', \
     '2 chicken breasts, 1 cup uncooked rice, 2 cups broccoli florets, 1 tbsp olive oil, 1 tsp smoked paprika, 1 tsp garlic powder, salt, pepper, chilli flakes (optional)', \
     '1) Preheat the oven to 200°C and line a baking tray. 2) Season chicken breasts with olive oil, smoked paprika, garlic powder, salt and pepper, then bake for 18–22 minutes until cooked through. 3) Cook rice according to packet instructions. 4) Steam or microwave broccoli until just tender but still bright green. 5) Slice the chicken and assemble bowls with rice at the base, broccoli on one side and chicken on top, sprinkling chilli flakes if you like heat.' \
    ), \
    (3, 'Five-Minute Breakfast Mug Omelette', \
     'Microwave omelette in a mug for busy mornings, with optional veg and cheese add-ins.', \
     '2 eggs, 2 tbsp milk, pinch salt, pinch pepper, 2 tbsp grated cheese, 2 tbsp chopped bell pepper, 1 tbsp chopped onion, 1 tsp olive oil or butter (for greasing)', \
     '1) Lightly grease a large microwave-safe mug with oil or butter. 2) Crack in the eggs, add milk, salt and pepper, then whisk with a fork until well combined. 3) Stir in chopped vegetables and grated cheese. 4) Microwave on high for 45–60 seconds, stir, then microwave in 20-second bursts until just set and fluffy. 5) Let it sit for 1 minute before eating as it will be very hot.' \
    ), \
    (4, 'Sheet-Pan Cajun Chicken & Sweet Potato', \
     'High-protein traybake with chicken, sweet potato and peppers – perfect for Sunday meal prep.', \
     '2 chicken thighs (boneless, skinless), 1 large sweet potato (cubed), 1 red bell pepper (sliced), 1 tbsp olive oil, 2 tsp Cajun seasoning, salt, pepper', \
     '1) Preheat the oven to 200°C and line a baking tray with baking paper. 2) Toss sweet potato cubes and sliced pepper with half the olive oil, Cajun seasoning, salt and pepper, then spread on the tray. 3) Rub remaining oil and seasoning onto the chicken thighs and place them on top of the vegetables. 4) Roast for 25–30 minutes, turning the veg once halfway, until the chicken is cooked through and the sweet potatoes are soft. 5) Divide into containers for meal prep or serve immediately.' \
    ), \
    (5, 'One-Pan Chickpea Veggie Skillet', \
     'Budget-friendly vegetarian skillet with chickpeas and mixed vegetables, great with rice or toast.', \
     '1 can chickpeas (drained and rinsed), 1 small onion (diced), 1 bell pepper (diced), 1 small courgette (sliced), 2 cloves garlic (minced), 1 tsp smoked paprika, 1 tsp ground cumin, 2 tbsp olive oil, salt, pepper, handful fresh parsley (optional), cooked rice or bread to serve', \
     '1) Heat olive oil in a large pan over medium heat, then add diced onion and cook for 3–4 minutes until softened. 2) Add garlic, bell pepper and courgette, cooking for another 4–5 minutes until the vegetables start to soften. 3) Stir in chickpeas, smoked paprika, cumin, salt and pepper, and cook for 5 minutes, stirring occasionally. 4) Taste and adjust seasoning, then sprinkle with chopped parsley if using. 5) Serve over cooked rice or with toasted bread for a complete meal.' \
    )",

    "INSERT INTO tags (tag_name) VALUES \
    ('vegetarian'), \
    ('quick'), \
    ('high-protein'), \
    ('meal-prep'), \
    ('budget'), \
    ('one-pan')",

    "INSERT INTO recipe_tags (recipe_id, tag_id) VALUES \
    (1, 2), \
    (1, 5), \
    (2, 3), \
    (2, 4), \
    (3, 2), \
    (3, 3), \
    (4, 3), \
    (4, 4), \
    (4, 6), \
    (5, 1), \
    (5, 5), \
    (5, 6)",

    "INSERT INTO swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES \
    (1, 2, 1, 'pending'), \
    (5, 4, 5, 'accepted'), \
    (2, 3, 2, 'declined')",

    "INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES \
    (1, 2, 4, 'Quick and easy for busy evenings.'),\
    (2, 3, 5, 'Great meal prep option and very filling.'),\
    (5, 1, 4, 'Really cheap and easy to make.');"

  
  ];

  steps.reduce(function (p, sql) {
    return p.then(function () {
      return db.query(sql);
    });
  }, Promise.resolve())
    .then(function () {
      res.send("Seeded");
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error seeding data");
    });
});
//recipe tags filter page
app.get("/tags", function (req, res) {
  db.query("SELECT tag_id, tag_name FROM tags ORDER BY tag_name")
    .then(function (tags) {
      res.render("categories", { tags });
    });
});

// recipes for a single tag
app.get("/tags/:id", function (req, res) {
  const tagId = req.params.id;

  const sql = `
    SELECT r.recipe_id, r.recipe_title, r.summary, t.tag_name
    FROM recipes r
    JOIN recipe_tags rt ON r.recipe_id = rt.recipe_id
    JOIN tags t ON rt.tag_id = t.tag_id
    WHERE t.tag_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(sql, [tagId])
    .then(function (rows) {
      if (!rows.length) {
        return res.render("tags", {
          tag_name: "Unknown tag",
          recipes: []         
        });
      }

      const tag_name = rows[0].tag_name;

      res.render("tags", {
        tag_name,
        recipes: rows          
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading tag recipes");
    });
});

//user profile page
 app.get("/users", function (req, res) {
  db.query("SELECT user_id, username, email_address FROM users")
    .then(function (users) {
      res.render("users", { users: users });
    })
 });



//user Detail page 
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT * FROM users WHERE user_id = ?", [userId]).then(user => {
    if (!user.length) return res.send("User not found");

    db.query("SELECT * FROM recipes WHERE author_id = ?", [userId]).then(recipes => {
      res.render("profile", { user: user[0], recipes });
      console.log("profile", { user: user[0], recipes });
    });
  });
});

//recipe listings   page
  app.get("/recipes", function (req, res) {
  const sql = `
    SELECT r.recipe_id, r.recipe_title, r.summary, u.username
    FROM recipes r
    JOIN users u ON r.author_id = u.user_id
    ORDER BY r.created_at DESC
  `;

  db.query(sql)
    .then(function (listings) {
      res.render("listings", { recipes: listings });
    });
});


  //recipe detail page
  app.get("/recipes/:id", function (req, res) {
  const id = req.params.id;

  db.query("SELECT * FROM recipes WHERE recipe_id = ?", [id])
    .then(function (rows) {
      if (!rows.length) return res.send("Recipe not found");
      const recipe = rows[0];

      return db.query(
        "SELECT t.tag_name FROM tags t " +
        "JOIN recipe_tags rt ON t.tag_id = rt.tag_id " +
        "WHERE rt.recipe_id = ?",
        [id]
      ).then(function (tags) {
        res.render("recipes", { recipe: recipe, tags: tags });
      });
    });
});

//swaps form route 
app.get("/recipes/:id/swap", function (req, res) {
  const recipeId = req.params.id;

  Promise.all([
    db.query("SELECT * FROM recipes WHERE recipe_id = ?", [recipeId]),
    db.query("SELECT * FROM recipes WHERE author_id != 1")
  ]).then(function ([targetRows, offeredRecipes]) {
    if (!targetRows.length) return res.send("Recipe not found");
    res.render("swap_form", {
      targetRecipe: targetRows[0],
      offeredRecipes
    });
  });
});
//swaps post route
app.post("/recipes/:id/swap", function (req, res) {
  const requested_recipe_id = req.params.id;
  const requester_id = 1; 
  const offered_recipe_id = req.body.offered_recipe_id;

  db.query(
    "INSERT INTO swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES (?, ?, ?, 'pending')",
    [requester_id, requested_recipe_id, offered_recipe_id]
  ).then(function () {
    res.redirect("/swaps");
  }).catch(function (err) {
    console.error(err);
    res.status(500).send("Error creating swap request");
    console.log(req.body);
  });
});

app.get("/swaps", function (req, res) {
  const sql = `
    SELECT 
      s.swap_id,
      s.swap_status,
      requested.recipe_title AS requested_title,
      offered.recipe_title AS offered_title
    FROM swaps s
    JOIN recipes requested ON s.requested_recipe_id = requested.recipe_id
    JOIN recipes offered ON s.offered_recipe_id = offered.recipe_id
    ORDER BY s.created_at DESC
    
  `;

  db.query(sql)
    .then(function (swaps) {
      res.render("swaps", { swaps: swaps });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading swaps");
    });
});


// Start server on port 3000
app.listen(3000,function(){
    console.log(`Recipe app running at http://127.0.0.1:3000/`);
});
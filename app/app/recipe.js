// Import express.js
const express = require("express");
const session = require("express-session");
const { User } = require("./models/user");


// Create express app
var app = express();


// Use the Pug templating engine
app.set("view engine", "pug");
app.set("views", "./app/views");


// turns form data from browser into a normal js object
app.use(express.urlencoded({ extended: true }));


// Add static files location
app.use(express.static("static"));


// Get the functions in the db.js file to use
const db = require("./services/db");


// Session middleware
app.use(session({
  secret: "recipe-swap-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// Make session info available in all Pug templates
app.use(function (req, res, next) {
  res.locals.loggedIn = req.session.loggedIn || false;
  res.locals.currentUserId = req.session.uid || null;
  res.locals.currentUsername = req.session.username || null;
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});


// Protected route middleware
function requireLogin(req, res, next) {
  if (!req.session.loggedIn || !req.session.uid) {
    return res.redirect("/signin");
  }
  next();
}


function requireAdmin(req, res, next) {
  if (!req.session.loggedIn || !req.session.uid) {
    return res.redirect("/signin");
  }

  if (!req.session.isAdmin) {
    return res.status(403).send("Access denied");
  }

  next();
}


// Home route
app.get("/", function (req, res) {
  res.render("index");
});


// init route
app.get("/init", function (req, res) {
  const queries = [
    "SET FOREIGN_KEY_CHECKS = 0",
    "DROP TABLE IF EXISTS comment_votes",
    "DROP TABLE IF EXISTS forum_comments",
    "DROP TABLE IF EXISTS forum_posts",
    "DROP TABLE IF EXISTS recipe_tags",
    "DROP TABLE IF EXISTS reviews",
    "DROP TABLE IF EXISTS swaps",
    "DROP TABLE IF EXISTS recipes",
    "DROP TABLE IF EXISTS tags",
    "DROP TABLE IF EXISTS users",
    "SET FOREIGN_KEY_CHECKS = 1",

    "CREATE TABLE users ( \
      user_id INT AUTO_INCREMENT PRIMARY KEY, \
      username VARCHAR(50) NOT NULL UNIQUE, \
      email_address VARCHAR(255) NOT NULL UNIQUE, \
      password_hash VARCHAR(255) NOT NULL, \
      is_admin BOOLEAN NOT NULL DEFAULT FALSE, \
      points INT NOT NULL DEFAULT 0, \
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP \
    )",

    "CREATE TABLE recipes ( \
      recipe_id INT AUTO_INCREMENT PRIMARY KEY, \
      author_id INT NOT NULL, \
      recipe_title VARCHAR(150) NOT NULL, \
      summary TEXT NOT NULL, \
      ingredients TEXT NOT NULL, \
      instructions TEXT NOT NULL, \
      image_path VARCHAR(255) NULL, \
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      CONSTRAINT fk_recipes_author \
        FOREIGN KEY (author_id) REFERENCES users(user_id) \
        ON DELETE CASCADE \
    )",

    "CREATE TABLE tags ( \
      tag_id INT AUTO_INCREMENT PRIMARY KEY, \
      tag_name VARCHAR(50) NOT NULL UNIQUE \
    )",

    "CREATE TABLE recipe_tags ( \
      recipe_id INT NOT NULL, \
      tag_id INT NOT NULL, \
      PRIMARY KEY (recipe_id, tag_id), \
      CONSTRAINT fk_app_links_recipe \
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_links_tag \
        FOREIGN KEY (tag_id) REFERENCES tags(tag_id) \
        ON DELETE CASCADE \
    )",

    "CREATE TABLE swaps ( \
      swap_id INT AUTO_INCREMENT PRIMARY KEY, \
      requester_id INT NOT NULL, \
      requested_recipe_id INT NOT NULL, \
      offered_recipe_id INT NOT NULL, \
      swap_status ENUM('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending', \
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      updated_at DATETIME NULL, \
      CONSTRAINT fk_swaps_requester \
        FOREIGN KEY (requester_id) REFERENCES users(user_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_swaps_requested \
        FOREIGN KEY (requested_recipe_id) REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_swaps_offered \
        FOREIGN KEY (offered_recipe_id) REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE \
    )",

    "CREATE TABLE reviews ( \
      review_id INT AUTO_INCREMENT PRIMARY KEY, \
      recipe_id INT NOT NULL, \
      user_id INT NOT NULL, \
      rating INT NOT NULL, \
      comment TEXT NOT NULL, \
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      UNIQUE KEY unique_recipe_review (recipe_id, user_id), \
      CONSTRAINT fk_reviews_recipe \
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) \
        ON DELETE CASCADE, \
      CONSTRAINT fk_reviews_user \
        FOREIGN KEY (user_id) REFERENCES users(user_id) \
        ON DELETE CASCADE \
    )",

    "CREATE TABLE forum_posts ( \
      post_id INT AUTO_INCREMENT PRIMARY KEY, \
      user_id INT NOT NULL, \
      title VARCHAR(150) NOT NULL, \
      content TEXT NOT NULL, \
      ingredient_tag VARCHAR(100) NULL, \
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE \
    )",

    "CREATE TABLE forum_comments ( \
      comment_id INT AUTO_INCREMENT PRIMARY KEY, \
      post_id INT NOT NULL, \
      user_id INT NOT NULL, \
      comment TEXT NOT NULL, \
      upvotes INT NOT NULL DEFAULT 0, \
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE, \
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE \
    )",

    "CREATE TABLE comment_votes ( \
      vote_id INT AUTO_INCREMENT PRIMARY KEY, \
      comment_id INT NOT NULL, \
      user_id INT NOT NULL, \
      UNIQUE KEY unique_vote (comment_id, user_id), \
      FOREIGN KEY (comment_id) REFERENCES forum_comments(comment_id) ON DELETE CASCADE, \
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE \
    )"
  ];


  Promise.all(queries.map(function (q) { return db.query(q); }))
    .then(function () {
      res.send("Database initialised");
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error initialising Database");
    });
});


// seed route
app.get("/seed", function (req, res) {
  const steps = [
    "SET FOREIGN_KEY_CHECKS = 0",
    "DELETE FROM comment_votes",
    "DELETE FROM forum_comments",
    "DELETE FROM forum_posts",
    "DELETE FROM recipe_tags",
    "DELETE FROM reviews",
    "DELETE FROM swaps",
    "DELETE FROM recipes",
    "DELETE FROM tags",
    "DELETE FROM users",
    "SET FOREIGN_KEY_CHECKS = 1",

    "INSERT INTO users (username, email_address, password_hash, is_admin, points) VALUES \
    ('admin_sarah',      'sarah@example.com',     '$2b$10$gFZpa4AWcybnWJ50Sy4VNebRgrrUgWhlJxbDVC3ON2ay0nYejoX06', TRUE, 40), \
    ('coach_jamal',      'jamal@example.com',     '$2b$10$VoB/UXpyHSSYd7KSzXnJneURDP1nTSzAs5cmiwTW2/KkUy.i96DdK', FALSE, 30), \
    ('parent_priya',     'priya@example.com',     '$2b$10$OZ3s1j.sRrg8WE7.MSGuZuy3G0ZxqElqi09z/Mx1iVOJG7l8u/6VC', FALSE, 20), \
    ('gym_gabriel',      'gabriel@example.com',   '$2b$10$xqhn8CjhhAkpfLTM/YeomOM6EQx58mwVoz24vmXeVC/SpwGgz9s4q', FALSE, 15), \
    ('veggie_victoria',  'victoria@example.com',  '$2b$10$s5Fqtzd3GWQlDfYgLz3f1.85G6ZsKbEdj5bohLXPc4ZB9ZvTB5Vaa', FALSE, 10)",

    "INSERT INTO recipes (author_id, recipe_title, summary, ingredients, instructions, image_path) VALUES \
    (1, 'Dorm Room Pasta', \
     'Simple one-pot pasta that a beginner can cook with just a hob and one pan.', \
     'dried pasta, jarred tomato sauce, garlic, olive oil, salt, pepper, mixed herbs, grated cheese', \
     'Cook pasta in salted water. In a pan, fry garlic in olive oil, add tomato sauce and herbs, simmer. Combine with drained pasta and serve with cheese.', \
     '/images/recipe1.jpg'), \
    (2, 'Lift Day Power Bowl', \
     'High-protein chicken, rice and veg bowl designed for training days and easy meal prep.', \
     'chicken breasts, rice, broccoli, olive oil, smoked paprika, garlic powder, salt, pepper', \
     'Bake seasoned chicken, cook rice, steam broccoli, then assemble into bowls for meal prep.', \
     '/images/recipe2.jpg'), \
    (3, 'Five-Minute Breakfast Mug Omelette', \
     'Microwave omelette in a mug for busy mornings, with optional veg and cheese add-ins.', \
     'eggs, milk, cheese, onion, bell pepper, salt, pepper', \
     'Whisk everything in a mug and microwave until just set, stirring once halfway.', \
     '/images/recipe3.jpg'), \
    (4, 'Sheet-Pan Cajun Chicken', \
     'Meal-prep friendly chicken traybake with sweet potato and peppers.', \
     'chicken thighs, sweet potato, red pepper, olive oil, cajun seasoning, salt, pepper', \
     'Toss everything with oil and seasoning on a tray and roast until cooked through.', \
     '/images/recipe4.jpg'), \
    (5, 'One-Pan Chickpea Veggie Skillet', \
     'Budget-friendly vegetarian skillet with chickpeas and mixed vegetables.', \
     'chickpeas, onion, bell pepper, courgette, garlic, spices, olive oil', \
     'Fry onion and garlic, add vegetables and chickpeas, season and cook until tender.', \
     '/images/recipe5.jpg')",

    "INSERT INTO tags (tag_name) VALUES \
    ('vegetarian'), \
    ('quick'), \
    ('high-protein'), \
    ('meal-prep'), \
    ('budget'), \
    ('one-pan')",

    "INSERT INTO recipe_tags (recipe_id, tag_id) VALUES \
    (1, 2),  \
    (1, 5),  \
    (1, 6),  \
    (2, 3),  \
    (2, 4),  \
    (3, 2),  \
    (3, 3),  \
    (4, 3),  \
    (4, 4),  \
    (4, 6),  \
    (5, 1),  \
    (5, 5),  \
    (5, 6)",

    "INSERT INTO swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES \
    (1, 2, 1, 'pending'), \
    (2, 3, 2, 'declined'), \
    (5, 4, 5, 'accepted')",

    "INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES \
    (1, 2, 4, 'Quick and easy for busy evenings.'), \
    (2, 3, 5, 'Great meal prep option and very filling.'), \
    (3, 1, 4, 'Perfect for busy mornings before lectures.'), \
    (5, 4, 5, 'Tasty veggie option that works well with meal prep.')",

    "INSERT INTO forum_posts (user_id, title, content, ingredient_tag) VALUES \
    (1, 'Best cheap protein sources?', \
     'Looking for ideas I can use in student recipes that are high-protein but budget friendly.', \
     'high-protein'), \
    (3, 'Quick breakfasts before uni', \
     'What do you all make when you have 10 minutes before leaving the house?', \
     'quick'), \
    (5, 'Favourite one-pan dinners', \
     'Share your favourite one-pan / one-pot ideas that avoid too much washing up.', \
     'one-pan')",

    "INSERT INTO forum_comments (post_id, user_id, comment, upvotes) VALUES \
    (1, 2, 'Tinned tuna, eggs, and Greek yoghurt are my go-to cheap proteins.', 2), \
    (1, 5, 'Chickpeas and lentils are great in curries and salads.', 3), \
    (2, 4, 'Overnight oats with protein powder saves me on 8am lectures.', 1), \
    (3, 1, 'One-pan chicken and sweet potato with frozen veg is my weeknight staple.', 2)",

    "INSERT INTO comment_votes (comment_id, user_id) VALUES \
    (1, 1), \
    (1, 3), \
    (2, 2), \
    (3, 1), \
    (4, 5)"
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
      console.error("SEED ERROR:", err);
      res.status(500).send("Error seeding data");
    });
});



// recipe tags filter page
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


// user profile page
app.get("/users", requireAdmin, function (req, res) {
  db.query("SELECT user_id, username, email_address FROM users")
    .then(function (users) {
      res.render("users", { users: users });
    });
});


//admin users route
app.get("/admin/users", requireAdmin, function (req, res) {
  db.query("SELECT user_id, username, email_address, is_admin, created_at FROM users ORDER BY created_at DESC")
    .then(function (users) {
      res.render("admin_users", { users: users });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading admin users");
    });
});


// user detail page
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  db.query("SELECT * FROM users WHERE user_id = ?", [userId]).then(user => {
    if (!user.length) return res.send("User not found");

    db.query("SELECT * FROM recipes WHERE author_id = ?", [userId]).then(recipes => {
      res.render("viewProfile", { user: user[0], recipes });
    });
  });
});


// recipe listings page
app.get("/recipes", function (req, res) {
  const sql = `
    SELECT r.recipe_id, r.recipe_title, r.summary, r.image_path, u.username
    FROM recipes r
    JOIN users u ON r.author_id = u.user_id
    ORDER BY r.created_at DESC
  `;

  db.query(sql)
    .then(function (listings) {
      res.render("listings", { recipes: listings });
    })
    .catch(function (err) {
      console.error("RECIPES ERROR:", err);
      res.status(500).send("Error loading recipes");
    });
});


// recipe detail page
app.get("/recipes/:id", async function (req, res) {
  const id = req.params.id;

  try {
    const recipeRows = await db.query("SELECT * FROM recipes WHERE recipe_id = ?", [id]);
    if (!recipeRows.length) return res.send("Recipe not found");

    const recipe = recipeRows[0];

    const tags = await db.query(
      "SELECT t.tag_name FROM tags t JOIN recipe_tags rt ON t.tag_id = rt.tag_id WHERE rt.recipe_id = ?",
      [id]
    );

    const ratingSummaryRows = await db.query(
      "SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE recipe_id = ?",
      [id]
    );

    const reviews = await db.query(
      `SELECT r.review_id, r.recipe_id, r.user_id, r.rating, r.comment, r.created_at, u.username
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.recipe_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    const ratingSummary = ratingSummaryRows[0] || { avg_rating: null, review_count: 0 };

    res.render("recipes", {
      recipe: recipe,
      tags: tags,
      reviews: reviews,
      ratingSummary: ratingSummary
    });
  } catch (err) {
    console.error("RECIPE DETAIL ERROR:", err);
    res.status(500).send("Error loading recipe");
  }
});


// swaps form route - protected
app.get("/recipes/:id/swap", requireLogin, function (req, res) {
  const recipeId = req.params.id;
  const currentUserId = req.session.uid;

  Promise.all([
    db.query("SELECT * FROM recipes WHERE recipe_id = ?", [recipeId]),
    db.query("SELECT * FROM recipes WHERE author_id = ?", [currentUserId])
  ])
    .then(function ([targetRows, offeredRecipes]) {
      if (!targetRows.length) return res.send("Recipe not found");

      res.render("swap_form", {
        targetRecipe: targetRows[0],
        offeredRecipes
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading swap form");
    });
});


// swaps post route - protected
app.post("/recipes/:id/swap", requireLogin, function (req, res) {
  const requested_recipe_id = req.params.id;
  const requester_id = req.session.uid;
  const offered_recipe_id = req.body.offered_recipe_id;

  db.query(
    "INSERT INTO swaps (requester_id, requested_recipe_id, offered_recipe_id, swap_status) VALUES (?, ?, ?, 'pending')",
    [requester_id, requested_recipe_id, offered_recipe_id]
  )
    .then(function () {
      res.redirect("/swaps");
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error creating swap request");
    });
});


//all swaps route
app.get("/allswaps", requireAdmin, function (req, res) {
  const sql = `
    SELECT 
      s.swap_id,
      s.swap_status,
      u.user_id AS requester_id,
      u.username,
      requested.recipe_title AS requested_title,
      offered.recipe_title AS offered_title
    FROM swaps s
    JOIN users u ON s.requester_id = u.user_id
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


//user personal swaps
app.get("/swaps", requireLogin, function (req, res) {
  const sql = `
    SELECT 
      s.swap_id,
      s.swap_status,
      u.user_id AS requester_id,
      u.username,
      requested.recipe_title AS requested_title,
      offered.recipe_title AS offered_title
    FROM swaps s
    JOIN users u ON s.requester_id = u.user_id
    JOIN recipes requested ON s.requested_recipe_id = requested.recipe_id
    JOIN recipes offered ON s.offered_recipe_id = offered.recipe_id
    WHERE s.requester_id = ?
    ORDER BY s.created_at DESC
  `;

  db.query(sql, [req.session.uid])
    .then(function (swaps) {
      res.render("swaps", { swaps: swaps });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading swaps");
    });
});


// reviews post route - protected
app.post("/recipes/:id/reviews", requireLogin, async function (req, res) {
  const recipeId = req.params.id;
  const userId = req.session.uid;
  const { rating, comment } = req.body;

  try {
    await db.query(
      "INSERT INTO reviews (recipe_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
      [recipeId, userId, rating, comment]
    );
    return res.redirect("/recipes/" + recipeId);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error saving review");
  }
});


//edit review
app.get("/reviews/:id/edit", requireLogin, async function (req, res) {
  const reviewId = req.params.id;
  const rows = await db.query("SELECT * FROM reviews WHERE review_id = ?", [reviewId]);

  if (!rows.length) return res.send("Review not found");
  if (rows[0].user_id !== req.session.uid) return res.status(403).send("Not allowed");

  res.render("edit_review", { review: rows[0] });
});


app.post("/reviews/:id/edit", requireLogin, async function (req, res) {
  const reviewId = req.params.id;
  const { rating, comment } = req.body;

  const rows = await db.query("SELECT * FROM reviews WHERE review_id = ?", [reviewId]);
  if (!rows.length) return res.send("Review not found");
  if (rows[0].user_id !== req.session.uid) return res.status(403).send("Not allowed");

  await db.query(
    "UPDATE reviews SET rating = ?, comment = ? WHERE review_id = ?",
    [rating, comment, reviewId]
  );

  res.redirect("/recipes/" + rows[0].recipe_id);
});


//review delete
app.post("/reviews/:id/delete", requireLogin, async function (req, res) {
  const reviewId = req.params.id;
  const rows = await db.query("SELECT * FROM reviews WHERE review_id = ?", [reviewId]);

  if (!rows.length) return res.send("Review not found");
  if (rows[0].user_id !== req.session.uid) return res.status(403).send("Not allowed");

  await db.query("DELETE FROM reviews WHERE review_id = ?", [reviewId]);
  res.redirect("/recipes/" + rows[0].recipe_id);
});


//admin review moderation
app.post("/admin/reviews/:id/delete", requireAdmin, async function (req, res) {
  const reviewId = req.params.id;
  const rows = await db.query("SELECT * FROM reviews WHERE review_id = ?", [reviewId]);

  if (!rows.length) return res.send("Review not found");

  await db.query("DELETE FROM reviews WHERE review_id = ?", [reviewId]);
  res.redirect("/recipes/" + rows[0].recipe_id);
});

//forum route
app.get("/forum", async function (req, res) {
  const search = req.query.search || "";
  let sql = `
    SELECT fp.post_id, fp.title, fp.content, fp.ingredient_tag, fp.created_at, u.username
    FROM forum_posts fp
    JOIN users u ON fp.user_id = u.user_id
  `;
  let params = [];

  if (search) {
    sql += " WHERE fp.title LIKE ? OR fp.content LIKE ? OR fp.ingredient_tag LIKE ? ";
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  sql += " ORDER BY fp.created_at DESC";

  try {
    const posts = await db.query(sql, params);
    res.render("forum_index", { posts: posts, search: search });
  } catch (err) {
    console.error("FORUM ERROR:", err);
    res.status(500).send("Error loading forum");
  }
});


app.get("/forum/new", requireLogin, function (req, res) {
  res.render("forum_new");
});


app.post("/forum", requireLogin, async function (req, res) {
  const title = req.body.title;
  const content = req.body.content;
  const ingredient_tag = req.body.ingredient_tag || null;

  try {
    await db.query(
      "INSERT INTO forum_posts (user_id, title, content, ingredient_tag) VALUES (?, ?, ?, ?)",
      [req.session.uid, title, content, ingredient_tag]
    );
    res.redirect("/forum");
  } catch (err) {
    console.error("CREATE FORUM POST ERROR:", err);
    res.status(500).send("Error creating forum post");
  }
});


app.get("/forum/:id", async function (req, res) {
  const postId = req.params.id;

  try {
    const postRows = await db.query(
      `SELECT fp.post_id, fp.title, fp.content, fp.ingredient_tag, fp.created_at, u.username
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.user_id
       WHERE fp.post_id = ?`,
      [postId]
    );

    if (!postRows.length) return res.send("Post not found");

    const comments = await db.query(
      `SELECT fc.comment_id, fc.post_id, fc.user_id, fc.comment, fc.upvotes, fc.created_at, u.username
       FROM forum_comments fc
       JOIN users u ON fc.user_id = u.user_id
       WHERE fc.post_id = ?
       ORDER BY fc.created_at ASC`,
      [postId]
    );

    res.render("forum_show", {
      post: postRows[0],
      comments: comments
    });
  } catch (err) {
    console.error("FORUM POST ERROR:", err);
    res.status(500).send("Error loading forum post");
  }
});


app.post("/forum/:id/comments", requireLogin, async function (req, res) {
  const postId = req.params.id;
  const comment = req.body.comment;

  try {
    await db.query(
      "INSERT INTO forum_comments (post_id, user_id, comment) VALUES (?, ?, ?)",
      [postId, req.session.uid, comment]
    );
    res.redirect("/forum/" + postId);
  } catch (err) {
    console.error("FORUM COMMENT ERROR:", err);
    res.status(500).send("Error adding comment");
  }
});


//forum moderation
app.post("/admin/forum/posts/:id/delete", requireAdmin, async function (req, res) {
  try {
    await db.query("DELETE FROM forum_posts WHERE post_id = ?", [req.params.id]);
    res.redirect("/forum");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});


app.post("/admin/forum/comments/:id/delete", requireAdmin, async function (req, res) {
  try {
    const rows = await db.query("SELECT * FROM forum_comments WHERE comment_id = ?", [req.params.id]);
    if (!rows.length) return res.send("Comment not found");

    await db.query("DELETE FROM forum_comments WHERE comment_id = ?", [req.params.id]);
    res.redirect("/forum/" + rows[0].post_id);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting comment");
  }
});


// reviews form route
app.get("/recipes/:id/reviews", function (req, res) {
  const recipeId = req.params.id;

  Promise.all([
    db.query("SELECT * FROM recipes WHERE recipe_id = ?", [recipeId]),
    db.query(
      `SELECT r.review_id, r.recipe_id, r.user_id AS reviewer_id, r.rating, r.comment, r.created_at, u.username, re.recipe_title
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN recipes re ON r.recipe_id = re.recipe_id
       WHERE r.recipe_id = ?
       ORDER BY r.created_at DESC`,
      [recipeId]
    )
  ])
    .then(function ([recipeRows, reviewRows]) {
      if (!recipeRows.length) return res.send("Recipe not found");

      res.render("review_form", {
        targetRecipe: recipeRows[0],
        reviews: reviewRows
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading review form");
    });
});


// all reviews get route
app.get("/reviews", function (req, res) {
  const sql = `
      SELECT r.review_id, r.recipe_id, r.user_id AS reviewer_id, r.rating, r.comment, r.created_at, u.username, re.recipe_title
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       JOIN recipes re ON r.recipe_id = re.recipe_id
       ORDER BY r.created_at DESC`
  ;

  db.query(sql)
    .then(function (reviews) {
      res.render("reviews", { reviews: reviews });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error loading reviews");
    });
});


// sign up route
app.get("/signup", function (req, res) {
  res.render("signup");
});


// sign in route
app.get("/signin", function (req, res) {
  res.render("signin");
});


// logout route
app.get("/logout", function (req, res) {
  req.session.destroy(function () {
    res.redirect("/");
  });
});


// register post route
app.post("/set-password", async function (req, res) {
  const params = req.body;
  const user = new User(params.username);

  try {
    const uId = await user.getIdFromUsername();

    if (uId) {
      await user.setUserPassword(params.password);
      return res.redirect("/signin");
    } else {
      await user.addUser(params.username, params.email, params.password);
      return res.redirect("/");
    }
  } catch (err) {
    console.error("Error while setting password", err.message);
    res.status(500).send("Error setting password");
  }
});


// login post route
app.post("/authenticate", async function (req, res) {
  const params = req.body;
  const user = new User(params.username);

  try {
    const uId = await user.getIdFromUsername();

    if (!uId) {
      return res.send("Invalid username");
    }

    const match = await user.authenticate(params.password);

    if (!match) {
      return res.send("Invalid password");
    }

    const rows = await db.query(
      "SELECT user_id, username, is_admin FROM users WHERE user_id = ?",
      [uId]
    );

    req.session.uid = uId;
    req.session.loggedIn = true;
    req.session.username = rows[0].username;
    req.session.isAdmin = !!rows[0].is_admin;

    return res.redirect("/profile");
  } catch (err) {
    console.error("Error while comparing password", err.message);
    res.status(500).send("Login error");
  }
});


// logged in profile - protected
app.get("/profile", requireLogin, async function (req, res) {
  try {
    const users = await db.query("SELECT * FROM users WHERE user_id = ?", [req.session.uid]);
    const recipes = await db.query("SELECT * FROM recipes WHERE author_id = ?", [req.session.uid]);

    if (!users.length) {
      return res.send("User not found");
    }

    res.render("profile", {
      user: users[0],
      recipes: recipes
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
});


// matches route
app.get("/matches", requireLogin, async function (req, res) {
  const userId = req.session.uid;

  const sql = `
    SELECT 
      r.recipe_id,
      r.recipe_title,
      r.summary,
      r.image_path,
      u.username,
      COUNT(*) AS shared_tags
    FROM recipes r
    JOIN users u ON r.author_id = u.user_id
    JOIN recipe_tags rt ON r.recipe_id = rt.recipe_id
    WHERE r.author_id != ?
      AND rt.tag_id IN (
        SELECT rt2.tag_id
        FROM recipes myr
        JOIN recipe_tags rt2 ON myr.recipe_id = rt2.recipe_id
        WHERE myr.author_id = ?
      )
    GROUP BY r.recipe_id, r.recipe_title, r.summary, r.image_path, u.username
    ORDER BY shared_tags DESC, r.recipe_title ASC
  `;

  try {
    const matches = await db.query(sql, [userId, userId]);
    res.render("matches", { matches: matches });
  } catch (err) {
    console.error("MATCHES ERROR:", err);
    res.status(500).send("Error loading matches");
  }
});

//learderboard route
app.get("/leaderboard", async function (req, res) {
  try {
    const users = await db.query(
      "SELECT user_id, username, points FROM users ORDER BY points DESC, username ASC"
    );
    res.render("leaderboard", { users: users });
  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).send("Error loading leaderboard");
  }
});


// Start server on port 3000
app.listen(3000, function () {
  console.log(`Recipe app running at http://127.0.0.1:3000/`);
});
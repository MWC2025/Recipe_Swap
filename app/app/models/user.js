const db = require("../services/db");
const bcrypt = require("bcryptjs");



class User {
  user_id;
  username;
  email_address;

  constructor(username) {
    this.username = username;
  }

  async getIdFromUsername() {
    const sql = "SELECT user_id, username, email_address FROM users WHERE username = ?";
    const result = await db.query(sql, [this.username]);

    if (result.length) {
      this.user_id = result[0].user_id;
      this.username = result[0].username;
      this.email_address = result[0].email_address;
      return this.user_id;
    } else {
      return false;
    }
  }

  async setUserPassword(password) {
    const pw = await bcrypt.hash(password, 10);
    const sql = "UPDATE users SET password_hash = ? WHERE user_id = ?";
    await db.query(sql, [pw, this.user_id]);
    return true;
  }

  async addUser(username, email, password) {
    const pw = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, email_address, password_hash) VALUES (?, ?, ?)";
    const result = await db.query(sql, [username, email, pw]);
    this.user_id = result.insertId;
    this.username = username;
    this.email_address = email;
    return true;
  }

  async authenticate(submitted) {
    const sql = "SELECT password_hash FROM users WHERE user_id = ?";
    const result = await db.query(sql, [this.user_id]);

    if (!result.length) {
      return false;
    }

    const match = await bcrypt.compare(submitted, result[0].password_hash);
    return match;
  }
}

module.exports = {
  User
};
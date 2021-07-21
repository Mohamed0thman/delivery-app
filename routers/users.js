const express = require("express");
const router = new express.Router();
const bcrybt = require("bcrypt");

const db = require("../db/index");

const jwtGenerator = require("../utiles/jwtGenerator");
const auth = require("../middleware/auth");

router.post("/api/users/register", async (req, res) => {
  const { first_name, last_name, email, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(401).json("not match");
    }
    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length > 0) {
      return res.status(401).json("user already exist!");
    }
    const salt = await bcrybt.genSalt(10);

    const bcryptPassword = await bcrybt.hash(password, salt);

    const newUser = await db.query(
      "INSERT INTO users (first_name, last_name, email, password) values ($1, $2, $3, $4) returning *",
      [first_name, last_name, email, bcryptPassword]
    );

    const jwtToken = jwtGenerator(newUser.rows[0].user_id);

    res.status(200).json({
      status: "success",
      results: newUser.rows.length,
      user: { ...newUser.rows[0], token: jwtToken },
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("invalid Credential");
    }

    const validPassword = await bcrybt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json("invalid Credential");
    }

    const jwtToken = jwtGenerator(user.rows[0].user_id);

    console.log(jwtToken);
    res.status(200).json({
      status: "success",
      results: user.rows.length,
      user: { ...user.rows[0], token: jwtToken },
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/api/users/:userId", auth, async (req, res) => {
  try {
    const user = await db.query(
      `   
      select u.user_id, concat(u.first_name, ' ', u.last_name) as fullName, u.email , 
      json_agg( sc.* ) as  shoppingCart from users  as u
      left join shop_Cart as sc using(user_id)
      left join products as p using(product_id)
      where user_id = $1
      group by u.user_id, fullName,  u.email
      order by u.user_id
      `,
      [req.params.userId]
    );

    res.status(200).json({
      status: "success",
      results: user.rows.length,
      user: user.rows,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

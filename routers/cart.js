const express = require("express");
const router = new express.Router();
const db = require("../db/index");
const auth = require("../middleware/auth");

router.post("/api/shopping-cart", auth, async (req, res) => {
  const { user_id, shop_id, product_id, quantity } = req.body;

  try {
    const insertedData = await db.query(
      "INSERT INTO shop_cart (user_id, shop_id, product_id, quantity) values ($1, $2, $3, $4) returning cart_id",
      [user_id, shop_id, product_id, quantity]
    );
    console.log(insertedData.rows[0]);

    const selectedData = await db.query(
      `
        select * from shop_Cart as sc 
        join products as p using(product_id)
        where user_id = $1
        and cart_id = $2
      `,
      [user_id, insertedData.rows[0].cart_id]
    );

    console.log(selectedData);

    res.status(200).json({
      status: "success",
      results: selectedData.rows.length,
      cartItem: selectedData.rows,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

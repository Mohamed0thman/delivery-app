const express = require("express");
const router = new express.Router();
const db = require("../db/index");
const auth = require("../middleware/auth");

router.post("/api/orders", auth, async (req, res) => {
  const { user_id, orderItems } = req.body;

  try {
    const isertOrder = "INSERT INTO orders (user_id) values ($1) returning* ";
    const insertItems =
      "INSERT INTO order_items (shop_id,product_id, order_id, quantity) values ($1, $2, $3, $4) returning*";

    const orders = await db.query(isertOrder, [user_id]);

    console.log("order", orders);

    function queryPromise(item) {
      const { shop_id, product_id, quantity } = item;

      return new Promise((resolve, reject) => {
        const orderItems = db
          .query(insertItems, [
            shop_id,
            product_id,
            orders.rows[0].order_id,
            quantity,
          ])
          .then((data) => data.rows);

        return resolve(orderItems);
      });
    }

    const result = await Promise.all(
      orderItems.map((item, i) => queryPromise(item))
    );

    console.log("result", result);

    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/api/orders/:userId", async (req, res) => {
  console.log(req.params.userId);

  try {
    const data = await db.query(
      `
        select order_id,json_agg(json_build_object(
              'shop_id', s.shop_id,
              'shop_name', s.shop_name, 
              'product_id', p.product_id, 
              'product_name', p.product_name,
              'product_image', p.product_image,
              'price', p.price,
              'quantity', oi.quantity
        )) as orderItems
        from orders 
        join order_items as oi USING(order_id)
        join shops as s USING(shop_id) 
        join products  as p using(product_id)
        where user_id = $1
        GROUP by order_id
      `,
      [req.params.userId]
    );
    res.status(200).json({
      status: "success",
      results: data.rows.length,
      data: data.rows,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

const express = require("express");
const fs = require("fs");
const router = new express.Router();
const db = require("../db/index");
const upload = require("../utiles/multer");

router.get("/", (req, res) => {
  res.send("welcome to backend");
});

const formatShops = (shops, fullUrl) => {
  return shops.map((shop) => ({
    id: shop.shop_id,
    categoryId: shop.category_id,
    image: shop.shop_image,
    name: shop.shop_name,
    type: shop.shop_type,
    rating: shop.average_rating ? shop.average_rating : 0,
    status: shop.shop_status,
    address: shop.address,
    latitude: shop.latitude,
    longitude: shop.longitude,
    baseLink: fullUrl,
    createdAt: shop.created_at,
    updatedAt: shop.updated_at,
  }));
};

router.post("/api/shops", upload.single("image"), async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}`;

  const {
    category_id,
    shop_name,
    shop_type,
    shop_status,
    address,
    latitude,
    longitude,
  } = JSON.parse(req.body.document);
  const file = req.file;

  try {
    const data = await db.query(
      "INSERT INTO shops (category_id,shop_name, shop_type, shop_status, shop_image, address, latitude, longitude ) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *",
      [
        category_id,
        shop_name,
        shop_type,
        shop_status,
        file.filename,
        address,
        latitude,
        longitude,
      ]
    );
    const shops = formatShops(data.rows, fullUrl);

    res.status(200).json({
      status: "success",
      results: shops.length,
      stores: shops,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/api/shops", async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}`;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};

  try {
    const data = await db.query(
      `SELECT *, count(*) OVER( )  AS full_count FROM shops 
      left join (select shop_id, count(*), trunc(avg(rating),1)as average_rating from feedback 
      group by shop_id)as feedback USING(shop_id)
      ORDER BY  shop_id  OFFSET $1 ROWS FETCH first $2 ROW ONLY`,
      [startIndex, limit]
    );

    const fullCount = data.rows.length > 0 ? data.rows[0].full_count : 0;

    if (endIndex < fullCount) {
      results.next = {
        page: page + 1,
        limit: limit,
      };
    }

    const shops = formatShops(data.rows, fullUrl);

    if (!data.rows.length) {
      res.status(200).json({
        status: "success",
        results: shops.length,
        message: "no more shops",
      });
    }
    res.status(200).json({
      status: "success",
      results: shops.length,
      next: results.next,
      stores: shops,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/api/shops/:categoryName", async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}`;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};

  console.log(req.params.categoryName);

  try {
    const category = await db.query(
      `select * from categories where category_name = $1`,
      [req.params.categoryName]
    );

    console.log(category);
    const data = await db.query(
      `SELECT *, count(*) OVER( )  AS full_count FROM shops 
      left join (select shop_id, count(*), trunc(avg(rating),1)as average_rating from feedback 
      group by shop_id)as feedback USING(shop_id)
      where category_id = $1
      ORDER BY  shop_id  OFFSET $2 ROWS FETCH first $3 ROW ONLY`,
      [category.rows[0].category_id, startIndex, limit]
    );

    const fullCount = data.rows.length > 0 ? data.rows[0].full_count : 0;

    if (endIndex < fullCount) {
      results.next = {
        page: page + 1,
        limit: limit,
      };
    }

    const shops = formatShops(data.rows, fullUrl);

    res.status(200).json({
      status: "success",
      results: shops.length,
      next: results.next,
      stores: shops,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

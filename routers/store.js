const express = require("express");
const fs = require("fs");
const router = new express.Router();
const db = require("../db/index");
const upload = require("../utiles/multer");

router.get("/", (req, res) => {
  res.send("welcome to backend");
});

const formatShops = (shops) => {
  return shops.map((shop) => ({
    id: shop.shop_id,
    image: shop.shop_image,
    name: shop.shop_name,
    type: shop.shop_type,
    rate: 0,
    status: shop.shop_status,
    address: shop.address,
    latitude: shop.latitude,
    longitude: shop.longitude,
    baseLink: process.env.BASE_LINK,
    createdAt: shop.created_at,
    updatedAt: shop.updated_at,
  }));
};

router.post("/api/shops", upload.single("image"), async (req, res) => {
  const { shop_name, shop_type, shop_status, address, latitude, longitude } =
    JSON.parse(req.body.document);
  const file = req.file;

  try {
    const data = await db.query(
      "INSERT INTO shops (shop_name, shop_type, shop_status, shop_image, address, latitude, longitude ) values ($1, $2, $3, $4, $5, $6, $7) returning *",
      [
        shop_name,
        shop_type,
        shop_status,
        file.filename,
        address,
        latitude,
        longitude,
      ]
    );
    const shops = formatShops(data.rows);

    res.status(200).json({
      status: "success",
      results: shops.length,
      shops: shops,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/api/shops", async (req, res) => {
  try {
    const data = await db.query("SELECT * FROM shops");
    const shops = formatShops(data.rows);
    res.status(200).json({
      status: "success",
      results: shops.length,
      shops: shops,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

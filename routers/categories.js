const express = require("express");
const router = new express.Router();
const db = require("../db/index");
const upload = require("../utiles/multer");

const formatCategories = (categories, fullUrl) =>
  categories.map((category) => ({
    id: category.category_id,
    image: category.category_image,
    name: category.category_name,
    baseLink: fullUrl,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }));

router.post("/api/categories", upload.single("image"), async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}`;

  const { category_name } = JSON.parse(req.body.document);
  const file = req.file;

  try {
    const data = await db.query(
      "INSERT INTO categories (category_name, category_image) values ($1, $2) returning *",
      [category_name, file.filename]
    );

    const categories = formatCategories(data.rows, fullUrl);

    res.status(200).json({
      status: "success",
      results: categories.length,
      categories: categories,
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/api/categories", async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}`;

  try {
    const data = await db.query("SELECT * from categories");

    const categories = formatCategories(data.rows, fullUrl);

    console.log(categories);

    res.status(200).json({
      status: "success",
      results: categories.length,
      categories: categories,
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

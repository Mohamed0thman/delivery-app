const express = require("express");
const router = new express.Router();
const db = require("../db/index");

router.post("/api/feedback", async (req, res) => {
  const { store_id, user_id, rating, comment } = req.body;
  try {
    const feedback = await db.query(
      "INSERT INTO feedback ( store_id, user_id, rating, comment ) values ($1, $2, $3, $4) returning *",
      [store_id, user_id, rating, comment]
    );

    res.status(200).json({
      status: "success",
      results: feedback.rows.length,

      data: {
        feedback: feedback.rows[0],
      },
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

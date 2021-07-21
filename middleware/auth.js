const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    console.log(token);

    if (!token) {
      return res.status(403).json({ msg: "authorization denied" });
    }
    const verify = jwt.verify(token, process.env.JWT_SECRET);

    req.user = verify.user;
    next();
  } catch (err) {
    res.status(401).send({ Error: "plese auth" });
  }
};

module.exports =  auth ;

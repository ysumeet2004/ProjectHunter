const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/user/login');
  }

  try {
    const decoded = jwt.verify(token, 'sumeet');
    req.user = decoded;
    res.locals.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.redirect('/user/login');
  }
}

module.exports = verifyToken;

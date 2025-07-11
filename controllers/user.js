const User = require('../models/user');
const jwt = require('jsonwebtoken');
const secret = 'sumeet';
async function userSignupHandler(req, res) {
  const { name, email, password, skills } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User with this email already exists.');
    }

    // Create new user instance
    const newUser = new User({
      name,
      email,
      password, // consider hashing this in production
      skills,
    });

    // Save to DB
    await newUser.save();

    // Redirect or respond with success
    res.redirect('/user/login'); // or res.send('User created successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}

async function loginHandler(req, res) {
  const { mail, pwd } = req.body;
  const user = await User.findOne({ email: mail });

  if (!user) {
    return res.status(400).render('login', { error: 'No user found with this email' });
  }

  if (user.password !== pwd) {
    return res.status(400).render('login', { error: 'Incorrect password' });
  }

  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    'sumeet' // use env in real apps
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // true in production
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  return res.render('home', { user });
}


module.exports = {userSignupHandler,loginHandler};
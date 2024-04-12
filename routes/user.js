const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET user profile. */
router.get('/profile', function(req, res, next) {
    res.json({
        message: 'You made it to the secure route!',
        user: req.user,
        token: req.query.secret_token
    })
});

module.exports = router;
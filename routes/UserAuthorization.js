const express = require('express');
const router = express.Router();

router.get('', (req, res)=>{
    res.send('Hello SignIn!');
})

router.get('/signin', (req, res)=>{
    res.send("SignIn Route!");
})

module.exports = router;
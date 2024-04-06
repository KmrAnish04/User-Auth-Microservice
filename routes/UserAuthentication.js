const express = require('express');
const router = express.Router();

router.get('', (req, res)=>{
    res.send('Hello Login!');
})

router.get('/login', (req, res)=>{
    res.send("LogIn Route!");
})

module.exports = router;
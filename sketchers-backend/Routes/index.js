const express = require("express");
const router = express.Router();
const {registerArtist, VerifyArtist , verifyEmail} = require('../Controllers/Authentication/artists');


// Authentication For Artists
router.post('/registerArtist', registerArtist);
router.post('/verifyArtist', VerifyArtist);
router.post('/verifyEmail', verifyEmail)



module.exports = router;
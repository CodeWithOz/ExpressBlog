const express = require('express');
const router = express.Router();

// Log a user out
router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

module.exports = router;

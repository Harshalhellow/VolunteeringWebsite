var express = require('express');
var router = express.Router();
module.exports = router;

// Catch all remaining paths and redirect.
router.get('/*', function(req, res, next) {
  res.redirect('/homepage.html');
});

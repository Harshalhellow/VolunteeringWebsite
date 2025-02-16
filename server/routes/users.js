var express = require('express');
var router = express.Router();
module.exports = router;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/mySession', function(req, res, next) { //! Temporary.
  res.json(req.session);
});

var express = require('express');
var router = express.Router();
var moodle = require('../handlers/moodle');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/moodledata', function(req, res, next) {
    return moodle.getMoodleData(req, res);
});

router.get('/moodleusers', function(req, res, next) {
    return moodle.getSQLdb(req, res);
});

module.exports = router;

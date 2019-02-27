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

router.post('/wellnezz/updatecoursesign', function(req, res) {
    return moodle.updateCourseSign(req, res);
});

router.post('/wellnezz/proposedcourse', function(req, res) {
    return moodle.addProposedCourse(req, res);
});

router.post('/updateuser', function(req, res) {
    return moodle.updateUser(req, res);
});

module.exports = router;

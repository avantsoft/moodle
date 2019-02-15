const fs = require('fs');
const moodle_data = require('../public/assets/moodle_data');
const course_queries = require('../public/assets/course_queries');

module.exports = {
    getMoodleData: function (req, res) {
        var req = req.query;
        console.log(moodle_data);
        res.send(moodle_data);
    },

    getSQLdb: function (req, res) {
        let query = "SELECT * FROM `mdl_user` ORDER BY username ASC"; // query database to get all the players
        var db = global.db;
        var response = [];
        // execute query
        for (var i = 0; i < course_queries.length; i++) {
            db.query(course_queries[i], function (err, result) {
                response.push({
                    i: err ? err : result
                });
                if (response.length === course_queries.length) {
                    res.send(response);
                }
            });
        }
    },

    updateCourseSign: function (req, res) {
        var data = req.body;
        var sign = data.sign;
        var courseId = data.courseId;
        var userid = data.userid;

        if (!(sign || courseId || userid)) {
            return res.status(400).send({
                message: 'Sign, CourseId & UserId are required.'
            });
        }
        var findQuery = "SELECT * FROM mdl_course_sign WHERE courseid=" + courseId + " AND userId=" + userid;

        var insertQuery = "INSERT INTO mdl_course_sign (courseid, sign, userId) VALUES(" + courseId + ", " + sign + ", " + userid + ")";
        var db = global.db;

        var updateQuery = "UPDATE mdl_course_sign SET sign = " + sign +" WHERE courseId = " + courseId + " AND userId=" + userid;

        db.query(findQuery, function (err, result) {
            if(result.length) {
                db.query(updateQuery, function (err, result) {
                    res.send(result);
                });
            } else {
                db.query(insertQuery, function (err, result) {
                    res.send(result);
                });
            }
        });
    }
};
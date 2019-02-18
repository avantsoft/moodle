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

        var updateQuery = "UPDATE mdl_course_sign SET sign = " + sign + " WHERE courseId = " + courseId + " AND userId=" + userid;

        db.query(findQuery, function (err, result) {
            if (result.length) {
                db.query(updateQuery, function (err, result) {
                    res.send(err ? err : data);
                });
            } else {
                db.query(insertQuery, function (err, result) {
                    res.send(err ? err : data);
                });
            }
        });
    },

    addProposedCourse: function (req, res) {
        var data = req.body;
        var fullname = data.fullname;
        var shortname = data.shortname;
        var summary = data.summary;
        var idnumber = data.idnumber;
        var startdate = data.startdate;
        var enddate = data.enddate;

        if (!(fullname && shortname && summary)) {
            return res.status(400).send({
                message: 'fullname, shortname & summary are required.'
            });
        }

        shortname = 'proposed_' + shortname;

        startdate = startdate ? new Date(startdate).getTime() : new Date().getTime();
        enddate = enddate ? new Date(enddate).getTime() : 0;

        var addCourseQuery = "INSERT INTO mdl_course (category, sortorder, fullname, shortname, idnumber, summary, summaryformat, format, showgrades, newsitems, startdate, enddate, marker, maxbytes, legacyfiles, showreports, visible, visibleold, groupmode, groupmodeforce, defaultgroupingid, lang, calendartype, theme, timecreated, timemodified, requested, enablecompletion, completionnotify, cacherev) VALUES (3, 10001, '" + fullname + "', '" + shortname + "', '" + idnumber + "', '" + summary + "', 1, 'topics', 1, 5, " + startdate + ", " + enddate + ", 0, 0, 0, 0, 1, 1, 0, 0, 0, '', '', '', " + new Date().getTime() + ", 0, 0, 1, 0, 1546607956)";

        var courseFindQuery = "SELECT * FROM mdl_course WHERE shortname='" + shortname + "' AND fullname='" + fullname + "'";

        var db = global.db;

        db.query(courseFindQuery, function (err, course) {
            if (!course.length) {
                db.query(addCourseQuery, function (err, result) {
                    if (result) {
                        db.query(courseFindQuery, function (err, course) {
                            if (course.length) {
                                courseId = course[0].id;
                                var insertCourseFormatQuery = "INSERT INTO mdl_course_format_options (courseid, format, sectionid, name, value) VALUES(" + courseId + ", 'topics', 0, 'coursedisplay', '0')";

                                var enrollUserQuery = "INSERT INTO mdl_enrol (enrol, status, courseid, sortorder, name, enrolperiod, enrolstartdate, enrolenddate, expirynotify, expirythreshold, notifyall, password, cost, currency, roleid, customint1, customint2, customint3, customint4, customint5, customint6, customint7, customint8, customchar1, customchar2, customchar3, customdec1, customdec2, customtext1, customtext2, customtext3, customtext4, timecreated, timemodified) VALUES('guest', 1, " + courseId + ", 1, NULL, 0, 0, 0, 0, 0, 0, '', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1543383718, 1543383718)";

                                db.query(insertCourseFormatQuery, function (err, result) {
                                    db.query(enrollUserQuery, function (err, result) {
                                        res.send(err || result);
                                    });
                                });
                            }
                        });
                    }
                });
            } else {
                return res.status(400).send({
                    message: 'This course is already exist.'
                });
            }
        });
    }
};
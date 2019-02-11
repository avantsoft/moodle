const fs = require('fs');
const moodle_data = require('../public/assets/moodle_data');

module.exports = {
    getMoodleData: function(req, res) {
        var req = req.query;
        console.log(moodle_data);
        res.send(moodle_data);
    },

    getSQLdb: function(req, res) {
        let query = "SELECT * FROM `mdl_user` ORDER BY username ASC"; // query database to get all the players
        var db = global.db;
        // execute query
        db.query(query, function(err, result) {
            if (err) {
                res.redirect('/');
            }
            res.send(result);
        });
    }
};
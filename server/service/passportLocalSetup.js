const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const connection = require("../database/databaseConnect").connection;
// const User = connection.models.LocalUserModel;
const validPassword = require("./cryptoService").validPassword;
const userLoginSchema = require("../models/userLoginSchema");
const User = userLoginSchema.UserModel;

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
    },
    function(username, password, cb) {
        User.findOne({username: username})
            .then((user) => {

                if (!user) { return cb(null, false) } // the callback function, cb, expects two values: (err, user). 
                
                const isValid = validPassword(password, user.hash, user.salt);

                if (isValid) {
                    return cb(null, user);
                } else {
                    return cb(null, false);
                }
            })
            .catch((err) => {   
                cb(err);
            });
    }
));
passport.serializeUser(function(user, cb) {
    return cb(null, user.id);
});
passport.deserializeUser(function(id, cb) {
    User.findById(id, function (err, user) {
        if (err) { return cb(err); }
        return cb(null, user);
    });
});







const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt;
const fs = require('fs');
const path = require('path');
const UserModel = require("../database/projectDatabase").UserModel;

// Go up one directory, then look for file name
const pathToKey = path.join(__dirname, 'id_rsa_pub.pem');

// The verifying public key
const PUB_KEY = fs.readFileSync(pathToKey, 'utf8');

// At a minimum, you must pass the `jwtFromRequest` and `secretOrKey` properties
const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ['RS256'],
  ignoreExpiration: false,
};

// // The JWT payload is passed into the verify callback
// passport.use(new JwtStrategy(options, function(jwt_payload, done) {
//     // Since we are here, the JWT is valid!

//     // We will assign the `sub` property on the JWT to the database ID of user
//     User.findOne({_id: jwt_payload.sub}, function(err, user) {

//         if (err) {
//             return done(err, false);
//         }
//         if (user) {

//             // Since we are here, the JWT is valid and our user is valid, so we are authorized!
//             return done(null, user);
//         } else {
//             return done(null, false);
//         }

//     });

// }));
// app.js will pass the global passport object here, and this function will configure it

// The JWT payload is passed into the verify callback
passport.use(new JwtStrategy(options, function(jwt_payload, done) {
    // console.log(jwt_payload.sub);
    // We will assign the `sub` property on the JWT to the database ID of user
    UserModel.findOne({_id: jwt_payload.sub}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));
// module.exports = (passport) => {


// }
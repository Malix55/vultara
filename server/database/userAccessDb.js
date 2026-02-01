const express = require("express");
const router = express.Router();
const UserSchema = require("../models/userLoginSchema").UserSchema;
// const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
// const UserModel = atlasTrialDbConnection.model("UserModel", UserSchema, "localUser");
const passport = require('passport');
const cryptoService = require("../service/cryptoService");
const ExtractJwt = require('passport-jwt').ExtractJwt;
require('dotenv').config({ path: __dirname + '/./../.env' });
require("../service/passportJwtSetup");
const UserModel = require("./projectDatabase").UserModel;

router
    .route("/login")
    .get(async (req, res, next) => {
        try {
            // res.json({redirect:"http://localhost:4200/login"});
            // res.send("Username or Password incorrect!");
        } catch (err) {
            res.status(500);
            res.end();
        }
    })
    .post(async (req, res, next) => {
        try {
            // check if token has expired
            let token = ExtractJwt.fromAuthHeaderAsBearerToken()
            // jwt strategy
            await UserModel.findOne({ username: req.body.username, $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }] })
                .then((user) => {
                    if (!user) {
                        res.status(401).json({
                            redirect: "/login", isAuth: false, username: undefined, role: undefined, projectAccess: undefined, _id: undefined, userEmail: undefined,
                            message: "incorrect user name or password."
                        });
                    }

                    if (user.loginAttemptCounter && user.loginAttemptCounter >= 4) {
                        res.status(401).json({
                            redirect: "/login", isAuth: false, username: undefined, role: undefined, projectAccess: undefined, _id: undefined, userEmail: undefined,
                            message: "Your account has been locked due to too many failed attempts. Contact your administrator to unlock.",
                            loginAttemptCounter: user.loginAttemptCounter
                        });
                    } else {
                        const isValid = cryptoService.validPassword(req.body.password, user.hash, user.salt);
                        if (isValid) {
                            if (user.loginAttemptCounter && user.loginAttemptCounter > 0) {
                                const filter = { _id: user._id };
                                const update = {
                                    loginAttemptCounter: 0,
                                    lastSuccessfulLogin: new Date()
                                };
                                UserModel.findOneAndUpdate(filter, update, {
                                    new: true,
                                    useFindAndModify: false
                                }).then((result) => {
                                    const tokenObject = cryptoService.issueJWT(result);
                                    res.status(200).json({
                                        redirect: "/dashboard", isAuth: true, username: user.username, role: user.role, projectAccess: user.projectAccess, userEmail: user.userEmail,
                                        token: tokenObject.token, expiresIn: tokenObject.expires, _id: user._id
                                    });
                                });
                            } else {
                                const filter = { _id: user._id };
                                UserModel.findOneAndUpdate(filter, { lastSuccessfulLogin: new Date() }, {
                                    new: true,
                                    useFindAndModify: false
                                }).then((result) => {
                                    const tokenObject = cryptoService.issueJWT(result);
                                    res.status(200).json({
                                        redirect: "/dashboard", isAuth: true, username: result.username, role: result.role, projectAccess: result.projectAccess, userEmail: result.userEmail,
                                        token: tokenObject.token, expiresIn: tokenObject.expires, _id: result._id
                                    });
                                });  
                            }
                        } else {
                            const filter = { _id: user._id };
                            const existingLoginAttempts = user.loginAttemptCounter ? user.loginAttemptCounter : 0;
                            if (existingLoginAttempts < 4) {
                                const loginAttempt = existingLoginAttempts + 1;
                                const update = { loginAttemptCounter: loginAttempt };
                                UserModel.findOneAndUpdate(filter, update, {
                                    new: true,
                                    useFindAndModify: false
                                }).then((result) => {
                                    res.status(401).json({
                                        redirect: "/login", isAuth: false, username: undefined, role: undefined, projectAccess: undefined, _id: undefined, userEmail: undefined,
                                        message: "incorrect user name or password.",
                                        loginAttemptCounter: result.loginAttemptCounter
                                    });
                                });
                            } else {
                                res.status(401).json({
                                    redirect: "/login", isAuth: false, username: undefined, role: undefined, projectAccess: undefined, _id: undefined, userEmail: undefined,
                                    message: "incorrect user name or password.",
                                    loginAttemptCounter: existingLoginAttempts
                                });
                            }
                        }
                    }
                })
        } catch (err) {
            res.status(500);
            res.end();
        }

        // local strategy
        // try {
        //     // console.log(req.body);
        //     passport.authenticate(process.env.AUTH_STRATEGY, function(err, user) {
        //         console.log("user is: " + user);
        //         if (user) {
        //             req.logIn(user, function(error) {
        //                 if (error) { console.log(error); return next()};
        //                 return
        //             });
        //             // req.session.passport = {user: user.id};
        //             res.json({"redirect": "/home",  "isAuth": true, "username": user.username, "role": user.role});
        //             return next();
        //         } else {
        //             res.json({"redirect": "/login", "isAuth": false, "username": undefined, "role": undefined});
        //         }
        //     })(req, res, next);
        // } catch (err) {
        //     res.status(401);
        //     res.end();
        // }
    });

router
    .route("/logout")
    .get(async (req, res, next) => {
        try { // this is for local strategy. for jwt strategy, logout doesn't need backend.
            req.logout();
            req.session.destroy();
            res.json({ "redirect": "/login" });
        } catch (err) {
            res.status(500);
            res.end();
        }
    });

router
    .route("/auth")
    // .get(async (req, res, next) => { // local strategy
    //     try {
    //         cryptoService.isAuth(req, res, next);
    //     } catch (err) {
    //         res.status(500);
    //         res.end();
    //     }
    // })
    .get(async (req, res, next) => {
        try {
            // console.log(`/auth path is executed.`);
            // console.log(req.headers)
            passport.authenticate("jwt", { session: false }, (err, user) => {
                if (user) {
                    console.log(`User ${user.username} is authenticated. Access granted.`);
                    res.status(200).json({ redirect: "/dashboard", isAuth: true, username: user.username, role: user.role, projectAccess: user.projectAccess, _id: user._id, userEmail: user.userEmail });
                } else {
                    console.log(`error occurred during the authentication process: ${err}. Access denied.`);
                    res.status(401).json({
                        redirect: "/login", isAuth: false, username: undefined, role: undefined, projectAccess: undefined, _id: undefined,
                        message: `Error occurred during the authentication process. Access denied.`
                    });
                }
            })(req, res, next); // jwt strategy
        } catch (err) {
            res.status(500);
            res.end();
        }
    })

// router
//     .route("/getAllUsers")
//     .get(async (req, res, next) => {
//         try {
//             console.log(`/auth path is executed.`);

//              let getAllUsers = await UserModel.find();
//              console.log('========================= I am here ===========================')
//              console.log(getAllUsers);
//              console.log('========================= I am here ===========================')
//             } catch (err) {
//                 res.status(500);
//                 res.end();
//         }
//     })

// .post(async (req, res, next) => { // this is to verify the jwt token
//     try {
//         cryptoService.jwtVerify(req);
//         res.status(200).json({"isAuth": true});
//     } catch (err) {
//         res.status(500);
//         res.end();
//     }
// })

module.exports = router;







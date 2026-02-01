const express = require("express");
const mongoose = require("mongoose");
const { sendEmail } = require("../service/emailService");
const router = express.Router();
const UserSchema = require("../models/userLoginSchema").UserSchema;
const atlasTrialDbConnection = require("./atlasTrialDatabaseConnect").atlasTrialDbConnection;
const atlasTrialLocalUserConnection = require("./atlasTrialDatabaseConnect").atlasTrialLocalUserConnection;
// const UserModel = atlasTrialDbConnection.model("UserModel", UserSchema, "localUser");
const ThreatListSchema = require("../models/projectModelSchema").ThreatListSchema;
const ThreatListSchemaWithTime = new mongoose.Schema(ThreatListSchema, { timestamps: true })
const UserAddedThreatLibModel = atlasTrialDbConnection.model("UserAddedThreatLibModel", ThreatListSchemaWithTime, "userAddedThreatLib");
const genPassword = require("../service/cryptoService").genPassword;
const validPassword = require("../service/cryptoService").validPassword;

require('dotenv').config({ path: __dirname + '/./../.env' });
const UserModel = require("./projectDatabase").UserModel;

router
    .route("/register")
    // .get(async (req, res, next) => {
    //     try {
    //         res.redirect("http://localhost:4200/register");
    //     } catch (err) {
    //         res.status(500);
    //         res.end();
    //     }
    // })
    .post(async (req, res, next) => {
        try {

            let userExists = false;
            await UserModel.findOne({ username: req.body.username })
                .then(user => {
                    if (user && !user.isDeleted) {
                        userExists = true;
                    }
                })

            if (!userExists) {
                const saltHash = genPassword(req.body.password);
                const salt = saltHash.salt;
                const hash = saltHash.hash;
                const newUser = new UserModel({
                    username: req.body.username,
                    hash: hash,
                    salt: salt,
                    role: req.body.role,
                    projectAccessId: req.body.projectAccessId,
                    userEmail: req.body.userEmail
                });
                //console.log(newUser);
                newUser.save()
                    .then((user) => {
                        // console.log(user);
                        res.status(200).send({ msg: "New user account is registered!", newUser:true,user });
                    });
            } else {
                res.status(200).send({ msg: "Username '" + req.body.username + "' already exists. Usernames must be unique." });
            }
        } catch (err) {
            res.status(500).send("User account register error!");
            res.end();
        }
    });

router
    .route("/admin")
    .get(async (req, res, next) => { // retrieve user account info
        try {
            if(req.query.normal) {
               const users = await UserModel.find({ $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }] }).sort({ _id: -1 }).select('-salt -hash')
               res.status(200).send(users);
            }else{
                let allUserInfo = {
                    username: [],
                    _id: [],
                    role: [],
                    projectAccessId: [],
                    userEmail: [],
                    msg: "Existing users retrieval successful!",
                };
                await UserModel.find({ $or: [{ "isDeleted": false }, { "isDeleted": { $exists: false } }] }).sort({ _id: -1 })
                    .then(user => {
                        for (let i = 0; i < user.length; i++) {
                            allUserInfo._id.push(user[i]._id);
                            allUserInfo.username.push(user[i].username);
                            allUserInfo.role.push(user[i].role);
                            allUserInfo.projectAccessId.push(user[i].projectAccessId);
                            allUserInfo.userEmail.push(user[i].userEmail);
                        }
                    })
                if (!allUserInfo.username.length > 0) {
                    allUserInfo.msg = "Database was busy. Please refresh the page and try again."
                }
                // let allUserInfo = await User.find({}, "username role projectAccess");
                // console.log(`/secureuser/admin route GET executed. Retrieved existing users:`);
                // console.log(allUserInfo);
                res.json(allUserInfo);
            }
        } catch (err) {
            res.status(500).send("User account retrieval error!");
            res.end();
        }
    })
    .post(async (req, res, next) => { // update user account info
        try {
            let userExists = false;
            await UserModel.findOne({ username: req.body.username })
                .then(user => {
                    if (user && user._id != req.body._id) {
                        userExists = true;
                    }
                })

            if (!userExists) {
                let update = {
                    username: req.body.username,
                    role: req.body.role,
                    projectAccessId: req.body.projectAccessId,
                    userEmail: req.body.userEmail
                };
                let updatedDoc = await UserModel.findOneAndUpdate({ "_id": req.body._id }, update, {
                    new: true,
                    upsert: false,
                    useFindAndModify: false
                });
                //console.log(`This user information is updated by one of the administrators:`);
                //console.log(updatedDoc);
                if (req.body.userEmail) {   
                    const title = "Vultara email confirmation";
                    const content = `Dear User,\n\nThis auto-generated email confirms your email has been added to your Vultara user account. Please contact your administrator for any questions.\n\nThank you.\nVultara Team`;
                    await sendEmail(content, title, [req.body.userEmail]);
                }
                res.status(200).send({ msg: "User account update successful!" });
            } else {
                res.status(200).send({ msg: "Username '" + req.body.username + "' already exists. Usernames must be unique." });
            }
        } catch (err) {
            res.status(500).send("User account update error!");
            res.end();
        }
    })
    .delete(async (req, res, next) => { // delete a user account
        try {
            const deleteUser = await UserModel.updateOne({ "_id": req.query._id },{isDeleted:true});
            if(deleteUser.matchedCount==1 && deleteUser.modifiedCount==1){
                res.status(200).send({ msg: "User account is deleted!" });
            }else{
                res.status(200).send({ msg: "There was an error while deleting the user account." });
            }
        } catch (err) {
            res.status(500).send("Error:User account deletion error!");
            res.end();
        }
    }).patch(async (req, res) => {
        try {
            if(req.body.userUpdate){//update call from Admin page
                const user = req.body.user;
                let updatedDoc = await UserModel.findOneAndUpdate({ "_id": user._id }, req.body.user, { new: true })
                if(user.userEmail){
                    const title = "Vultara email confirmation";
                    const content = `Dear User,\n\nThis auto-generated email confirms your email has been added to your Vultara user account. Please contact your administrator for any questions.\n\nThank you.\nVultara Team`;
                    await sendEmail(content, title, [user.userEmail]);
                }
                res.status(200).send({ user:updatedDoc, msg: "Succesfully updated user profile" });
            }else if(req.body.resetPassword){// Reset password
                res.status(200).send({msg:'Once completed, the user will receive a new password by email.'});
                const saltHash = genPassword(req.body.newPassword);
                const user = req.body.user;
                const salt = saltHash.salt;
                const hash = saltHash.hash;
                const update = {
                    loginAttemptCounter:0,
                    salt,
                    hash
                }
                const resetPassword = await UserModel.findOneAndUpdate({ "_id": user._id },update);
                if(resetPassword._id){
                    const title = "Vultara password reset";
                    const content =`Hello,\n\nYour administrator has requested to reset your password. Here is your new password: ${req.body.newPassword}. Password is case sensitive.\n\n Thank you.\n\n Best Regards,\n\n Vultara Team.`;
                    await sendEmail(content, title, [user.userEmail]);
                }
            }else{//Update call from edit profile page
                const user = await req.body;
                const update = {
                    userEmail: user?.email,
                }
                let updatedDoc = await UserModel.findOneAndUpdate({ "_id": user._id }, update, {
                    new: true,
                    upsert: false,
                    useFindAndModify: false
                }, (err, result) => {
                    if (result) {
                        res.status(200).send({ msg: "Succesfully updated user profile", status: 200 });
                    }
                }).clone();
            }
        } catch (err) {
            if(req.body.resetPassword){//If reset password call fails or has an error send email
                const title = "Vultara password reset error";
                const content = `Hello,\n\n Your administrator has requested to reset your password, but an error has occurred. Please ask your administrator to try again, or contact Vultara technical support at customer.service@vultara.com\n\n Thank you for your patience.\n\n Best Regards,\n\n Vultara Team.`;
                await sendEmail(content, title, [req.body.user.userEmail]);
                res.end();
            }else{
                console.log(err);
                res.status(500).send({ msg: "There was an error while updating the user account" });
                res.end();
            }
        }
    })

router
    .route("/userAddedThreatLib")
    .get(async (req, res) => {
        try {
            // console.log(req.query);
            let userAddedThreatArray = await UserAddedThreatLibModel.find(req.query);
            // console.log(userAddedThreatArray);
            res.json(userAddedThreatArray);
        } catch (err) {
            res.status(500).send("Error: User threat library doesn't exist or database is busy.");
        }
    })
    .post(async (req, res) => {
        try {
            // console.log(req.body);
            let update = req.body;
            let updatedDoc = await UserAddedThreatLibModel.findOneAndUpdate({ "id": req.body.id }, update, {
                new: true,
                upsert: true,
                useFindAndModify: false
            });
            // await UserAddedThreatLibModel.create(req.body);
            if (updatedDoc.id == update.id) {
                res.status(200).send({ msg: "The threat is added to database." });
            } else {
                res.status(200).send({ msg: "Database error!" });
            }
        } catch (err) {
            res.status(500).send("Error: Updated failed. User threat library doesn't exist or database is busy.");
        }
    })
    .delete(async (req, res) => {
        try {

        } catch (err) {
            res.status(500).send("Error: Delete operation failed. User threat library doesn't exist or database is busy.");
        }
    })


//Route that deletes the deleted projectId from projectAccessId array for each user that has that projectId
router
    .route("/deleteProjectIdInUserProjectAccess")
    .delete(async (req, res) => {
        try {
            const id = await UserModel.updateMany({ projectAccessId: req.query.id }, {
                $pull: { projectAccessId: { $in: [req.query.id] } },
            }, (err, result) => {
                if (err) {
                    res.status(500).send("Error: Unable to delete project Id from users' projectAccess.");
                }
            if (result) {
                    res.status(200).send({msg:"Project Deleted Successfully"});
                }
            }).clone();
        } catch (err) {
            console.log(err)
        }
    })



//router to change password
router
    .route("/changePassword")
    .post(async (req, res, next) => { // verify change password and update user account info
        try {
            let curUserInfo = {
                username: "",
                _id: "",
                role: "",
                projectAccessId: [],
                hash: "",
                salt: "",
                msg: "Existing users retrieval successful!"
            };

            await UserModel.findOne({ _id: req.body._id })
                .then(user => {
                    curUserInfo._id = user._id;
                    curUserInfo.username = user.username;
                    curUserInfo.role = user.role;
                    curUserInfo.hash = user.hash;
                    curUserInfo.salt = user.salt;
                })

            if (validPassword(req.body.oldPassword, curUserInfo.hash, curUserInfo.salt)) {
                //console.log("Old Password has been validated.");
                if (req.body.newPassword === req.body.cnewPassword && !validPassword(req.body.newPassword, curUserInfo.hash, curUserInfo.salt)) {
                    //console.log("New Password and Confirm New Password match.");
                    const saltHash = genPassword(req.body.newPassword);
                    const salt = saltHash.salt;
                    const hash = saltHash.hash;

                    let update = {
                        username: req.body.username,
                        salt: salt,
                        hash: hash
                    };
                    let updatedDoc = await UserModel.findOneAndUpdate({ "username": req.body.username }, update, {
                        new: true,
                    });
                    //console.log("User account update successful!");
                    res.status(200).send({ msg: "Password updated successfully!", success: true });
                } else if (validPassword(req.body.newPassword, curUserInfo.hash, curUserInfo.salt)) {
                    res.status(200).send({ msg: "Old and New passwords cannot be the same!", success: false });
                } else {
                    //console.log("Confirm Password does not match New Password.");
                    res.status(200).send({ msg: "Confirm Password does not match New Password.", success: false });
                }
            } else {
                //console.log("Old passwords do not match!");
                res.status(200).send({ msg: "Old password did not match!", success: false });
            }
        } catch (err) {
            res.status(500).send("Error: Change password request failed!");
        }

    });

module.exports = router;

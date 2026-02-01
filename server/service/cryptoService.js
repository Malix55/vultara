const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const UserModel = require("../database/projectDatabase").UserModel;
const PRIV_KEY = fs.readFileSync(__dirname + '/id_rsa_priv.pem', 'utf8');
const PUB_KEY = fs.readFileSync(__dirname + '/id_rsa_pub.pem', 'utf8');
const expiresIn = 60*60*24*7; // 7 days

function validPassword(password, hash, salt) {
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}
module.exports.validPassword = validPassword;

function genPassword(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return {
      salt: salt,
      hash: genHash
    };
}
module.exports.genPassword = genPassword;

// to generate a JWT
function issueJWT(user) {
    const _id = user._id;
    // const expiresIn = 20; // 
    const payload = {
      sub: _id,
      iat: Date.now()/1000,
      username: user.username,
      role: user.role,
      project: user.projectAccessId
    };
    const signedToken = jwt.sign(payload, PRIV_KEY, { expiresIn: expiresIn, algorithm: 'RS256' });
    console.log(`New access token granted to ${user.username}.`);
    return {
      token: "Bearer " + signedToken,
      expires: expiresIn
    }
};
module.exports.issueJWT = issueJWT;

// check whether a user is allowed to access certain projects
async function userAllowedToAccess(tokenInput, projectIdInput) {
    if (noProjectAccessCheckNeeded(tokenInput)) {
      // some roles have access to all project
      return true;
    } else {
      // other roles have project access control
      const userId = getUserIdFromToken(tokenInput);
      const allowedProjects = await allowedProjectsFunc(userId);
      if (allowedProjects.projectAccessId.includes(projectIdInput)) {
        return true;
      } else {
        return false;
      }
    }
}
module.exports.userAllowedToAccess = userAllowedToAccess;



 async function userAuth (req,res,next){
    let id = req.query.id??req.query.projectId??req?.body?.projectId
    const userAuth = await userAllowedToAccess(req.headers.authorization, id);
    if(userAuth){
        next();
        return true;
    } else {
        res.status(403).send("Error: User not authorized to access this project.");
      }
      
}
module.exports.userAuth = userAuth;





// certain roles do not need to check their project access, because they have access to all project by definition
function noProjectAccessCheckNeeded(tokenInput) {
    const allowedRoles = ["Super Admin", "Admin", "Security Manager"];
    const token = tokenInput.slice(7); // to remove the Bearer prefix
    const tokenResult = jwtVerify(token);
    if (allowedRoles.includes(tokenResult.role)) { // some roles have access to all projects
        return true
    } else { // other roles have project access control
        return false
    }
}
module.exports.noProjectAccessCheckNeeded = noProjectAccessCheckNeeded;

function getUserIdFromToken (tokenInput) {
    const token = tokenInput.slice(7); // to remove the Bearer prefix
    const tokenResult = jwtVerify(token);
    return tokenResult.sub
}

// check the projects that the user is allowed to access
async function allowedProjectsFunc(userId) {
    const userInfo = await UserModel.findById(userId).select("projectAccessId");
    return userInfo
}
module.exports.allowedProjectsFunc = allowedProjectsFunc;

// verify jwt - this function is not called. it's built-in in passport.authenticate()
function jwtVerify(inputToken) {
    var verifyOptions = {
        expiresIn: expiresIn,
        algorithm: ["RS256"]
    };
    return verifyResult = jwt.verify(inputToken, PUB_KEY, verifyOptions);
    // console.log("jwt verification result: " + JSON.stringify(verifyResult));
}
module.exports.jwtVerify = jwtVerify;

// middleware to check if the user is authenticated
module.exports.isAuth = (req, res, next) => {
    // local strategy
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ msg: 'Access denied. Please login.', redirect: '/login', isAuth: false });
    }
}

module.exports.isAllowed = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role) { // TODO
        next();
    } else {
        res.status(401).json({ msg: 'Access denied due to role.', redirect: '', isAuth: false });
    }
}
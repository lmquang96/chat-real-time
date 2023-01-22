const express = require("express");
const router = express.Router();
const Account = require("../models/account");

router.get('/', function(req, res, next){
    if(req.cookies._c_auth) {
        var auth = req.cookies._c_auth;
        var listUser = "000";
        var currentUser = req.session.currentUser;
        //selected all account without current account (which account login)
        Account.find({username: { $ne: currentUser}})
        .then(accounts => {
            listUser = accounts;
            res.clearCookie("_c_auth"); 
            res.render("index", {"auth": auth, "listUser": listUser});
        })
        .catch(err => {
            next(err);
        });
    } else {
        res.redirect("/login");
    }
});

module.exports = router;
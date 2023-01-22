const Account = require("../models/account");
const fs = require('fs');
var acLog = [];

module.exports = {
    index: (req, res, next) => {
        Account.find()
            .then(accounts => {
                res.json(accounts);
            })
            .catch(err => {
                next(err);
            });
    },
    create: (req, res, next) => {
        var newAccount = new Account({
            username: req.body.name,
            password: req.body.pass,
            email: req.body.email,
            avatar: "http://vzkiss.com/demo/chatbox/images/avatar/avatar_4.jpeg"
        });
        newAccount.save()
            .then(account => {
                req.session.msgSuccess = "Đăng ký thành công!";
                res.redirect("../login");
            })
            .catch(err => {
                next(err);
            });
    },
    checkLogin: (req, res, next) => {
        Account.findOne({ username: req.body.your_name, password: req.body.your_pass })
            .then(account => {
                //if have not any account want to login
                if (account == null) {
                    req.session.msgFail = "Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản!";
                    res.redirect("../login");
                } else {
                    fs.readFile("_log/_log_auth.txt", function (err, data) {
                        var flag = false;
                        if (data.length != 0) {
                            var ac_log_content = Buffer.from(data.toString(), "base64").toString();
                            var arrAc = ac_log_content.split(",");
                            for (var k = 0; k < arrAc.length; k++) {
                                var item = JSON.parse(arrAc[k]);
                                if (item.ac_name == account.username) {
                                    flag = true;
                                }
                                if (flag) break;
                            }
                        }
                        //if have not this account in file log(no anyone logged)
                        if (!flag) {
                            acLog.push(JSON.stringify({ ac_name: account.username }));
                            var ac_log_content = Buffer.from(acLog.toString()).toString("base64");
                            fs.writeFile("_log/_log_auth.txt", ac_log_content, function (err) {
                                if (err) throw err;
                                console.log('Saved!');
                            });
                            res.cookie("_c_auth", JSON.stringify({ login_name: account.username, login_avatar: account.avatar }), { expires: new Date(Date.now() + 60 * 60 * 1000), httpOnly: false });
                            req.session.currentUser = req.body.your_name;
                            return res.redirect("../");
                        } else {
                            req.session.msgLogged = "Tài khoản này đẵ được đăng nhập ở một nơi khác. Xin vui lòng kiểm tra lại, hoặc liên hệ với quản trị viên để được khắc phục!";
                            return res.redirect("../login");
                        }
                    });
                }
            })
            .catch(err => {
                next(err);
            });
    },
    removeAccount: (req, res, next) => {
        Account.deleteOne({ username: "staff" })
            .then(account => {
                res.send("success!!!");
            })
            .catch(err => {
                next(err);
            });
    },
    clearCookieClient: (req, res, next) => {
        var cookieAuth = JSON.parse(req.cookies._c_auth).login_name;
        for(var k = 0; k < acLog.length; k++) {
            if(acLog[k] == "{\"ac_name\":\"" + cookieAuth + "\"}") {
                acLog.splice(k, 1);
            }
        }
        var ac_log_content = Buffer.from(acLog.toString()).toString("base64");
        fs.writeFile("_log/_log_auth.txt", ac_log_content, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
        res.clearCookie("_c_auth");
        res.redirect("../login");
    }
}
//Use express
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const fs = require('fs');

app.use(express.static("public"));
app.use(express.static("_log"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Use session
const session = require('express-session');
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//Use coockie
var cookieParser = require('cookie-parser');
app.use(cookieParser());

//Use server
const server = require("http").Server(app);
const io = require("socket.io")(server);
server.listen(3000);

//Use router
const accountRouter = require("./routes/account");
const homeRouter = require("./routes/home");

//Use global variable
var arrUser = [];
var numUser = 0;
var jsonUser = {};
// var arrRegister = [];

//Server connecting
io.on("connection", function (socket) {
    numUser++;
    console.log("new connect : " + socket.id);
    socket.on("disconnect", function () {
        console.log("someone disconnect : " + socket.id);
    });

    // socket.on("user-register", function(data){
    //     console.log(data);
    //     if(arrRegister.indexOf(data.name) >= 0){
    //         socket.emit("fail-register");
    //     } else {
    //         jsonUser["name"] = data.name;
    //         jsonUser["avar"] = data.avar;
    //         jsonUser["socketId"] = socket.id;
    //         arrRegister.push(data.name);
    //         socket.userName = data.name;
    //         socket.avar = data.avar;
    //         socket.emit("success-register", jsonUser);
    //         arrUser.push(jsonUser);
    //         io.sockets.emit("show-list-user", arrUser);
    //         jsonUser = {};
    //         console.log(socket.adapter.rooms);
    //     }
    // });

    socket.on("user-login", function (data) {
        jsonUser["name"] = data;
        jsonUser["socketId"] = socket.id;
        socket.userName = data;
        arrUser.push(jsonUser);
        jsonUser = {};
        console.log(arrUser);
        var arrAc;
        var flag = false;
        fs.readFile("_log/_log_auth.txt", function (err, data) {
            if (data.length > 0) {
                var ac_log_content = Buffer.from(data.toString(), "base64").toString();
                arrAc = ac_log_content.split(",");

                for (var k = 0; k < arrAc.length; k++) {
                    if (arrAc[k] == '{\"ac_name\":\"' + data + '\"}') {
                        flag = true;
                    }
                }
                console.log(arrAc[0]);
                console.log('{\"ac_name\":\"' + data + '\"}');
            }
        });
        console.log(flag);
        var t = setTimeout(function(){
            fs.readFile("_log/_log_auth.txt", function (err, data) {
                if (data.length > 0) {
                    var ac_log_content = Buffer.from(data.toString(), "base64").toString();
                    arrAc = ac_log_content.split(",");
    
                    // for (var k = 0; k < arrAc.length; k++) {
                    //     if (arrAc[k] == "{\"ac_name\":\"" + data + "\"}") {
                    //         arrAc.splice(k, 1);
                    //     }
                    // }

                    // arrAc.splice(0, 1);
    
                    // ac_log_content = Buffer.from(arrAc.toString()).toString("base64");
                    // fs.writeFile("_log/_log_auth.txt", ac_log_content, function (err) {
                    //     if (err) throw err;
                    //     console.log('Saved!');
                    // });
                }
            });
        }, 1000*60*1);
        socket.emit("success-login");
        io.sockets.emit("new-user-join", data);
        // console.log(socket.adapter.rooms);
    });

    socket.on("user-send-message", function (data) {
        var messUser = {};
        messUser["name"] = socket.userName;
        messUser["avar"] = data.avatar;
        messUser["mess"] = data.message;
        for (var j = 0; j < arrUser.length; j++) {
            if (arrUser[j].name == data.user) {
                io.sockets.in(socket.chatRoom).emit("server-send-message", messUser);
                socket.to(arrUser[j].socketId).emit("someone-send-you-message", { someoneName: socket.userName, someoneAvatar: data.avatar });
                console.log(socket.userName);
            }
        }
    });

    socket.on("user-to-user-chat-request", function (data) {
        console.log(socket.adapter.rooms);
        // for(var j = 0; j < arrUser.length; j++) {
        //     if(arrUser[j].name == data.newUserTarget) {
        //         //if number of user in room enough 2 people (full)
        //         if(socket.adapter.rooms[arrUser[j].socketId].length == 2) {
        //             socket.emit("user-target-busy");
        //             console.log(socket.adapter.rooms[arrUser[j].socketId].length);
        //         } else {
        //             socket.join("ROOM_" + arrUser[j].socketId + socket.id);
        //             socket.chatRoom = "ROOM_" + arrUser[j].socketId + socket.id;
        //             socket.to(arrUser[j].socketId).emit("someone-make-room-ready", socket.id);
        //             socket.emit("server-send-user-target", arrUser[j]);
        //         }
        //     }
        // }
        for (var j = 0; j < arrUser.length; j++) {
            if (arrUser[j].name == data.userTarget) {
                var newRoom = "ROOM_" + data.userTarget + data.myself
                socket.join(newRoom);
                socket.chatRoom = "ROOM_" + data.userTarget + data.myself;
                socket.to(arrUser[j].socketId).emit("someone-make-room-ready", newRoom);
                socket.emit("server-send-user-target", { avatar: data.avatarTarget, name: data.userTarget });
            }
        }
    });

    socket.on("ready-to-join-someone-room", function (data) {
        console.log(data);
        socket.join(data);
        socket.chatRoom = data;
        console.log(socket.adapter.rooms);
    });

    socket.on("login-request", function (data) {
        console.log(data.username);
    })

    socket.on("someone-offline-now", function (data) {
        socket.broadcast.emit("server-send-someone-offline", data);
    });
});

app.use("/", homeRouter);

app.get("/login", function (req, res) {
    var msg = {}
    if (req.session.msgFail) {
        msg["msgFail"] = req.session.msgFail;
    }
    if (req.session.msgLogged) {
        msg["msgFail"] = req.session.msgLogged;
    }
    if (req.session.msgSuccess) {
        msg["msgSuccess"] = req.session.msgSuccess;
    }
    req.session.destroy();
    res.render("login", msg);
});

app.use("/account", accountRouter);

app.get("/signup", function (req, res) {
    res.render("register");
});
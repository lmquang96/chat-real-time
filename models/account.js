const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:ns20041996@cluster0-iz9ki.mongodb.net/ChatRealTime?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error: "));

const Schema = mongoose.Schema;

const accountSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    }
});

const Account = mongoose.model("accounts", accountSchema);

module.exports = Account;
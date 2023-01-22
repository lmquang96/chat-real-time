const express = require("express");
const router = express.Router();

const AcountController = require("../controllers/AccountController");

router.get('/', AcountController.index);
router.post('/add', AcountController.create);
router.post('/check', AcountController.checkLogin);
router.get('/remove', AcountController.removeAccount);
router.get('/logout', AcountController.clearCookieClient);
module.exports = router;
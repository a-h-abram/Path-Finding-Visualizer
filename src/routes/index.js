const express = require("express");
let router = express.Router();

router.get("/", (req, res) => {
    res.render("main.html.twig", {});
});

module.exports = router;
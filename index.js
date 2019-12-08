const express = require('express');
const app = express();
const twig = require('twig');
const bodyParser = require('body-parser');
let routes = require('./src/routes/index');

app.use("/", routes);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'twig');
app.set("view options", { layout: false });
app.set('twig', twig);

app.set('views', __dirname + '/src/views');
app.use('/views', express.static(__dirname + '/src/views'));

app.use(express.static(__dirname + '/public'));
app.use('*/imgs', express.static('public/imgs'));

app.listen(8080,function(){
    console.log("Live at Port 8080");
});
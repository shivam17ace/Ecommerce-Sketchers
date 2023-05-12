const express = require("express");
const app = express();
const mongoSanitize = require("express-mongo-sanitize");
const mongoose = require("mongoose");
var bodyparser = require("body-parser");
require("dotenv").config();
const Route = require("./Routes/index");

/* middleware */
app.use(bodyparser.json());
app.use(express.json());
app.use(mongoSanitize());
app.use("/", Route);

app.get('/', (req, res) => {
  res.send("Sketchers Backend Is Running")
})

/* mongodb connection */
mongoose
  .connect(process.env.DATABASE)
  .then(console.log("database connected"))
  .catch((err) => {
    console.log(err);
  });

/* server */
const port = process.env.PORT;

app.listen(port, (req, res, next) => {
  console.log(`PORT is running on ${port}`);
});
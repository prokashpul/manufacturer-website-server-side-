const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//global get api
app.get("/", (req, res) => {
  res.send("Welcome To Server");
});

// listen
app.listen(port, () => {
  console.log(port, " Connected");
});

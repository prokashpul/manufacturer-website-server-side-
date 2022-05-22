const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//mongodb

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l6pul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    const toolsCollection = client.db("toolsManager").collection("tools");
    const userCollection = client.db("toolsManager").collection("users");

    //get tools api
    app.get("/tools", async (req, res) => {
      const tools = toolsCollection.find({});
      const result = await tools.toArray();
      res.send(result);
    });
    //user api create put

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    });
  } finally {
  }
};
run().catch(console.dir);

//global get api
app.get("/", (req, res) => {
  res.send("Welcome To Server");
});

// listen
app.listen(port, () => {
  console.log(port, " Connected");
});

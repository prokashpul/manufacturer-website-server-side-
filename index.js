const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
//middleware
app.use(cors());
app.use(express.json());

//mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.l6pul.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// jwt Token verify
const verifyJWT = (req, res, next) => {
  const authorization = req.headers?.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "UnAuthorization Access" });
  }
  const token = authorization?.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_CODE, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

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
    //get tools api
    app.get("/purchase/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const item = await toolsCollection.findOne(query);
      res.send(item);
    });
    // login post api
    app.post("/login", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_CODE, {
        expiresIn: 60 * 60,
      });
      res.send({ accessToken: token });
    });
    //user api create put

    app.put("/user/:email", verifyJWT, async (req, res) => {
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

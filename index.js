const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
    const reviewCollection = client.db("toolsManager").collection("reviews");
    const purchaseCollection = client.db("toolsManager").collection("order");
    const blogCollection = client.db("toolsManager").collection("posts");

    ///
    const adminVerify = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const required = await userCollection.findOne({ email: decodedEmail });
      if (required?.role === "admin") {
        next();
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    };

    //get tools api
    app.get("/tools", async (req, res) => {
      const tools = toolsCollection.find({});
      const result = await tools.toArray();
      res.send(result);
    });
    //get tools api
    app.get("/manageTools", verifyJWT, async (req, res) => {
      const tools = toolsCollection.find({});
      const result = await tools.toArray();
      res.send(result);
    });
    //get All order api
    app.get("/all-orders", async (req, res) => {
      const tools = purchaseCollection.find({});
      const result = await tools.toArray();
      res.send(result);
    });
    //get myOrders api
    app.get("/myOrders/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const tools = purchaseCollection.find(query);
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
    //get tools api
    app.get("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const item = await purchaseCollection.findOne(query);
      res.send(item);
    });
    //user get api
    app.get("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      res.send(result);
    });
    //user get api
    app.get("/users", verifyJWT, async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });
    //get review api
    app.get("/review", async (req, res) => {
      const reviews = await reviewCollection.find({}).toArray();
      res.send(reviews);
    });
    //get review api
    app.get("/blogs", async (req, res) => {
      const post = await blogCollection.find({}).toArray();
      res.send(post);
    });
    // login post api
    app.post("/login", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_CODE, {
        expiresIn: "1d",
      });
      res.send({ accessToken: token });
    });

    //get tools api
    app.post("/tools", verifyJWT, async (req, res) => {
      const query = req.body;
      const tool = await toolsCollection.insertOne(query);
      res.send(tool);
    });
    //get tools api
    app.post("/blogs", verifyJWT, async (req, res) => {
      const query = req.body;
      const post = await blogCollection.insertOne(query);
      res.send(post);
    });
    //get tools api
    app.post("/purchase", verifyJWT, async (req, res) => {
      const query = req.body;
      const order = await purchaseCollection.insertOne(query);
      res.send(order);
    });
    //post review api
    app.post("/user/review", verifyJWT, async (req, res) => {
      const query = req.body;
      const review = await reviewCollection.insertOne(query);
      res.send(review);
    });
    //post card info

    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const tool = req.body;
      const price = tool?.totalPrice;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    //put tools api
    app.put("/tools/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const tool = req.body;
      // console.log(tool);
      const options = { upsert: true };
      const updateDoc = {
        $set: { quantity: tool?.tool?.quantity },
      };
      const result = await toolsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
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

    // admin user api
    app.get("/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });
    //Admin api create put

    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //Admin api create put

    app.put("/user/admin/remove/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "User" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    //Order cancel api create put
    app.put("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const order = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: order,
      };
      const result = await purchaseCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // booking get api create
    app.patch("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req?.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: "paid",
          transitionId: payment.transitionId,
        },
      };
      const booking = await purchaseCollection.updateOne(filter, updateDoc);
      res.send(updateDoc);
    });
    //delete api tools

    app.delete("/manageTools/delete/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(filter);
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

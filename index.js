const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//? middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const productCollection = client.db("FigureZone").collection("products");
    const sellerCollection = client.db("FigureZone").collection("sellers");

    //? GET all products from query param using pagination
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const result = await productCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    //? get product details by getting id from request params from frontend
    app.get("/productDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    //? search products
    app.get("/search", async (req, res) => {
      const searchedText = req.query.searchedText;
      const result = await productCollection
        .find({ name: { $regex: searchedText, $options: "i" } })
        .toArray();
      res.send(result);
    });

    //?
    app.get("/homeProducts", async (req, res) => {
      const result = await productCollection.find().limit(24).toArray();
      res.send(result);
    });
    //? Checking if user's email matches seller's email in db
    app.get("/sellerAuthentication", async (req, res) => {
      const email = req.query.email;
      const cursor = await sellerCollection.findOne({ email: email });
      res.send(cursor);
    });

    //? POST productsByIds
    app.post("/cartProductsByIds", async (req, res) => {
      const ids = req.body;
      console.log(ids);
      const objectIds = ids.map((id) => new ObjectId(parseInt(id))); //! [objectId(id). objectId(id)]
      const cartProducts = await productCollection
        .find({ _id: { $in: objectIds } })
        .toArray();
      res.send(cartProducts);
    });

    //? GET total products count for pagination
    app.get("/totalProducts", async (req, res) => {
      const result = await productCollection.estimatedDocumentCount();
      res.send({ totalProducts: result });
    });

    //? Adding/Creating Seller's Toy Info
    app.post("/addToyInfo", async (req, res) => {
      const addToyInfo = req.body;
      const result = await productCollection.insertOne(addToyInfo);
      res.send(result);
    });

    //? Updating Seller's Toy Info
    app.put("/updatedToy", async (req, res) => {
      const id = req.query.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToyInfo = req.body;
      const updatedToy = {
        $set: {
          img: updatedToyInfo.img,
          name: updatedToyInfo.name,
          sellerName: updatedToyInfo.sellerName,
          sellerEmail: updatedToyInfo.sellerEmail,
          universe: updatedToyInfo.universe,
          price: updatedToyInfo.price,
          ratings: updatedToyInfo.ratings,
          stock: updatedToyInfo.stock,
          catagory: updatedToyInfo.catagory,
          longDescription: updatedToyInfo.longDescription,
        },
      };
      const result = await productCollection.updateOne(
        filter,
        updatedToy,
        options
      );

      res.send(result);
    });

    app.post("/sellerInfo", async (req, res) => {
      const sellerInfo = req.body;
      console.log(sellerInfo);
      const result = await sellerCollection.insertOne(sellerInfo);
      res.send(result);
    });

    app.get("/myToys", async (req, res) => {
      const email = req.query.email;
      const result = await productCollection
        .find({ sellerEmail: email })
        .toArray();
      res.send(result);
    });

    app.delete("/deleteToy", async (req, res) => {
      const result = await productCollection.deleteOne({
        _id: new ObjectId(req.query.id),
      });
      console.log(result);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Figure Zone is Open!");
});

app.listen(port, (req, res) => {
  console.log(`Figure Zone is running on ${port}`);
});

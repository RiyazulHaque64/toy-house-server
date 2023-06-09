const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

const corsConfig = {
  origin: "",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsConfig));
app.options("", cors(corsConfig));
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Toy House is running ....");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vp8crsv.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const toysCollection = client.db("toyHouse").collection("toysCollection");

    const indexKeys = { toyTitle: 1 };
    const indexOptions = { name: "title" };

    const result = await toysCollection.createIndex(indexKeys, indexOptions);

    app.get("/searchByName/:name", async (req, res) => {
      const searchText = req.params.name;
      const result = await toysCollection
        .find({
          $or: [{ toyTitle: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    app.get("/sort/:query", async (req, res) => {
      const sortQuery = req.params.query;
      const user = { sellerEmail: req.query.seller };
      let result;
      if (sortQuery === "highToLow") {
        result = await toysCollection.find(user).sort({ price: -1 }).toArray();
      } else if (sortQuery === "lowToHigh") {
        result = await toysCollection.find(user).sort({ price: 1 }).toArray();
      }
      res.send(result);
    });

    app.get("/allToys", async (req, res) => {
      const cursor = toysCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allToys/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const cursor = toysCollection.find(query).limit(20);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    app.get("/myToys", async (req, res) => {
      const query = { sellerEmail: req.query.seller };
      const cursor = toysCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/addToy", async (req, res) => {
      const toyInfo = req.body;
      const result = await toysCollection.insertOne(toyInfo);
      res.send(result);
    });

    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const updatedToyInfo = req.body;
      const {
        toyTitle,
        category,
        sellerEmail,
        sellerName,
        price,
        quantity,
        rating,
        photoUrl,
        description,
      } = updatedToyInfo;
      console.log(id, updatedToyInfo);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedToy = {
        $set: {
          toyTitle: toyTitle,
          category: category,
          sellerName: sellerName,
          sellerEmail: sellerEmail,
          price: price,
          quantity: quantity,
          rating: rating,
          photoUrl: photoUrl,
          description: description,
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        updatedToy,
        options
      );
      res.send(result);
    });

    app.delete("/deleteToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Toy house server is running on port ${port}`);
});

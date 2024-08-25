const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "https://story-paths.firebaseapp.com",
      "https://story-paths.web.app",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dqs9o84.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const storiesCollection = client
      .db("story_paths")
      .collection("storiesCollection");

    app.get("/api/stories", async (req, res) => {
      let query = {};
      let options = {};

      if (req?.query?.email) {
        query = { author_email: req.query.email };
        options = {};
      } else {
        options = {
          projection: {
            _id: 1,
            title: 1,
            author: 1,
            "layers.branch_1": 1,
          },
        };
      }

      const result = await storiesCollection.find(query, options).toArray();
      res.send(result);
    });

    app.post("/api/stories", async (req, res) => {
      const story = req.body;

      const result = await storiesCollection.insertOne(story);
      res.send(result);
    });

    app.get("/api/stories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const branch = req.query.branch || "branch_1";

      const options = {
        projection: {
          _id: 1,
          author: 1,
          [`layers.${branch}`]: 1,
        },
      };

      const story = await storiesCollection.findOne(query, options);

      const currentBranchLayer = story.layers[branch];

      const currentViews = currentBranchLayer?.views || 0;
      const update = {
        $set: {
          [`layers.${branch}.views`]: currentViews + 1,
        },
      };

      await storiesCollection.updateOne(query, update);

      const updatedStory = await storiesCollection.findOne(query, options);
      res.json(updatedStory);
    });

    const { ObjectId } = require("mongodb");

    app.post("/api/stories/:id/updateTime", async (req, res) => {
      const { id } = req.params;
      const { branchName, timeSpent } = req.body;
      console.log(req.body);

      const query = { _id: new ObjectId(id) };
      const story = await storiesCollection.findOne(query);

      const currentBranchTimeSpent = story.layers[branchName]?.timeSpent || 0;
      const newTimeSpent = currentBranchTimeSpent + timeSpent;

      const update = {
        $set: {
          [`layers.${branchName}.timeSpent`]: newTimeSpent,
        },
      };

      const result = await storiesCollection.updateOne(query, update);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
  res.send("story-paths-server");
});

app.listen(port, () => {
  console.log(`Story paths server is running on port: ${port}`);
});

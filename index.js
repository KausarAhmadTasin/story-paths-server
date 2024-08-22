const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("story-paths-server");
});

app.listen(port, () => {
  console.log(`Story paths server is running on port: ${port}`);
});

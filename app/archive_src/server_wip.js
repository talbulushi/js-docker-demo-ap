// express: to build server-side applications and APIs by providing a robust set of features for handling 
// HTTP requests, routing, middleware, and more.
let express = require('express');
let path = require('path');
let fs = require('fs'); 
let MongoClient = require('mongodb').MongoClient; //Imports the MongoDB client to connect and interact with a MongoDB database.
let bodyParser = require('body-parser'); //Imports middleware to parse incoming request bodies (JSON and form data).

//Creates an Express application instance (your server).
let app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve profile image
app.get('/profile-picture', (req, res) => {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, { 'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// Detect if running inside Docker
let isDocker = process.env.DOCKER_ENV === "true";

// Use Docker hostname if inside a container, else local
let mongoUrl = isDocker ? "mongodb://admin:password@mongodb:27017" : "mongodb://admin:password@localhost:27017";

// pass these options to mongo client connect request to avoid DeprecationWarning for current Server Discovery and Monitoring engine
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
let databaseName = "my-db";


// Add a new profile
app.post('/add-profile', async (req, res) => {
  const userObj = req.body;

  // Generate unique userid if not provided
  if (!userObj.userid) userObj.userid = Date.now();

  try {
    const client = await MongoClient.connect(mongoUrl, mongoClientOptions);
    const db = client.db(databaseName);

    const result = await db.collection("users").insertOne(userObj);
    client.close();

    res.send({ success: true, user: userObj, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Update an existing profile by userid
app.post('/update-profile', async (req, res) => {
  const userObj = req.body;

  if (!userObj.userid) return res.status(400).send({ error: "userid required" });

  try {
    const client = await MongoClient.connect(mongoUrl, mongoClientOptions);
    const db = client.db(databaseName);

    const query = { userid: userObj.userid };
    const update = { $set: userObj };

    await db.collection("users").updateOne(query, update, { upsert: false });
    client.close();

    res.send({ success: true, user: userObj });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get a single profile by userid
app.get('/get-profile/:userid', async (req, res) => {
  const userId = parseInt(req.params.userid);

  try {
    const client = await MongoClient.connect(mongoUrl, mongoClientOptions);
    const db = client.db(databaseName);

    const profile = await db.collection("users").findOne({ userid: userId });
    client.close();

    if (!profile) return res.status(404).send({ error: "Profile not found" });
    res.send(profile);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Search profiles by name or email
app.get('/search-profile', async (req, res) => {
  const query = {};
  if (req.query.name) query.name = req.query.name;
  if (req.query.email) query.email = req.query.email;

  try {
    const client = await MongoClient.connect(mongoUrl, mongoClientOptions);
    const db = client.db(databaseName);

    const results = await db.collection("users").find(query).toArray();
    client.close();

    res.send(results);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log("App listening on port 3000!");
});

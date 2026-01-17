const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    cb(null, `temp-${Date.now()}.jpg`);
  }
});

const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve profile picture
app.get('/profile-picture', (req, res) => {
  const img = fs.readFileSync(path.join(__dirname, 'images/profile-1.jpg'));
  res.writeHead(200, { 'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// Upload profile picture
app.post('/upload-picture/:userid', upload.single('profileImage'), (req, res) => {
  const userid = req.params.userid;
  const oldPath = req.file.path;
  const newPath = path.join(__dirname, `images/profile-${userid}.jpg`);
  
  // Rename the file to use the correct userid
  fs.renameSync(oldPath, newPath);
  
  res.send({ success: true, filename: `profile-${userid}.jpg` });
});

// MongoDB connection
const isDocker = process.env.DOCKER_ENV === "true";
const mongoUrl = isDocker
  ? "mongodb://admin:password@mongodb:27017"
  : "mongodb://admin:password@localhost:27017";
const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const databaseName = "my-db";


// Add new profile
app.post('/add-profile', async (req, res) => {
  const userObj = req.body;
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

// Update profile
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

// Get profile by userid
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

// Serve profile picture by userid
app.get('/profile-picture/:userid', (req, res) => {
  const userId = req.params.userid;
  const imagePath = path.join(__dirname, `images/profile-${userId}.jpg`);
  
  // Check if image exists, otherwise send a default
  if (fs.existsSync(imagePath)) {
    let img = fs.readFileSync(imagePath);
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  } else {
    // Send default image if user's image doesn't exist
    let img = fs.readFileSync(path.join(__dirname, "images/profile-default.jpg"));
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  }
});

// Delete profile by userid
app.delete('/delete-profile/:userid', async (req, res) => {
  const userId = parseInt(req.params.userid);
  try {
    const client = await MongoClient.connect(mongoUrl, mongoClientOptions);
    const db = client.db(databaseName);
    const result = await db.collection("users").deleteOne({ userid: userId });
    client.close();
    if (result.deletedCount === 0) return res.status(404).send({ error: "Profile not found" });
    res.send({ success: true });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log("App listening on port 3000!");
});

// app.js

var bib_1mile = 1;
var bib_500m = 500;
var bib_1000m = 1000;
var bib_biath = 1500;
var total_swimmers = 0;


function start_new_race(){
    bib_1mile = 1;
    bib_500m = 500;
    bib_1000m = 1000;
    bib_biath = 1500;
    total_swimmers = 0;
}



const express = require("express");
const fs = require('fs').promises;
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require('path');

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');  // Allow all origins
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    next();
  });
  
  
  

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB!"));

// Schemas and Models
const primaryUserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  birthday: { type: Date, required: true },
  race: { type: String, required: true },
  gender: { type: String, required: true },
  bib_num: { type: String, required: true },
  swim_time: { type: String, required: false }
});

const secondaryUserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  birthday: { type: Date, required: true },
  gender: { type: String, required: true },
});

const allSwimsSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    birthday: { type: Date, required: true },
    race: { type: String, required: true },
    gender: { type: String, required: true },
    bib_num: { type: String, required: true },
    swim_time: { type: String, required: true }
  });

const swimSchema = new mongoose.Schema({
    swim_name: { type: String, required: true, unique: true },
    is_open: { type: Boolean, default: true },
  });


// const PrimaryUser = mongoose.model("PrimaryUser2", primaryUserSchema);
PrimaryUser = null;
const SecondaryUser = mongoose.model("SecondaryUser", secondaryUserSchema);
const allswims = mongoose.model("AllSwims", allSwimsSchema);
const Swim = mongoose.model("Swim", swimSchema);
  
//serve html
app.get('/join_swim', (req, res) => {
  res.sendFile(path.join(__dirname, 'join_swim.html'));
});

app.get('/join_swim2', (req, res) => {
  res.sendFile(path.join(__dirname, 'join_swim2.html'));
});

app.get('/start_race', (req, res) => {
  res.sendFile(path.join(__dirname, 'start_race.html'));
});

app.get('/modern_swimmer2', (req, res) => {
  res.sendFile(path.join(__dirname, 'modern_swimmer2.html'));
});

app.get('/race_results', (req, res) => {
  res.sendFile(path.join(__dirname, 'race_results.html'));
});

app.get('/log_times', (req, res) => {
  res.sendFile(path.join(__dirname, 'log_times.html'));
});

app.get('/allswimmers', (req, res) => {
  res.sendFile(path.join(__dirname, 'allswimmers.html'));
});

app.get('/hamburger.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'hamburger.css'));
});

// router.get('/css/:filename', async (req, res) => {
//   try {
//       const filename = req.params.filename;
//       const cssPath = path.join(__dirname, 'css', filename);
      
//       // Check if file exists
//       await fs.access(cssPath);
      
//       // Set correct content type for CSS
//       res.set('Content-Type', 'text/css');
      
//       // Send the file
//       res.sendFile(cssPath);
//   } catch (error) {
//       if (error.code === 'ENOENT') {
//           res.status(404).send('CSS file not found');
//       } else {
//           console.error('Error serving CSS file:', error);
//           res.status(500).send('Error serving CSS file');
//       }
//   }
// });
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve JavaScript files
router.get('/js/:filename', async (req, res) => {
  try {
      const filename = req.params.filename;
      const jsPath = path.join(__dirname, 'js', filename);
      
      // Check if file exists
      await fs.access(jsPath);
      
      // Set correct content type for JavaScript
      res.set('Content-Type', 'application/javascript');
      
      // Send the file
      res.sendFile(jsPath);
  } catch (error) {
      if (error.code === 'ENOENT') {
          res.status(404).send('JavaScript file not found');
      } else {
          console.error('Error serving JavaScript file:', error);
          res.status(500).send('Error serving JavaScript file');
      }
  }
});

async function get_bib_num(race){
  var bib_num;
  var num_swimmers;
  const count = await PrimaryUser.countDocuments({ race: race });
  if(race==='1mile'){
    bib_num= count+1
  }
  if(race==='500m'){
    bib_num= count+500
  }
  if(race==='1000m'){
    bib_num= count+1000
  }
  if(race==='biath'){
    bib_num= count+1500
  }
  num_swimmers = await PrimaryUser.countDocuments({ });
  return {bib_num:bib_num,num_swimmers:num_swimmers}


}

  // POST /swims - Add a new swim
  app.post("/swims", async (req, res) => {
    const { swim_name } = req.body;
  
    if (!swim_name) {
      return res.status(400).send({ error: "Swim name is required." });
    }
  
    try {
      const newSwim = new Swim({ swim_name, is_open: true });
      await newSwim.save();
        //create current swim database
        start_new_race();
      PrimaryUser = mongoose.model(swim_name, primaryUserSchema);

      res.status(201).send({ message: "Swim added successfully." });
    } catch (error) {
      if (error.code === 11000) {
        PrimaryUser = mongoose.model(swim_name, primaryUserSchema);
        res.status(409).send({ error: "Swim name already exists." });
      } else {
        res.status(500).send({ error: "Internal Server Error", details: error });
      }
    }
  });
  
  // GET /swims - List all swim names
  app.get("/swims", async (req, res) => {
    try {
      const openSwims = await Swim.find({ is_open: true }, { swim_name: 1, _id: 0 });
      res.status(200).send(openSwims);
    } catch (error) {
      res.status(500).send({ error: "Internal Server Error", details: error });
    }
  });
  app.get("/swims/current", async (req, res) => {
    try{
      res.status(200).send({'status':PrimaryUser.collection.modelName})
    }catch{
      res.status(500).send({'error':'internal server error'})
    }
  });
  
  // PATCH /swims/close - Close a swim by name
  app.post("/swims/close", async (req, res) => {
    const { swim_name } = req.body;
  
    if (!swim_name) {
      return res.status(400).send({ error: "Swim name is required." });
    }
  
    try {
      const updatedSwim = await Swim.findOneAndUpdate(
        { swim_name },
        { is_open: false },
        { new: true }
      );
  
      if (!updatedSwim) {
        return res.status(404).send({ error: "Swim not found." });
      }
  
      res.status(200).send({ message: "Swim closed successfully.", swim: updatedSwim });
    } catch (error) {
      res.status(500).send({ error: "Internal Server Error", details: error });
    }
  });
  

//================================================================

// POST /users
app.post("/users", async (req, res) => {
    const { name, birthday, race, gender } = req.body;
  
    if (!name || !birthday || !race || !gender) {
      return res.status(400).send({ error: "All fields are required." });
    }
  
    try {
      // Add to Primary Database
      // bib_num = 9999;
      // swim_time = '';
      // bn = 0;
      //   if(race == '500m'){
      //       bib_500m+=1
      //       bib_num = bib_500m
      //   }
      //   if(race == '1000m'){
      //       bib_1000m+=1
      //       bib_num = bib_1000m
      //   }
      //   if(race == '1mile'){
      //       bib_1mile+=1
      //       bib_num = bib_1mile
      //   }
      //   if(race == 'biath'){
      //       bib_biath+=1
      //       bib_num = bib_biath
      //   }
      //   total_swimmers+=1
      swim_time = ''
      temp = await get_bib_num(race);
      bib_num = temp.bib_num;
      total_swimmers = temp.num_swimmers;
      const newPrimaryUser = new PrimaryUser({ name, birthday, race, gender,bib_num,swim_time });
      await newPrimaryUser.save();
  
      // Check if user exists in Secondary Database
      const existingSecondaryUser = await SecondaryUser.findOne({ name });
      if (!existingSecondaryUser) {
        const newSecondaryUser = new SecondaryUser({ name, birthday, gender });
        await newSecondaryUser.save();
      }
  
      res.status(201).send({ message: "User added successfully.",
        user: newPrimaryUser,
        bib_num: bib_num,
        total_swimmers:total_swimmers});
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).send({ error: "User with this name already exists in the primary database." });
      } else {
        res.status(500).send({ error: "Internal Server Error", details: error });
      }
    }
  });
  
// GET /users
app.get("/users", async (req, res) => {
  const { name, bib_num } = req.query;

  try {
    let user;
    if (name) {
      user = await PrimaryUser.findOne({ name });
    } else if (bib_num) {
      user = await PrimaryUser.findOne({ bib_num });
    } else {
      return res.status(400).send({ error: "Provide a name or bib_num." });
    }

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error", details: error });
  }
});

app.get("/users", async (req, res) => {
    const { name, bib_num } = req.query;
  
    try {
      let user;
      if (name) {
        user = await PrimaryUser.findOne({ name });
      } else if (bib_num) {
        user = await PrimaryUser.findOne({ bib_num });
      } else {
        return res.status(400).send({ error: "Provide a name or bib_num." });
      }
  
      if (!user) {
        return res.status(404).send({ error: "User not found." });
      }
  
      res.status(200).send(user);
    } catch (error) {
      res.status(500).send({ error: "Internal Server Error", details: error });
    }
  });

// PATCH /users/swim-time - Update swim_time by bib_num
app.patch("/users/swim-time", async (req, res) => {
    const { bib_num, time } = req.body;
  
    if (!bib_num || !time) {
      return res.status(400).send({ error: "Both bib_num and time are required." });
    }
  
    try {
      // Find and update the user by bib_num
      const updatedUser = await PrimaryUser.findOneAndUpdate(
        { bib_num },
        { swim_time: time },
        { new: true } // Return the updated document
      );
  
      if (!updatedUser) {
        return res.status(404).send({ error: "User with this bib_num not found." });
      }
  
      res.status(200).send({
        message: "Swim time updated successfully.",
        user: updatedUser,
      });
    } catch (error) {
      res.status(500).send({ error: "Internal Server Error", details: error });
    }
  });

// get all previous swimmers
app.get('/allswimmers', async (req, res) => {
    const existingSecondaryUser = await SecondaryUser.find()
    res.status(200).send(existingSecondaryUser);
})

app.get('/currentswimmers', async (req, res) => {
  try{
    const existingPrimaryUser = await PrimaryUser.find()
    res.status(200).send(existingPrimaryUser);
  }
  catch{
    res.status(500).send({'error':'Internal Server Error'});
  }
})

app.get('/search', async (req,res) =>{
    string = req.query.string;
    const query = { name: { $regex: string, $options: 'i' } };
    users = await SecondaryUser.find(query)

    
    res.json(users)
})

app.get('/userinfo', async (req, res) => {
    // const { name } = req.params;
    name = req.query.name;
    if (name === undefined){
        const users = await SecondaryUser.find();
        res.json(users)
    }
    else{

        try {
            const user = await SecondaryUser.findOne({ name });
            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ message: `User with name ${name} not found` });
            }
        } catch (err) {
            res.status(500).json({ message: 'Error retrieving user', error: err.message });
        }
    }
});

start_time = null;

app.post('/race/start', async (req,res)=>{
  try{
    start_time = req.body.time
    res.status(200).json({'message':`time ${start_time}`})
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.get('/race', async (req,res)=>{
  try{
    res.status(200).json({'time':start_time})
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.get('/race/restart', async (req,res)=>{
  try{
    start_time = null;
    res.status(200).json({'message':'restarted'})
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

// Start the server
const PORT = parseInt(process.argv[2]);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

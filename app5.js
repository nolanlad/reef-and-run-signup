// app.js

var bib_1mile = 1;
var bib_500m = 500;
var bib_1000m = 1000;
var bib_biath = 1500;
var total_swimmers = 0;

var cookies = [];


function start_new_race(){
    bib_1mile = 1;
    bib_500m = 500;
    bib_1000m = 1000;
    bib_biath = 1500;
    total_swimmers = 0;
}


const https = require("https")
const fs2 = require("fs");
const express = require("express");
const crypto = require("crypto")
const fs = require('fs').promises;
const router = express.Router();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser()); // Enables parsing of cookies

app.use(express.raw({ type: 'text/csv', limit: '5mb' }));

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
  race: { type: String, required: false },
  gender: { type: String, required: true },
  bib_num: { type: String, required: false },
  swim_time: { type: String, required: false },
  ws: {type: String,required: true}
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

  const seasonPassSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    birthday: { type: Date, required: true },
    gender: { type: String, required: true }
  });

  const loginSchema = new mongoose.Schema({
    uname: { type: String, required: true, unique: true },
    upass: { type: String, required: true },
    salt: { type: String, required: true },
    priv: {type: Number, required: true}
  });


// const PrimaryUser = mongoose.model("PrimaryUser2", primaryUserSchema);
PrimaryUser = null;
const login = mongoose.model('Login', loginSchema);
const SecondaryUser = mongoose.model("SecondaryUser", secondaryUserSchema);
const allswims = mongoose.model("AllSwims", allSwimsSchema);
const Swim = mongoose.model("Swim", swimSchema);
const SeasonPass = mongoose.model("SeasonPass", seasonPassSchema);

async function add_season_pass() {
  // try{
    const season_pass_holders = await SeasonPass.find();

    for (let seasonPassHolder of season_pass_holders) {
      console.log(seasonPassHolder);
      const { name, birthday, gender } = seasonPassHolder;

      const race = '';
      const bib_num = '';
      const swim_time = '';
      const ws = '';

      // Make sure to rename the variable to avoid conflict with the outer loop variable
      const updatedUser = await PrimaryUser.findOneAndUpdate(
        { name },
        { birthday, race, gender, bib_num, swim_time,ws },
        { new: true, upsert: true }
      );

      console.log(updatedUser);  // Optionally log the updated or created user
    }
  // }
  // catch{
  //   return
  // }
}

function make_cookie(){
  return crypto.randomBytes(16).toString('hex')
}

function check_cookie(req,priv_req){
  // cookie = req.cookie['rnr_cookie']
  // if(cookie===undefined){
  //   return false
  // }
  entry = cookies.find(obj => obj.cookie === cookie)
  if(entry === undefined){
    return false
  }
  return (entry.priv <= priv_req)

}

app.get('/test',async  (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(check_cookie(cookie,1)){
    res.status(200).json({'message':'OK'})
  }
  else{
    res.status(403).json({'message':'forbidden'})
  }
})

app.post('/login_reefnrun',async (req,res) => {
  uname = req.body.uname;
  pass = req.body.upass;
  const userinfo = await login.findOne({uname:uname});
  hashed_password = crypto.createHash('sha256').update(userinfo.salt+pass).digest('hex')
  authed = (hashed_password === userinfo.upass)
  console.log(authed,hashed_password,userinfo.upass,pass)
  //generate log cookie
  if(authed){
    var cookie = make_cookie();
    priv = userinfo.priv;
    cookies.push({cookie:cookie,priv:priv})

    res.status(200).json({'test':cookie})
    return 

  }
  else{
    res.status(401).json({'test':'login_failed'})
  }

})

async function parseCSV(csvString) {
  const lines = csvString.trim().split("\n").slice(1); // Split by line breaks
  const result = [];

  for (let line of lines) {
      // Regular expression to match CSV values, handling both quoted and unquoted values
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, ''));
      
      if (values.length === 4) { // Ensure we have all 3 expected values
          result.push({
              name: values[1],
              dateOfBirth: values[2],
              gender: values[3]
          });
          name = values[1]
          birthday = values[2]
          gender = values[3]
          if (gender === 'Female'){
            gender = 'F'
          }
          if (gender === 'Male'){
            gender = 'M'
          }
          race = ''
          bib_num = ''
          swim_time = ''
          // const newPrimaryUser = new PrimaryUser({ name, birthday, race, gender,bib_num,swim_time });
          // await newPrimaryUser.save();
          const user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num,swim_time},
            { new: true, upsert: true })
          const existingSecondaryUser = await SecondaryUser.findOne({ name });
          if (!existingSecondaryUser) {
            const newSecondaryUser = new SecondaryUser({ name, birthday, gender });
            await newSecondaryUser.save();
          }
          console.log(values)
      }
  }

  return result;
}

async function parseCSV_seasonpass(csvString) {
  const lines = csvString.trim().split("\n").slice(1); // Split by line breaks
  const result = [];

  for (let line of lines) {
      // Regular expression to match CSV values, handling both quoted and unquoted values
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, ''));
      
      if (values.length === 3) { // Ensure we have all 3 expected values
          result.push({
              name: values[0],
              dateOfBirth: values[1],
              gender: values[2]
          });
          name = values[0]
          birthday = values[1]
          gender = values[2]
          if (gender === 'Female'){
            gender = 'F'
          }
          if (gender === 'Male'){
            gender = 'M'
          }
          race = ''
          bib_num = ''
          swim_time = ''
          ws = ''
          // const newPrimaryUser = new PrimaryUser({ name, birthday, race, gender,bib_num,swim_time });
          // await newPrimaryUser.save();
          const user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num,swim_time,ws},
            { new: true, upsert: true })
          await PrimaryUser.findOneAndUpdate({name},
              {birthday, race, gender,bib_num,swim_time},
              { new: true, upsert: true })
          await SeasonPass.findOneAndUpdate({name},
            {birthday,gender},
            { new: true, upsert: true });
        
          const existingSecondaryUser = await SecondaryUser.findOne({ name });
          if (!existingSecondaryUser) {
            const newSecondaryUser = new SecondaryUser({ name, birthday, gender });
            await newSecondaryUser.save();
          }
          console.log(values)
      }
  }

  return result;
}

app.post('/upload-csv',async  (req, res) => {
  //authenticate
  // if(!check_cookie(cookie,1)){
  //   res.status(403).json({'message':'forbidden'})
  // }

  const fileName = req.headers['file-name'] || `upload_${Date.now()}.csv`;
  const filePath = path.join(__dirname, fileName);

  if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: 'No file content received' });
  }

  // Convert buffer to string (CSV content)
  const csvData = req.body.toString();
  await parseCSV(csvData);
return res.status(200).json({'message':'file uploaded sucessfully'})
  
});

app.post('/upload-season-pass',async  (req, res) => {
  const fileName = req.headers['file-name'] || `upload_${Date.now()}.csv`;
  const filePath = path.join(__dirname, fileName);

  if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: 'No file content received' });
  }

  // Convert buffer to string (CSV content)
  const csvData = req.body.toString();
  await parseCSV_seasonpass(csvData);
return res.status(200).json({'message':'file uploaded sucessfully'})
  
});

app.get("/users/seasonpass", async (req, res) => {
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
    return
  }
  const { name } = req.query;

  try {
    let user;
    if (name) {
      user = await SeasonPass.findOne({ name });
    }
    else {
      return res.status(400).send({ error: "Provide a name or bib_num." });
    }

    if (!user) {
      return res.status(200).send({ status: "unpaid" });
    }
    else{
      return res.status(200).send({ status: "paid" });
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error", details: error });
  }
});


app.get('/rnr_login', (req, res) => {
  res.sendFile(path.join(__dirname, 'rnr_login.html'));
});

//serve html
app.get('/join_swim', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,1)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'join_swim.html'));
});

app.get('/upload', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,1)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'upload.html'));
});

app.get('/upload-seasonpass', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,1)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'upload_seasonpass.html'));
});


app.get('/join_swim2', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,1)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'join_swim2.html'));
});

app.get('/start_race', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,1)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'start_race.html'));
});

app.get('/modern_swimmer2', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'modern_swimmer2.html'));
});

app.get('/race_results', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'race_results.html'));
});

app.get('/log_times', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
  res.sendFile(path.join(__dirname, 'log_times.html'));
});

app.get('/allswimmers', (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
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
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,1)){
      res.status(403).json({'message':'forbidden'})
    }
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
      add_season_pass() //add season pass holders

      res.status(201).send({ message: "Swim added successfully." });
    } catch (error) {
      if (error.code === 11000) {
        PrimaryUser = mongoose.model(swim_name, primaryUserSchema);
        add_season_pass() //add season pass holders
        res.status(409).send({ error: "Swim name already exists." });
        
      } else {
        res.status(500).send({ error: "Internal Server Error", details: error });
      }
    }
  });
  
  // GET /swims - List all swim names
  app.get("/swims", async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,1)){
      res.status(403).json({'message':'forbidden'})
    }
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
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,1)){
      res.status(403).json({'message':'forbidden'})
    }
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
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
  cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
    const { name, birthday, race, gender,ws } = req.body;
  
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
      console.log(ws)
      swim_time = ''
      temp = await get_bib_num(race);
      bib_num = temp.bib_num;
      total_swimmers = temp.num_swimmers;
      // const newPrimaryUser = new PrimaryUser({ name, birthday, race, gender,bib_num,swim_time });
      // await newPrimaryUser.save();
      const user = await PrimaryUser.findOneAndUpdate({name},
        {birthday, race, gender,bib_num,swim_time,ws},
        { new: true, upsert: true })
  
      // Check if user exists in Secondary Database
      const existingSecondaryUser = await SecondaryUser.findOne({ name });
      if (!existingSecondaryUser) {
        const newSecondaryUser = new SecondaryUser({ name, birthday, gender });
        await newSecondaryUser.save();
      }
  
      res.status(201).send({ message: "User added successfully.",
        user: user,
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
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
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
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
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
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
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
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
    const existingSecondaryUser = await SecondaryUser.find()
    res.status(200).send(existingSecondaryUser);
})

app.get('/currentswimmers', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
  try{
    const existingPrimaryUser = await PrimaryUser.find()
    res.status(200).send(existingPrimaryUser);
  }
  catch{
    res.status(500).send({'error':'Internal Server Error'});
  }
})

app.get('/search', async (req,res) =>{
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
    string = req.query.string;
    const query = { name: { $regex: string, $options: 'i' } };
    users = await SecondaryUser.find(query)

    
    res.json(users)
})

app.get('/userinfo', async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!check_cookie(cookie,2)){
      res.status(403).json({'message':'forbidden'})
    }
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
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
  try{
    start_time = req.body.time
    res.status(200).json({'message':`time ${start_time}`})
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.get('/race', async (req,res)=>{
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
  try{
    res.status(200).json({'time':start_time})
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.get('/race/restart', async (req,res)=>{
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
  }
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
if(PORT == 443){
  const options = {
    key: fs2.readFileSync("/etc/letsencrypt/live/anomaloussignalsgroup.com/privkey.pem"),
    cert: fs2.readFileSync("/etc/letsencrypt/live/anomaloussignalsgroup.com/fullchain.pem"),
  };
  https.createServer(options, app).listen(443, () => {
    console.log("Secure server running on port 443");
  });
}
else{
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

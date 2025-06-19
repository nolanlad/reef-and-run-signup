// app.js
//waiver

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

process.on('exit', () => {
  console.log('/home/ubuntu/app5_terminated.txt', 'Process terminated at ' + new Date());
});

process.on('SIGINT', () => {
  console.log('/home/ubuntu/app5_terminated.txt', 'Process killed (SIGINT) at ' + new Date());
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('/home/ubuntu/app5_terminated.txt', 'Process killed (SIGTERM) at ' + new Date());
  process.exit();
});


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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${req.ip} ${JSON.stringify(req.body)}`);

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
  ws: {type: String,required: true},
  reg_type: {type: String,required: false},
  sp: {type: Boolean,required: false}
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
    is_current: {type: Boolean,default: false},
    start_time: {type: Number}
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

  const cookieSchema = new mongoose.Schema({
    cookie: { type: String, required: true, unique: true },
    priv: { type: Number, required: true },
  });

  const resultsSchema = new mongoose.Schema({
    fname: { type: String, required: true, unique: true },
    dbname: { type: String, required: true },
  });

  const bibCounterSchema = new mongoose.Schema({
    race: { type: String, required: true },
    count: { type: Number, required: true },
  });

  const waiverSchema = new mongoose.Schema({
    name: { type: String, required: true }
  });


// const PrimaryUser = mongoose.model("PrimaryUser2", primaryUserSchema);
PrimaryUser = null;

const login = mongoose.model('Login', loginSchema);
const SecondaryUser = mongoose.model("SecondaryUser", secondaryUserSchema);
const allswims = mongoose.model("AllSwims", allSwimsSchema);
const Swim = mongoose.model("Swim", swimSchema);
const SeasonPass = mongoose.model("SeasonPass", seasonPassSchema);
const cookieDB = mongoose.model('ccookie',cookieSchema)
const resultsDB = mongoose.model('results',resultsSchema)
const bibCounter = mongoose.model('bibCounter',bibCounterSchema)
const waivers = mongoose.model('waivers',waiverSchema)


Swim.findOne({is_current: true}).then(x=>{
  if(x){
    console.log('joining swim: '+x.swim_name)
    PrimaryUser = mongoose.model(x.swim_name, primaryUserSchema);
    reInitializeRaces();
  }
})

async function init_counter(){
  const newSecondaryUser = new SecondaryUser({ race: "1000m", count:0 });
  await newSecondaryUser.save();
}

// if(race==='1mile'){
//   bib_num= count+1
// }
// if(race==='500m'){
//   bib_num= count+500
// }
// if(race==='1000m'){
//   // bib_num= count+1000
//   bib_num = count + 700
// }
// if(race==='biath'){
//   // bib_num= count+1500
//   bib_num = count + 400

async function initializeRaces() {
  const races = [{race:'1000m',count:700}, 
    {race:'500m',count:500}, 
    {race:'1mile',count:0}, {race:'biath',count:400}];

  for (const r of races) {
    race = r.race;
    const exists = await bibCounter.findOne({ race });
    if (!exists) {
      await bibCounter.create({ race: r.race, count: r.count });
      console.log(`Initialized ${r.race}`);
    }
    else{
      await bibCounter.findOneAndUpdate({race},
        {count: r.count}
      )
      console.log(`Initialized? ${r.race}`);
    }
  }
  // const races = ['1000m', '500m', '1mile', 'biath'];
  // const bulkOps = races.map(race => ({
  //   updateOne: {
  //     filter: { race },
  //     update: { $setOnInsert: { count: 0 } },
  //     upsert: true,
  //   }
  // }));

  // await bibCounter.bulkWrite(bulkOps);
}

async function reInitializeRaces() {
  c1000m = await get_bib_num('1000m');
  c500m = await get_bib_num('500m');
  c1mile = await get_bib_num('1mile');
  cbiath = await get_bib_num('biath');
  const races = [{race:'1000m',count:c1000m.bib_num}, 
    {race:'500m',count:c500m.bib_num}, 
    {race:'1mile',count:c1mile.bib_num}, {race:'biath',count:cbiath.bib_num}];

  for (const r of races) {
    race = r.race;
    const exists = await bibCounter.findOne({ race });
    if (!exists) {
      await bibCounter.create({ race: r.race, count: r.count });
      console.log(`Initialized ${r.race}`);
    }
    else{
      await bibCounter.findOneAndUpdate({race},
        {count: r.count}
      )
      console.log(`Initialized? ${r.race}`);
    }
  }
}

async function incrementRaceCounter(race) {
  const result = await bibCounter.findOneAndUpdate(
    { race },
    { $inc: { count: 1 } },
    { new: true, upsert: true } // creates if missing
  );

  console.log(`Updated ${race} count to ${result.count}`);
  return result.count;
}

app.get('/inc',async  (req, res) => {
  race = req.query.race;
  const bib_n = await incrementRaceCounter(race);
  res.status(200).json(bib_n)
})

app.get('/init_count',async  (req, res) => {
  await initializeRaces();
  res.status(200).json({message:'good'})
})

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
      const reg_type = 'Season Pass'

      // Make sure to rename the variable to avoid conflict with the outer loop variable
      const updatedUser = await PrimaryUser.findOneAndUpdate(
        { name },
        { birthday, race, gender, bib_num, swim_time,ws,reg_type },
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

async function check_cookie(req,priv_req){
  // cookie = req.cookie['rnr_cookie']
  // if(cookie===undefined){
  //   return false
  // }
  entry = cookies.find(obj => obj.cookie === cookie)
  entry = await cookieDB.findOne({cookie})
  console.log(entry)
  if(!entry){
    console.log('shid')
    console.log('dickfart')
    return false

  }
  console.log(entry.priv <= priv_req)
  console.log(entry.priv)

  return (entry.priv <= priv_req)

}

app.get('/test',async  (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(await check_cookie(cookie,1)){
    res.status(200).json({'message':'OK'})
  }
  else{
    res.status(403).json({'message':'forbidden'})
  }
})

app.get('/drop_seasonpass',async  (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(await check_cookie(cookie,1)){
    try {
          await SeasonPass.deleteMany({});
          res.status(200).json({'message':"All documents deleted successfully."});
      } catch (error) {
        res.status(500).json({'error':"error deleting documents"});
      }
  }
  else{
    res.status(403).json({'message':'forbidden'})
  }
})

app.post('/login_reefnrun',async (req,res) => {
  try{
    uname = req.body.uname;
    pass = req.body.upass;
    const userinfo = await login.findOne({uname:uname});
    if(!userinfo){
      return res.status(401).json({'error':'no such user'})
    }
    hashed_password = crypto.createHash('sha256').update(userinfo.salt+pass).digest('hex')
    authed = (hashed_password === userinfo.upass)
    console.log(authed,hashed_password,userinfo.upass,pass)
    //generate log cookie
    if(authed){
      var cookie = make_cookie();
      priv = userinfo.priv;
      // cookies.push({cookie:cookie,priv:priv})
      const cook = new cookieDB({
        cookie: cookie,
        priv: priv
      });
    
      await cook.save();

      return res.status(200).json({'test':cookie,'user':cook}) 

    }
    else{
      return res.status(401).json({'error':'login failed'})
    }

  }
  catch{
    return res.status(500).json({'error':'internal server error'})
  }

})

function isValidDate(str) {
  const date = new Date(str);
  return !isNaN(date.getTime());
}

async function parseCSV(csvString) {
  // const lines = csvString.trim().split("\n").slice(1); // Split by line breaks
  const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
  const result = [];

  for (let line of lines.slice(1)) {
      // Regular expression to match CSV values, handling both quoted and unquoted values
      const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, ''));
      // console.log(values)
      if (values.length === 3) { // Ensure we have all 3 expected values
          result.push({
              name: values[0],
              dateOfBirth: values[1],
              gender: values[2]
          });
          name = values[0]
          birthday = values[1]
          if(!isValidDate(birthday)){
            console.log('invalid date',birthday);
            birthday = '1/1/1901';
          }
          gender = values[2]
          // if (gender === 'Female'){
          if (/[fF]/.test(gender)){
            gender = 'F'
          }
          if (/[mM]/.test(gender)){
            gender = 'M'
          }
          race = ''
          bib_num = ''
          swim_time = ''
          reg_type = 'Online'
          sp = false
          sp_ = await SeasonPass.findOne({name})
          console.log(sp_)
          console.log(name)
          if(sp_){
            sp = true
            
          }
          // const newPrimaryUser = new PrimaryUser({ name, birthday, race, gender,bib_num,swim_time });
          // await newPrimaryUser.save();
          
          const user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num,swim_time,reg_type,sp},
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
    // at some point this function was removed ? 
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

async function parseCSV_waivers(csvString) {
  // const lines = csvString.trim().split("\n").slice(1); // Split by line breaks
  const lines = csvString.split(/\r?\n/).filter(line => line.trim() !== '');
  console.log(lines)
  const result = [];

  for (let line of lines) {
      // Regular expression to match CSV values, handling both quoted and unquoted values
      name = line.replace(/['",]/g, '').toLowerCase()
      console.log(name)
      user = await waivers.findOne({name});
      console.log(user)
      if(!user){
        console.log('!',name)
        const entry = await waivers.findOneAndUpdate({name},{name},{ new: true, upsert: true })
        console.log(entry)
      }

  }

  return result;
}

app.post('/upload-waivers',async  (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,1))){
    res.status(403).json({'message':'forbidden'})
    return
  }
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
  await parseCSV_waivers(csvData);
return res.status(200).json({'message':'file uploaded sucessfully'})
  
});

app.post('/upload-csv',async  (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,1))){
    res.status(403).json({'message':'forbidden'})
    return
  }
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
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,1)){
    res.status(403).json({'message':'forbidden'})
    return
  }
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

// che
app.get("/users/seasonpass", async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!check_cookie(cookie,2)){
    res.status(403).json({'message':'forbidden'})
    return
  }
  const { name } = req.query;

  // try {
    let user;
    let user2;
    if (name) {
      user2 = await SeasonPass.findOne({ name });
      user = await PrimaryUser.findOne({ name });
    }
    else {
      return res.status(400).send({ error: "Provide a name or bib_num." });
    }

    // if (!user) {
    //   return res.status(200).send({ status: "unpaid" });
    // }
    console.log(user2)
    if(user2){
      return res.status(200).send({ status: "paid", waiver_status:'signed' });
    }
    if(!user){
      name1 = name.toLowerCase()
      entry = await waivers.findOne({name:name1})
      if(entry){
        return res.status(200).send({ status: "unpaid",waiver_status: 'signed' });
      }
      return res.status(200).send({ status: "unpaid",waiver_status: 'unsigned' });
    }
    if(user.reg_type === 'Online'){
      return res.status(200).send({ status: "paid", waiver_status:'signed'  });
    }
    else{
      name1 = name.toLowerCase()
      entry = await waivers.findOne({name:name1})
      if(entry){
        return res.status(200).send({ status: "unpaid",waiver_status: 'signed' });
      }
      return res.status(200).send({ status: "unpaid",waiver_status: 'unsigned' });
    }

    // res.status(200).send(user);
  // } catch (error) {
  //   res.status(500).send({ error: "Internal Server Error", details: error });
  // }
});


app.get('/rnr_login', (req, res) => {
  res.sendFile(path.join(__dirname, 'rnr_login.html'));
});

//serve html
// app.get('/join_swim', (req, res) => {
//   cookie = req.cookies['rnr_cookie']
//   if(!check_cookie(cookie,1)){
//     res.status(403).json({'message':'forbidden'})
//   }
//   res.sendFile(path.join(__dirname, 'join_swim.html'));
// });

app.get('/upload', async (req, res) => {
  cookie = req.cookies['rnr_cookie']

  if(!(await check_cookie(cookie,1))){
    res.status(403).json({'message':'forbidden'})
    return 
  }
  res.sendFile(path.join(__dirname, 'upload.html'));
});

app.get('/upload_waivers', async (req, res) => {
  cookie = req.cookies['rnr_cookie']

  if(!(await check_cookie(cookie,1))){
    res.status(403).json({'message':'forbidden'})
    return 
  }
  res.sendFile(path.join(__dirname, 'upload_waivers.html'));
});

app.get('/upload-seasonpass', async (req, res) => {
  console.log('test')
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,1))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  res.sendFile(path.join(__dirname, 'upload_seasonpass.html'));
});


app.get('/join_swim2', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,1))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  res.sendFile(path.join(__dirname, 'join_swim2.html'));
});

app.get('/start_race', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return 
  }
  res.sendFile(path.join(__dirname, 'start_race.html'));
});

app.get('/modern_swimmer2', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  console.log('kk',(await check_cookie(cookie,2)))
  if(!(await check_cookie(cookie,2))){
    console.log('fuck')
    res.status(403).json({'message':'forbidden'})
    return 
  }
  res.sendFile(path.join(__dirname, 'modern_swimmer2.html'));
});

app.get('/race_results', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return 
  }
  res.sendFile(path.join(__dirname, 'race_results.html'));
});

app.get('/log_times', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return 
  }
  res.sendFile(path.join(__dirname, 'log_times.html'));
});

app.get('/swim_archive', async (req, res) => {
  res.sendFile(path.join(__dirname, 'swim_archive.html'));
});

app.get('/allswimmers', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return
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
    // bib_num= count+1000
    bib_num = count + 700
  }
  if(race==='biath'){
    // bib_num= count+1500
    bib_num = count + 400
  }
  num_swimmers = await PrimaryUser.countDocuments({ });
  // return {bib_num:bib_num,num_swimmers:num_swimmers}
  return {bib_num:bib_num}


}

async function get_num_swimmers(race){
  var num_swimmers = await PrimaryUser.countDocuments({ });
  return {num_swimmers:num_swimmers}


}

async function clear_swims(){

  const current_swim = await Swim.updateMany({is_current: true},
    {is_current: false}
  )
}

  // POST /swims - Add a new swim
  app.post("/swims", async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,1))){
      return res.status(403).json({'message':'forbidden'})
    }
    const { swim_name } = req.body;
  
    if (!swim_name) {
      return res.status(400).send({ error: "Swim name is required." });
    }
  
    try {
      const newSwim = new Swim({ swim_name, is_open: true, is_current: true });
      await newSwim.save();
        //create current swim database
        start_new_race();
      PrimaryUser = mongoose.model(swim_name, primaryUserSchema);
      // add_season_pass() //add season pass holders
      initializeRaces() //initialize counters
      res.status(201).send({ message: "Swim added successfully." });
    } catch (error) {
      if (error.code === 11000) {
        PrimaryUser = mongoose.model(swim_name, primaryUserSchema);
        // add_season_pass() //add season pass holders
        res.status(409).send({ error: "Swim name already exists." });
        
      } else {
        res.status(500).send({ error: "Internal Server Error", details: error });
      }
    }
  });
  
  // GET /swims - List all swim names
  app.get("/swims", async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,1))){
      return res.status(403).json({'message':'forbidden'})
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
      return res.status(403).json({'message':'forbidden'})
    }
    const { swim_name } = req.body;
  
    if (!swim_name) {
      return res.status(400).send({ error: "Swim name is required." });
    }
  
    try {
      const updatedSwim = await Swim.findOneAndUpdate(
        { swim_name },
        { is_open: false , is_current: false},
        { new: true }
      );
      PrimaryUser = null;
  
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
  if(!(await check_cookie(cookie,2))){
      return res.status(403).json({'message':'forbidden'})
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

      const bib_num1 = await incrementRaceCounter(race);
      console.log('F',bib_num1)
      // total_swimmers = temp.num_swimmers;
      // const newPrimaryUser = new PrimaryUser({ name, birthday, race, gender,bib_num,swim_time });
      // await newPrimaryUser.save();
      const user1 = await PrimaryUser.findOne({ name });
      const sp_ = await SeasonPass.findOne({ name });
      if(sp_){
        let reg_type;
        if(user1){
          // bib_num = await incrementRaceCounter(race);
          user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num:bib_num1,swim_time,ws},
            { new: true, upsert: true })
          console.log('qqqq')
          console.log(user)
        }
        else{
          reg_type = 'Day of'
          sp = true
          // bib_num = await incrementRaceCounter(race);

          user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num:bib_num1,swim_time,ws,reg_type,sp},
            { new: true, upsert: true })
          console.log('what the hell',user)
        }
        // reg_type = 'Season Pass'
        // user = await PrimaryUser.findOneAndUpdate({name},
        //   {birthday, race, gender,bib_num,swim_time,ws,reg_type},
        //   { new: true, upsert: true })
    
      }
      else{
        if(user1){
          // bib_num = await incrementRaceCounter(race);
          console.log(bib_num1)
          user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num:bib_num1,swim_time,ws},
            { new: true, upsert: true })
        }
        else{
          reg_type = 'Day of'
          sp = false
          // bib_num = await incrementRaceCounter(race);
          console.log(bib_num1)
          user = await PrimaryUser.findOneAndUpdate({name},
            {birthday, race, gender,bib_num:bib_num1,swim_time,ws,reg_type,sp},
            { new: true, upsert: true })
          }
          console.log('what the hell',user)

      }
  
      // Check if user exists in Secondary Database
      const existingSecondaryUser = await SecondaryUser.findOne({ name });
      if (!existingSecondaryUser) {
        const newSecondaryUser = new SecondaryUser({ name, birthday, gender });
        await newSecondaryUser.save();
      }
      temp = await get_num_swimmers(race);
      total_swimmers = temp.num_swimmers;
  
      res.status(201).send({ message: "User added successfully.",
        user: user,
        bib_num: bib_num1,
        total_swimmers:total_swimmers});
    } catch (error) {
      console.log(error)
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
  if(!(await check_cookie(cookie,2))){
    return res.status(403).json({'message':'forbidden'})
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

    return res.status(200).send(user);
  } catch (error) {
    return res.status(500).send({ error: "Internal Server Error", details: error });
  }
});

app.get("/users", async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,2))){
      return res.status(403).json({'message':'forbidden'})
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
  
      return res.status(200).send(user);
    } catch (error) {
      return res.status(500).send({ error: "Internal Server Error", details: error });
    }
  });

// PATCH /users/swim-time - Update swim_time by bib_num
app.patch("/users/swim-time", async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,2))){
      res.status(403).json({'message':'forbidden'})
      return
    }
    const { bib_num, time } = req.body;
  
    if (!bib_num || !time) {
      return res.status(400).send({ error: "Both bib_num and time are required." });
    }
    const exists = await PrimaryUser.findOne({bib_num});
    console.log('////',exists)
    if(exists.swim_time!==''){
      return res.status(400).send({ error: "Time for this swimmer already logged"});
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
      return
    }
  });

// get all previous swimmers
app.get('/allswimmers', async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,2))){
      res.status(403).json({'message':'forbidden'})
      return
    }
    const existingSecondaryUser = await SecondaryUser.find()
    res.status(200).send(existingSecondaryUser);
    return
})

app.get('/currentswimmers', async (req, res) => {
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  try{
    const existingPrimaryUser = await PrimaryUser.find()
    res.status(200).send(existingPrimaryUser);
    return
  }
  catch{
    res.status(500).send({'error':'Internal Server Error'});
    return
  }
})

app.get('/search', async (req,res) =>{
  try{
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,2))){
      res.status(403).json({'message':'forbidden'})
      return 
    }
    string = req.query.string;
    const query = { name: { $regex: string, $options: 'i' } };
    users = await SecondaryUser.find(query)

    
    res.status(200).json(users)
    return
    
  }
  catch{
    res.status(500).json({'error':'Internal Server Error'})
  }
})

app.get('/userinfo', async (req, res) => {
    cookie = req.cookies['rnr_cookie']
    if(!(await check_cookie(cookie,2))){
      res.status(403).json({'message':'forbidden'})
      return 
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
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  try{
    if(PrimaryUser){
      swim_name = PrimaryUser.collection.modelName
      start_time = req.body.time
      const current_swim = await Swim.findOneAndUpdate({swim_name: swim_name},
        {start_time},
        {new: true}
    )
    res.status(200).json({'message':`time ${start_time}`,'swim':current_swim})
    }
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.get('/race', async (req,res)=>{
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  try{
    if(PrimaryUser){
      swim_name = PrimaryUser.collection.modelName
      const current_swim = await Swim.findOne({swim_name: swim_name})
      if(current_swim){
        res.status(200).json({'time':current_swim.start_time})
      }
      else{
        res.status(500).json({'error':'internal server error'})
      }
    }
    else{
      res.status(500).json({'error':'no current swim'})
    }
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.get('/race/restart', async (req,res)=>{
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  try{
    start_time = null;
    const current_swim = await Swim.findOneAndUpdate({is_current: true},
      {start_time: null},
      {new: true}
    )
    res.status(200).json({'message':'restarted','swim':current_swim})
  }
  catch{
    res.status(500).json({'error':`server error`})
  }
})

app.post('/upload_race_results',async (req,res)=>{
  cookie = req.cookies['rnr_cookie']
  if(!(await check_cookie(cookie,2))){
    res.status(403).json({'message':'forbidden'})
    return
  }
  fname = req.body.fname;
  db1 = null;
  try{
    db1 = PrimaryUser.collection.modelName
  }
  catch{
    return res.status(500).json({'error':'no swim started'})
  }
  try{
    const swim_file = new resultsDB({fname:fname,dbname:db1})
    swim_file.save()
    return res.status(200).json({'message':'record created'})
  }
  catch{
    return res.status(500).json({'error':'internal server error'})
  }



})

app.get('/results/:swim_name',async (req,res)=>{
  const swim_name = req.params.swim_name;
  const db_info = await resultsDB.findOne({fname:swim_name})
  console.log(db_info)
  try{
    x = db_info.dbname;
    TempUser = mongoose.model(x, primaryUserSchema);
    const prev_users = await TempUser.find()
    res.status(200).send(prev_users);

  }
  catch{
    return res.status(500).json({'error':'error retrieving database'})
  }
  

})

app.get('/results',async (req,res) =>{
  try{
    data = await resultsDB.find()
    res.status(200).json(data)
  }
  catch{
    return res.status(500).json({'error':'internal server error'})
  }
})



app.get('/archive/:swim_name',async (req,res)=>{
  endpoint = `/results/${req.params.swim_name}`
  test = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Race Results</title>
    <link rel="stylesheet" href="/css/hamburger.css">
    <link rel="stylesheet" href="/css/table.css">
</head>
<body>
    <h1>Race Results</h1>
    <div id="results"></div>
    <script src="/js/race_results.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            fetch('${endpoint}').then(x=>{
                x.json().then(dummyData=>{
                    displayResults(dummyData);
                })
            })
            // displayResults(dummyData);
        });
    </script>
</body>
</html>
`
  res.status(200).send(test)

})

// Start the server
const PORT = parseInt(process.argv[2]);
if(PORT == 443){
  const options = {
    // key: fs2.readFileSync("/home/ubuntu/privkey.pem"),
    // cert: fs2.readFileSync("/home/ubuntu/fullchain.pem")
    key: fs2.readFileSync("/etc/letsencrypt/live/anomaloussignalsgroup.com/privkey.pem"),
    cert: fs2.readFileSync("/etc/letsencrypt/live/anomaloussignalsgroup.com/fullchain.pem")
  };
  https.createServer(options, app).listen(443, () => {
    console.log("Secure server running on port 443");
  });
  // app.listen(80, () => {
  //   console.log(`Server is running on http://localhost:80`);
  // });
}
else{
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

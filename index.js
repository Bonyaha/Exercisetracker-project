const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

app.use(cors())
app.use(express.static('public'))

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Conection to mongoose
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("Connection error", error);
  });

// Define the schema for user
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

// Create the model
let User = mongoose.model('User', userSchema);

//Define the shema for exercise
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duratioin: Number,
  date: { type: Date, default: Date.now },
})
// Create the model
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', async(req, res) => {
  console.log('request is: ', req.body);
  try{
    const newUser = new User({username:req.body.username});
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  }
  catch(err){
    res.status(500).send(err);
  }
})

app.get('/api/users', async(req,res)=>{
  try{
    const users = await User.find({});
    console.log(users);
    res.json(users.map(user=>({username:user.username, _id: user._id})))
  }catch(err){
    res.status(500).send(err);
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

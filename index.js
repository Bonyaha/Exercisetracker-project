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

// Create the model for user
let User = mongoose.model('User', userSchema);

//Define the shema for exercise
const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
})
// Create the model for exercise
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.post('/api/users', async (req, res) => {
  console.log('request is: ', req.body);
  try {
    const newUser = new User({ username: req.body.username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  }
  catch (err) {
    res.status(500).send(err);
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    console.log(users);
    res.json(users.map(user => ({ username: user.username, _id: user._id })))
  } catch (err) {
    res.status(500).send(err);
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body
  const userId = req.params._id;
  const exerciseDate = date ? new Date(date) : new Date()
  console.log('userId is: ', userId);
  console.log('description is: ', description);
  console.log('date is: ', exerciseDate);
  console.log('duration is: ', typeof duration);
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');
    console.log('user is: ', user);
    const newExercise = new Exercise({
      userId: user._id,
      description,
      duration: parseInt(duration),
      date: exerciseDate,
    });
    const savedExercise = await newExercise.save();
    console.log('duration is: ', savedExercise.duration);

    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(), // Convert to dateString format,
      duration: savedExercise.duration,
      description: savedExercise.description
    });
  }
  catch (err) {
    res.status(500).send(err);
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');
    
    let filter = { userId }; // Initialize the filter with the userId
    if (from || to) {
      filter.date = {}; // Initialize the date filter

      if (from) filter.date.$gte = new Date(from); // Add 'from' date to the filter
      if (to) filter.date.$lte = new Date(to); // Add 'to' date to the filter
    }
    
    const exercises = await Exercise.find(filter).limit(parseInt(limit)).populate('userId', 'username');
    console.log('exercises are: ', exercises);
    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: ex.date.toDateString(), // Convert to dateString format
        user: ex.userId
      })),
    });
  } catch (err) {
    res.status(500).send(err);
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

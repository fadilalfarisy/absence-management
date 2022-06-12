const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const nodeGeocoder = require('node-geocoder');
const { Absent } = require('./schema.js')
const cors = require('cors')
const saltRounds = 10;

const app = express();

const options = { provider: 'openstreetmap' };
const geoCoder = nodeGeocoder(options);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('view'))
app.use(cors())

mongoose.connect('mongodb://localhost:27017/myapp')
    .then(() => console.log('connected'))
    .catch((err) => console.log(err));


app.get('/', async (req, res) => {
    try {
        if (req.cookies.username) {
            res.redirect('/home')
        } else {
            res.redirect('/login')
        }
    } catch (err){
        console.log(err.message);
        res.redirect('/login')
    }  
    
})


app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html')
})


app.post('/login', async (req, res) => {
    const { username, password } = req.body

    try {
        const user = await Absent.findOne({ username })
        if (!user) {
            return res.send('Cannot found your account!')
        }

        await bcrypt.compare(password, user.password)
        res.cookie('username', username, { expires: new Date(Date.now() + 900000), httpOnly: true })
        res.redirect('/home')

    } catch (err) {
        console.log(err)
        res.status(500).send('Your username or password is invalid')
    }
})


app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/views/register.html')
})


app.post('/register', async (req, res) => {
    const { username, password } = req.body

    try {
        const user = await Absent.findOne({ username })
        if (user) {
            return res.send('Your username was used')
        }

        const hashPassword = await bcrypt.hash(password, saltRounds)
        const newUser = new Absent({
            username: username,
            password: hashPassword
        })
        await newUser.save()

        res.cookie('username', username, { expires: new Date(Date.now() + 900000), httpOnly: true })
        res.redirect('/home')

    } catch (err) {
        console.log(err.message)
        res.status(500).send('Something error!')
    }
})


app.get('/home', async (req, res) => {
    const username = req.cookies.username
    try {
        const user = await Absent.findOne({ username })
        if (!user) {
            return res.redirect('/login')
        }
        res.sendFile(__dirname + '/views/home.html')
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Something error!')
    }
})


app.post('/clockIn', async (req, res) => {
    const { latitude, longitude } = req.body;
    const username = req.cookies.username

    try {
        let location = await geoCoder.reverse({ lat: latitude, lon: longitude })
        location = location[0].formattedAddress
        const clockIn =  {
                location,
                time: new Date()
            }

        const user = await Absent.updateOne({ username,  $push: { masuk : clockIn } })
        console.log(user)
    } catch (err){
        console.log(err.message);
        res.send('ClockIn Failed')
    }
})

app.post('/clockOut', async (req, res) => {
    const { latitude, longitude } = req.body;
    const username = req.cookies.username

    try {
        let location = await geoCoder.reverse({ lat: latitude, lon: longitude })
        location = location[0].formattedAddress
        const clockIn =  {
                location,
                time: new Date()
            }

        const user = await Absent.updateOne({ username,  $push: { keluar : clockIn } })
        console.log(user)
    } catch (err){
        console.log(err.message);
        res.send('ClockOut Failed')
    }
})

app.get('/history', async(req, res)=>{
    const username = req.cookies.username

    try {
        const history =  await Absent.findOne({username}).select('masuk').select('keluar');
        res.json(history)
    } catch (err){
        console.log(err.message);;
        res.send('Failed to Load')
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('username')
    res.redirect('/login')
})

app.listen(3000, () => {
    console.log('http://localhost:3000')
})
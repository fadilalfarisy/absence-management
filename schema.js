const mongoose = require('mongoose')

const absentSchema = new mongoose.Schema({
    username: String,
    password: String,
    masuk: [{
            location: String,
            time: Date
        }],
    keluar: [{
        location: String,
        time: Date
    }]
})

const Absent = mongoose.model('Absent', absentSchema);

module.exports = { Absent }
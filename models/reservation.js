const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    UUID:{
        type: String
    },
    StudentIDS:[{
        type: String
    }],
    Activity:{
        type: String
    },
    Timeslot:{
        type: Number
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
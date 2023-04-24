//Import modules
const express = require('express');
const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid');
const http = require('http');
const { Server } = require('socket.io');

//Import MongoDB models
const ReservationModel = require('./models/reservation.js');

//Initialize variables
const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

//Create the Queue class
class Queue{
    constructor(tasks){
        this.tasks = tasks;
    }
    async push(task){
        (this.tasks).push(task);
        if(this.tasks.length == 1){
            while(this.tasks.length > 0){
                (this.tasks).shift();
            }
        }
    }
}
var queue = new Queue([]);

//Set configuration
app.use(express.static(__dirname + '/Client'));
app.use(express.json());

//Connect to MongoDB
mongoose.set("strictQuery", false);
mongoose.connect('mongodb://127.0.0.1:27017/SF_Reservation', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;

//Set routes
app.get('/', function(req, res){
    res.status(200).sendFile(__dirname + '/Client/Reservations/index.html');
});
app.get('/dashboard', function(req, res){
    res.status(200).sendFile(__dirname + '/Client/Dashboard/index.html');
});
app.post('/get-timeslots', async function(req, res){
    try{
        var currentTime = new Date();
        var Reservations = await ReservationModel.find({Timeslot: {$gte: currentTime.getTime()}});
        var response = {
            haunted_house: [],
            escape_game: [],
            asseto_corsa: [],
            call_of_duty: [],
            fifa: [],
            mario_kart: [],
            rocket_league: [],
            vr_goggles: []
        };
        for(var i=0; i<Reservations.length; i++){
            switch(Reservations[i].Activity){
                case 'haunted-house':
                    response.haunted_house.push(Reservations[i].Timeslot);
                    break;
                case 'escape-game':
                    response.escape_game.push(Reservations[i].Timeslot);
                    break;
                case 'asseto-corsa':
                    response.asseto_corsa.push(Reservations[i].Timeslot);
                    break;
                case 'call-of-duty':
                    response.call_of_duty.push(Reservations[i].Timeslot);
                    break;
                case 'fifa':
                    response.fifa.push(Reservations[i].Timeslot);
                    break;
                case 'mario-kart':
                    response.mario_kart.push(Reservations[i].Timeslot);
                    break;
                case 'rocket-league':
                    response.rocket_league.push(Reservations[i].Timeslot);
                    break;
                case 'vr-goggles':
                    response.vr_goggles.push(Reservations[i].Timeslot);
            }
        }
        res.status(200).send(response);
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
app.post('/get-dashboard', async function(req, res){
    try{
        var team = req.body.team;
        var currentTime = new Date;
        if(team == 'haunted-house'){
            //Get all reservations from 10 minutes earlier
            var Reservations = await ReservationModel.find({Activity: 'haunted-house', Timeslot: {$gte: (currentTime.getTime()-(10*60*1000))}}, null, {sort: {Timeslot: 1}});
            res.status(200).send(Reservations);
        }else if(team == 'escape-game'){
            var Reservations = await ReservationModel.find({Activity: 'escape-game', Timeslot: {$gte: (currentTime.getTime()-(10*60*1000))}}, null, {sort: {Timeslot: 1}});
            res.status(200).send(Reservations);
        }else if(team == 'vr-goggles'){
            var Reservations = await ReservationModel.find({Activity: 'vr-goggles', Timeslot: {$gte: (currentTime.getTime()-(10*60*1000))}}, null, {sort: {Timeslot: 1}});
            res.status(200).send(Reservations);
        }else{ //team == games
            var Reservations = await ReservationModel.find({Activity: {$in: ['asseto-corsa', 'call-of-duty', 'fifa', 'mario-kart', 'rocket-league']}, Timeslot: {$gte: (currentTime.getTime()-(10*60*1000))}}, null, {sort: {Timeslot: 1}});
            res.status(200).send(Reservations);
        }
    }catch(e){
        console.log(e);
        res.sendStatus(500);
    }
});
app.put('/make-reservation', async function(req, res){
    var currentTask = req.body;
    //Check that none of the students have already done a reservation in this activity
    var AlreadyParticipated = [];
    for(var i=0; i<(currentTask.ids).length; i++){
        if(await ReservationModel.exists({Activity: currentTask.activity, StudentIDS:{$in: (currentTask.ids[i])}})) AlreadyParticipated.push(currentTask.ids[i]);
    }
    //Check that the timeslot is available
    var AvailableSlot = true;
    if(await ReservationModel.exists({Activity: currentTask.activity, Timeslot: currentTask.timeslot})) AvailableSlot = false;
    if(AlreadyParticipated.length > 0){
        //Send to socket id that a user already participated
        res.status(401).send({error: "invalid_user", ids: AlreadyParticipated});
    }else if(!AvailableSlot){
        res.status(401).send({error: "taken_slot", timeslot: currentTask.timeslot});
    }else{
        //Save the reservation
        var NewReservation = new ReservationModel({
            UUID: uuidv4(),
            StudentIDS: currentTask.ids,
            Activity: currentTask.activity,
            Timeslot: currentTask.timeslot
        });
        await NewReservation.save();
        //Send to socket id that the operation was successful
        res.sendStatus(200);
        //Send socket that timeslot has been taken
        io.sockets.emit("timeslot", NewReservation);
    }

});

//Start the server
server.listen(PORT, function(){
    console.log(`Springfest reservation system listening on port: ${PORT}`)
});
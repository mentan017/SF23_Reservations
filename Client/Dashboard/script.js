var Team = '';

//Socket connection
var socket = io();

document.getElementById("submit-btn").addEventListener("click", SubmitTeam);

async function SubmitTeam(){
    var team = document.getElementById("team-input").value;
    Team = team;
    var response = await fetch('/get-dashboard', {
        method: "POST",
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({team: team})
    });
    if(response.status == 200){
        var responseData = await response.json();
        if(Team == 'haunted-house'){
            document.title = 'Haunted house dashboard';
            document.getElementById("title").innerHTML = 'Haunted house reservations';
        }else if(Team == 'escape-game'){
            document.title = 'Escape game dashboard';
            document.getElementById("title").innerHTML = 'Escape game reservations';
        }else if(Team == 'games'){
            document.title = 'Games dashboard';
            document.getElementById("title").innerHTML = 'Games reservations';
        }
        document.getElementById('input-area').style.display = 'none';
        for(var i=0; i<responseData.length; i++){
            var tempdate = new Date();
            tempdate.setTime(responseData[i].Timeslot);
            var minutes = (tempdate.getMinutes()).toString();
            if(minutes.length < 2) minutes = '0' + minutes;    
            document.getElementById("reservations").innerHTML += `
            <div class="reservation" data-timeslot="${responseData[i].Timeslot}">
                <p><b>Activity: </b>${responseData[i].Activity}</p>
                <p><b>Participants (${responseData[i].StudentIDS.length}): </b></p>
                <p>${responseData[i].StudentIDS.join(', ')}</p>
                <p><b>Timeslot: </b>${tempdate.getHours()}:${minutes}</p>
            </div>`;
        }
        DeleteOldReservations();
    }
}
function DeleteOldReservations(){
    var reservations = document.getElementsByClassName('reservation');
    var i=0;
    while(i < reservations.length){
        if(parseInt(reservations[i].getAttribute('data-timeslot')) < ((new Date()).getTime() - (10 * 60 * 1000))){
            reservations[i].remove();
        }else{
            i++;
        }
    }
    setTimeout(DeleteOldReservations, 2000);
}

socket.on('timeslot', function(response){
    var GamesActivities = ['asseto-corsa', 'call-of-duty', 'fifa', 'mario-kart', 'rocket-league'];
    console.log(response);
    if(Team != 'games'){
        if(response.Activity == Team){
            var tempdate = new Date();
            tempdate.setTime(response.Timeslot);
            var minutes = (tempdate.getMinutes()).toString();
            if(minutes.length < 2) minutes = '0' + minutes;    
            document.getElementById("reservations").innerHTML += `
            <div class="reservation" data-timeslot="${response.Timeslot}">
                <p><b>Activity: </b>${response.Activity}</p>
                <p><b>Participants (${response.StudentIDS.length}): </b></p>
                <p>${response.StudentIDS.join(', ')}</p>
                <p><b>Timeslot: </b>${tempdate.getHours()}:${minutes}</p>
            </div>`;
        }
    }else{
        if(GamesActivities.includes(response.Activity)){
            var tempdate = new Date();
            tempdate.setTime(response.Timeslot);
            var minutes = (tempdate.getMinutes()).toString();
            if(minutes.length < 2) minutes = '0' + minutes;
            document.getElementById("reservations").innerHTML = `
            <div class="reservation" data-timeslot="${response.Timeslot}">
                <p><b>Activity: </b>${response.Activity}</p>
                <p><b>Participants (${response.StudentIDS.length}): </b></p>
                <p>${response.StudentIDS.join(', ')}</p>
                <p><b>Timeslot: </b>${tempdate.getHours()}:${minutes}</p>
            </div>`;
        }
    }
});
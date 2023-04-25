var CurrentActivity = 'haunted-house';
//Set the taken timeslots
var slots_haunted_house = [];
var slots_escape_game = [];
var slots_asseto_corsa = [];
var slots_call_of_duty = [];
var slots_fifa = [];
var slots_mario_kart = [];
var slots_rocket_league = [];
var slots_vr_goggles = [];

//Socket connection
var socket = io();

window.onload = GetTimeslots();

document.getElementById("activity").addEventListener("change", function(e){
    e.stopImmediatePropagation();
    document.getElementById("ids-container").innerHTML = "";
    var activity = document.getElementById("activity").value;
    CurrentActivity = activity;
    if(activity == 'asseto-corsa'){
        for(var i=0; i<2; i++){
            document.getElementById("ids-container").innerHTML += `<input class="id" placeholder="ID" type="number">`;
        }
    }else if(activity == 'escape-game'){
        for(var i=0; i<6; i++){
            document.getElementById("ids-container").innerHTML += `<input class="id" placeholder="ID" type="number">`;
        }
    }else if(activity == 'vr-goggles'){
        for(var i=0; i<3; i++){
            document.getElementById("ids-container").innerHTML += `<input class="id" placeholder="ID" type="number">`;
        }
    }else{
        for(var i=0; i<4; i++){
            document.getElementById("ids-container").innerHTML += `<input class="id" placeholder="ID" type="number">`;
        }
    }
    UpdateTimeslots();
});
document.getElementById("submit-btn").addEventListener("click", function(e){
    e.stopImmediatePropagation();
    Submit();
});
document.getElementById("submit-btn").addEventListener("keypress", function(e){
    e.stopImmediatePropagation();
    if(e.keyCode == 13) Submit();
});
async function Submit(){
    var ids_elements = document.getElementsByClassName("id");
    var ids = [];
    for(var i=0; i<ids_elements.length; i++){
        if((ids_elements[i].value) > 0){
            ids.push(ids_elements[i].value);  
        } 
    }
    var timeslot = document.getElementById("timeslot").value;
    if(ids.length > 0){
        var response = await fetch('/make-reservation', {
            method: "PUT",
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({activity: CurrentActivity, ids: ids, timeslot: timeslot, socketId: socket.id})
        });
        if(response.status == 200){
            var responseData = await response.json();
            window.alert("Successfully made the reservation");
            var ids_elements = document.getElementsByClassName("id");
            for(var i=0; i<ids_elements.length; i++){
                ids_elements[i].value = '';
            }
        }else if(response.status == 401){
            var responseData = await response.json();
            if(responseData.error == "invalid_user"){
                window.alert(`The students ${responseData.ids} already participated to this activity`);
            }else if(responseData.error == "taken_slot"){
                var d = new Date();
                d.setTime(responseData.timeslot);
                window.alert(`Couldn't make the reservation at ${d.getHours}:${d.getMinutes}`);
            }
        }else if(response.status == 500){
            window.alert("Server error!");
        }
    }
}
async function GetTimeslots(){
    var response = await fetch('/get-timeslots', {
        method: "POST",
        headers: {'Content-type': 'application/json'},
    });
    if(response.status == 200){
        var responseData = await response.json();
        for(var i=0; i<responseData.haunted_house.length; i++){
            slots_haunted_house.push(responseData.haunted_house[i]);
        }
        for(var i=0; i<responseData.escape_game.length; i++){
            slots_escape_game.push(responseData.escape_game[i]);
        }
        for(var i=0; i<responseData.asseto_corsa.length; i++){
            slots_asseto_corsa.push(responseData.asseto_corsa[i]);
        }
        for(var i=0; i<responseData.call_of_duty.length; i++){
            slots_call_of_duty.push(responseData.call_of_duty[i]);
        }
        for(var i=0; i<responseData.fifa.length; i++){
            slots_fifa.push(responseData.fifa[i]);
        }
        for(var i=0; i<responseData.mario_kart.length; i++){
            slots_mario_kart.push(responseData.mario_kart[i]);
        }
        for(var i=0; i<responseData.rocket_league.length; i++){
            slots_rocket_league.push(responseData.rocket_league[i]);
        }
        for(var i=0; i<responseData.vr_goggles.length; i++){
            slots_vr_goggles.push(responseData.vr_goggles);
        }
    }
    UpdateTimeslots();
}
function UpdateTimeslots(){
    var invalidTimeslots = [];
    var slotlength = 3 * 60 * 1000; //Change this according to the activity
    switch(CurrentActivity){
        case 'haunted-house':
            invalidTimeslots = slots_haunted_house;
            break;
        case 'escape-game':
            invalidTimeslots = slots_escape_game;
            slotlength = 5 * 60 * 1000;
            break;
        case 'asseto-corsa':
            invalidTimeslots = slots_asseto_corsa;
            break;
        case 'call-of-duty':
            invalidTimeslots = slots_call_of_duty;
            break;
        case 'fifa':
            invalidTimeslots = slots_fifa;
            break;
        case 'mario-kart':
            invalidTimeslots = slots_mario_kart;
            break;
        case 'rocket-league':
            invalidTimeslots = slots_rocket_league;
            break;
        case 'vr-goggles':
            invalidTimeslots = slots_vr_goggles;
            slotlength = 10 * 60 * 1000;
            break;
    }
    //Update the timeslots
    var TimeslotsInput = document.getElementById("timeslot");
    var currentTime = new Date;
    var timeslots = [];
    var StartTime = new Date(`${currentTime.getMonth()+1} ${currentTime.getDate()}, ${currentTime.getFullYear()} 10:30:00`);
    var EndTime = new Date(`${currentTime.getMonth()+1} ${currentTime.getDate()}, ${currentTime.getFullYear()} 14:30:00`);
    var nextSlot = currentTime.getTime() + (slotlength - ((currentTime.getTime() - StartTime.getTime())%slotlength));
    while((timeslots.length < 10) && (nextSlot < EndTime.getTime())){
        if(!(invalidTimeslots.includes(nextSlot))){
            timeslots.push(nextSlot);
        }
        nextSlot += slotlength;
    }
    TimeslotsInput.innerHTML = '';
    for(var i=0; i<timeslots.length; i++){
        var tempDate = new Date();
        tempDate.setTime(timeslots[i]);
        var minutes = (tempDate.getMinutes()).toString();
        if(minutes.length < 2) minutes = '0' + minutes;
        TimeslotsInput.innerHTML += `<option value="${timeslots[i]}">${tempDate.getHours()}:${minutes}</option>`;
    }
}

socket.on('timeslot', function(response){
    switch(response.Activity){
        case 'haunted-house':
            slots_haunted_house.push(parseInt(response.Timeslot));
            break;
        case 'escape-game':
            slots_escape_game.push(parseInt(response.Timeslot));
            break;
        case 'asseto-corsa':
            slots_asseto_corsa.push(parseInt(response.Timeslot));
            break;
        case 'call-of-duty':
            slots_call_of_duty.push(parseInt(response.Timeslot));
            break;
        case 'fifa':
            slots_fifa.push(parseInt(response.Timeslot));
            break;
        case 'mario-kart':
            slots_mario_kart.push(parseInt(response.Timeslot));
            break;
        case 'rocket-league':
            slots_rocket_league.push(parseInt(response.Timeslot));
            break;
        case 'vr-goggles':
            slots_vr_goggles.push(parseInt(response.Timeslot));
    }
    if(CurrentActivity == response.Activity){
        UpdateTimeslots();
    }
});
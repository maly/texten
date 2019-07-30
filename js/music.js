var mute = false;
var played = null;
const nomusic = true;

var stop = (id) => {
    $("audio#" + id)[0].pause();
    $("audio#" + id).hide();

    played = null;
}


var play = (id) => {
    if (played) stop(played);
    if (!nomusic) $("audio#" + id)[0].play();
    $("audio#" + id)[0].volume = 0.4;
    $("audio#" + id)[0].onended = function () {
        alert("The audio has ended" + id);
    };
    $("audio#" + id).show();
    played = id;
}

module.exports = {
    play,
    stop
}
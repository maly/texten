var mute = false;
var played = null;

var stop = (id) => {
    $("video#" + id)[0].pause();
    $("video#" + id).hide();
}


var play = (id) => {
    if (played) stop(played);
    $("video#" + id)[0].play();
    $("video#" + id).show();
    played = id;
}

module.exports = {
    play,
    stop
}
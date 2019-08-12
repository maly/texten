//var mute = false;
var played = null;
const nomusic = !true;
// (process.env.NODE_ENV === "development")

var stop = id => {
  $("audio#" + id)[0].pause();
  $("audio#" + id).hide();

  played = null;
};

var wait = async ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

var fade = async () => {
  var audio = $("audio#" + played)[0];

  var newvol = audio.volume - 0.1;
  while (newvol > 0) {
    audio.volume = newvol;
    newvol -= 0.1;
    await wait(400);
  }
  audio.pause();
  $("audio#" + played).hide();
  played = null;
  return;
};

var fadeTo = async newTune => {
  var newAudio = $("audio#" + newTune)[0];
  var audio = $("audio#" + played)[0];
  newAudio.volume = 0;
  if (!nomusic) newAudio.play();

  var newvol = audio.volume - 0.1;
  while (newvol > 0) {
    audio.volume = newvol;
    newvol -= 0.1;
    newAudio.volume += 0.1;
    await wait(400);
  }
  audio.pause();
  $("audio#" + played).hide();
  $("audio#" + newTune).show();
  played = newTune;
  return;
};

var play = id => {
  if (played) stop(played);
  if (!nomusic) $("audio#" + id)[0].play();
  $("audio#" + id)[0].volume = 0.5;
  /*
  $("audio#" + id)[0].onended = function() {
    alert("The audio has ended" + id);
  };
  */
  $("audio#" + id).show();
  played = id;
};

module.exports = {
  play,
  stop,
  fade,
  fadeTo
};

var txt = `Konečně jste dojeli.
Gordon odbočil ze silnice na nějakou příjezdovou cestu, ještě asi dvacet minut jste se kodrcali přes šílené výmoly, a na konci byla farma. Gordon zajel náklaďákem přes dvůr ke stodole a zastavil motor.

To ticho, co se rozhostilo kabinou po vypnutí motoru, bylo ohlušující.

"Chvilku počkejte, já vám otevřu zvenčí, ono se to zevnitř nějak zasekává," řekl Gordon a vylezl ven. Za chvilku už otvíral dveře na tvojí straně.

Seskočil jsi dolů z kabiny a zabouchnul za sebou dveře.`;

module.exports = {
  id: "road_van_stop",
  desc: "",
  exits: [],
  attrs: [],
  async _enter(g) {
    //await g.waitForEnter();
    //console.log("onEnter", g);
    await g.dispML(txt);
    g.cls();
    await g.dispML("Zaslechl jsi, jak něco křuplo.");
    g.musicPlay("music2");
    g.videoPlay("video2");
    g.cls();
    await g.dispML(
      '"Co to bylo?" zeptal ses Gordona, ale uvědomil sis, že nic neříkáš. V uších ti začalo hrozně hvízdat a najednou byla tma.'
    );
    g.cls();
    g.cEnter("r1");
    //g.startStepTick("roadr1", () => g.cEnter("r1"), 3);
    //g.startStepCounter(()=>{g.cEnter("road_rstop")})
  },
  handlers: []
};

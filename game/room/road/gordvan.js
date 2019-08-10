module.exports = {
  id: "road_van",
  desc:
    "Sedíš v náklaďáku snad z doby starýho Forda. Zvenčí vypadá jako rozhrkaná kraksna, a zevnitř je to ještě horší. Pásy tu nejsou, tak se musíš držet, čeho se dá.",
  ext: `Vedle tebe sedí Gordon a řídí. Vypadá sympaticky. I když v tvojí situaci by sympaticky vypadal kdokoli, kdo by ti byl ochotný pomoci.
Naštěstí moc nemluví, žvejká sirku v koutku úst a sleduje cestu. Ale i kdyby mluvil, tak ho neuslyšíš, protože motor řve tak strašně, jako kdybyste ho měli přímo v kabině a ne pod kapotou.
Nemůžeš dělat nic, jen čekat a rozhlížet se...`,
  exits: [],
  attrs: [],
  atmosphere: {
    type: "shuffle",
    strings: [
      "Už abyste byli na místě. Koupel ti fakt bodne.",
      '"Už tam budem," huláká Gordon, aby překřičel motor, a povzbudivě se usmívá.',
      "Dnešek fakt stál za to..."
    ]
  },
  _enter(g) {
    console.log("onEnter", g);
    g.startStepTick("rvan", () => g.cEnter("road_van_stop"), 3);
    //g.startStepCounter(()=>{g.cEnter("road_rstop")})
  },
  handlers: []
};

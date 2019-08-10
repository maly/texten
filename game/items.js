const items = [
  require("./item/auto.js"),
  require("./item/rezerva.js"),
  require("./item/hever.js"),
  {
    id: "louc",
    name: "louč-,e,i",
    desc: "Riadný smolný klacek",
    attrs: [],
    where: "r1",
    handlers: []
  },
  {
    id: "bota-rozbita",
    name: "bot-a,y,ě,u",
    adj: "rozbit-á,é,é,ou",
    desc: "Škrpál",
    attrs: [],
    where: "r1",
    handlers: {
      pick: [[[], [[".", "Smrdí"]]]]
    }
  },
  {
    id: "obalka",
    name: "obál-ka,ky,ce,ku",
    desc:
      "Dopisní obálka. Odesilatel je právní kancelář Penn and Graw se sídlem v Denveru, adresátem je pan William Stewart, 1150 Merridale Road, Denver. Takže to je dopis pro tebe! Obálka je otevřená a uvnitř - prázdná! Asi tam nějaký dopis byl, ale už není.",
    attrs: ["crate"],
    where: "*",
    handlers: []
  },
  {
    id: "nuz",
    name: "n-ůž,ože,oži",
    desc: "Kudla jako cyp",
    attrs: [],
    where: "*",
    handlers: []
  },
  {
    id: "bota",
    name: "bot-a,y,ě,u",
    desc: "Adýdaska",
    attrs: [],
    where: "r1",
    handlers: []
  },
  {
    id: "botnik",
    name: "botník-,u,u",
    desc: "Police na boty",
    attrs: ["crate", "nonmovable"],
    where: "r1",
    _handlers: {
      // "use-louc-on": '. "Botník hoří!"; CT bothor'
      /*
			[
				[
					[],[
					[".","Botník hoří!"],["CT","bothor"]
					]
				]
			]
			*/
    }
  }
];

module.exports = items;

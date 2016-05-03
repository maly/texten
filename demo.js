var g = {
	rooms: [
		{
			id: "r1",
			title: "Room1",
			desc: "Stojíš v místnosti",
			exits: [
				{
					"to": "do chodby",
					"room": "r2"
				},
				{
					"to": "na balkon",
					"room": "r3",
					"attrs": ["inactive"]
				},

			],
			attrs: ["player"],
			handlers: []
		},
		{
			id: "r2",
			title: "Room2",
			desc: "Stojíš v chodbě",
			exits: [				{
					"to": "do pokoje",
					"room": "r1"
				}
			],
			attrs: [],
			handlers: []
		},
		{
			id: "r3",
			title: "Room3",
			desc: "Stojíš na malém balkonu nad rušnou ulicí. Zábradlí vypadá docela zpuchřelé, tak bych se, být tebou, neopíral...",
			exits: [				{
					"to": "do pokoje",
					"room": "r1"
				}
			],
			attrs: [],
			handlers: []
		},
	],
	items: [
		{
			id: "louc",
			name: {N:"louč",A:"louč", AD1:"zapálenou"},
			desc: "Riadný smolný klacek",
			attrs: [],
			where: "r1",
			handlers: []
		},
		{
			id: "bota-rozbita",
			name: {N:"bota",A:"botu", AD1: "starou", AD2:"rozbitou"},
			desc: "Škrpál",
			attrs: [],
			where: "r1",
			handlers: {"pick":[
				[
					[],[
					[".","Smrdí"]
					]
				]
			]}
		},
		{
			id: "nuz",
			name: {N:"nůž",A:"nůž"},
			desc: "Kudla jako cyp",
			attrs: [],
			where: "*",
			handlers: []
		},
		{
			id: "bota",
			name: {N:"bota",A:"botu"},
			desc: "Adýdaska",
			attrs: [],
			where: "r1",
			handlers: []
		},
		{
			id: "botnik",
			name: {N:"botník",A:"botník", G:"botníku", AD1: "starý", AD1G: "starého"},
			desc: "Police na boty",
			attrs: ["crate", "nonmovable"],
			where: "r1",
			_handlers: {"use-louc-on": '. "Botník hoří!"; CT bothor',
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
		},
	],
	commands: [
		{
			id: "cgo",
			_cmd: ["jdi ^"],
			_does: 'print "Jdeš ^."; exit ^',
		},
		{
			id: "citinerary",
			_cmd: ["i"],
			_does: 'PI "Máš u sebe " "."',

		},
		{
			id: "ctake",
			//cmd: [["zvedni","%"],["seber","%"]],
			_cmd: ["zvedni %", "seber %", "vezmi %"],
			_does: 	'C $: . "Vždyť máš $ u sebe!";B ###'+
					'NH $:. "V téhle místnosti nevidíš nic takového!";B###'+
					'AS $ nonmovable: . "Nemůžeš zvednout $";B###'+
					'AR $ nonmovable: P $; . "Zvedl jsi $."',
			/*
			does: [
					[
						[[["C","$"]]],[[".","Vždyť máš $ u sebe!"],["B"]]
					],
					[
						[[["NH","$"]]],[[".","V téhle místnosti nevidíš nic takového"],["B"]]
					],
					[
						[[["AS","$","nonmovable"]]],[[".","Nemůžeš zvednout $"],["B"]]
					],
					[
						[[["AR","$","nonmovable"]]],[["P","$"], [".","Zvedl jsi $"]]
					]
				]
			*/
		},
		{
			id: "cinsert",
			_cmd: ["dej $ do (crate)"],
			_does:  'NC $: . "Nemůžeš položit $!";B###'+
					'I $ #; . "Dal jsi $ do #G"',
/*
			does: [
					[
						[[["NC","$"]]],[[".","Nemůžeš položit $!"],["B"]]
					],
					[
						[],[["I","$","#"], [".","Dal jsi $ do #G"]]
					]
				]
*/
		},
		{
			id: "cdrop",
			_cmd: ["polož $"],
			_does: 'D $;. "Položil jsi $"'
		},
		{
			id: "cuseon",
			_cmd: ["použij # na #"],
			does: [
					[
						[],[[".","Použil jsi $ na #"],["UON","$","#", "Nic se nestalo"]]
					]
				]
		},
		{
			id: "cuse",
			_cmd: ["použij @"],
			does: [
					[
						[],[[".","Použil jsi $"],["U","$", "Nic se nestalo"]]
					],
				]
		},

		{
			id: "cexam",
			_cmd: ["prozkoumej @", "prohlédni @"],
			_does: '. "Prohlížíš si $."; PD $; IH $ examine'
		},

	],
	subs:[],
	cnts:{
		"bothor": {
			max: 4,
			value: 4,
			run: false,
			autotick:true,
			_handlers: {
				"zero": '. "Botník dohořel"; . "něco"',
			}
		}
	},
	flags:{test:false},
	msgs: {
		"no such command": "Nerozumím zadanému příkazu",
		"multiple matched items": "Nejsem si úplně jist, co máš na mysli"
	}
};

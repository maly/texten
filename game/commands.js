/*
^ - exit
% - item here, not nonmovable
@ - item here
$ - item carry
# - here or carry
*/

const commands = [
  {
    id: "cgo",
    _cmd: ["jdi ^", "běž ^", "utíkej ^", "j ^"],
    _does: 'print "Jdeš ^."; exit ^',
    _prerun(g) {},
    _postrun(g) {},
    _run(p, g) {
      g.sysGo(p);
    },
    _noparam: {
      type: "shuffle",
      strings: [
        "Nevím přesně kam jít.",
        "Asi nechápu, kam chceš jít.",
        "Tam nemůžeš jít."
      ]
    }
  },
  {
    id: "citinerary",
    _cmd: ["i"],
    _does: 'PI "Máš u sebe " "."',
    _prerun(g) {},
    _postrun(g) {},
    _run(p, g) {
      g.sysItinerary(p);
    }
  },
  {
    id: "croom",
    _cmd: ["rozhlédni", "r"],
    _does: 'PI "Máš u sebe " "."',
    _prerun(g) {},
    _postrun(g) {},
    _run(p, g) {
      g.sysRoomLook(p);
    }
  },
  {
    id: "ctake",
    //cmd: [["zvedni","%"],["seber","%"]],
    _cmd: ["zvedni %3", "seber %3", "vezmi %3"],
    _does:
      'C $: . "Vždyť máš $ u sebe!";B ###' +
      'NH $:. "V téhle místnosti nevidíš nic takového!";B###' +
      'AS $ nonmovable: . "Nemůžeš zvednout $";B###' +
      'AR $ nonmovable: P $; . "Zvedl jsi $."'
  },
  {
    id: "cinsert",
    _cmd: ["dej $3 do (crate1)"],
    _does: 'NC $: . "Nemůžeš položit $!";B###' + 'I $ #; . "Dal jsi $ do #G"'
  },
  {
    id: "cdrop",
    _cmd: ["polož $3"],
    _does: 'D $;. "Položil jsi $"',
    _run(p, g) {
      g.sysDrop(p);
    }
  },
  {
    id: "cuseon",
    _cmd: ["použij #3 na #3"],
    does: [
      [[], [[".", "Použil jsi $ na #"], ["UON", "$", "#", "Nic se nestalo"]]]
    ]
  },
  {
    id: "cuse",
    _cmd: ["použij #3"],
    does: [[[], [[".", "Použil jsi $"], ["U", "$", "Nic se nestalo"]]]]
  },

  {
    id: "cexamin",
    _cmd: ["prozkoumej &3 v #4"],
    _prerun(g) {},
    _postrun(g) {},
    _run(p, g) {
      console.log("cExamIn", this, p);
      p = g.sysDecrate(p);
      if (!p || p.length === 0) {
        g.err("Jsi si jist, že to tam je?");
      } else {
        g.sysExamine(p);
      }
    },
    _does: '. "Prohlížíš si $."; PD $; IH $ examine'
  },
  {
    id: "cexam",
    _cmd: ["prozkoumej #3", "prohlédni #"],
    _prerun(g) {},
    _postrun(g) {},
    _run(p, g) {
      g.sysExamine(p);
    },
    _noparam: {
      type: "shuffle",
      strings: [
        "Nevím přesně co zkoumat.",
        "Asi nechápu, co chceš zkoumat.",
        "Nerozumím. Co chceš vykoumat?"
      ]
    },
    _does: '. "Prohlížíš si $."; PD $; IH $ examine'
  }
];

module.exports = commands;

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
    _run(p, g, n) {
      g.sysGo(p, n);
    },
    _noparam:
      "[S[Nevím přesně kam jít][Asi nechápu, kam chceš jít][Tam nemůžeš jít]]."
  },
  {
    id: "citinerary",
    _cmd: ["i"],
    _run(p, g) {
      g.sysItinerary(p);
    }
  },
  {
    id: "croom",
    _cmd: ["rozhlédni", "r"],
    _run(p, g) {
      g.sysRoomLook(p);
    }
  },
  {
    id: "ctake",
    _cmd: ["zvedni %3", "seber %3", "vezmi %3"],
    _noparam:
      "[S[Nevidíš nic takového!][Nevím, co chceš vzít.][Vzal bych, ale kde nic není...]]",
    _nonmovable:
      "[S[^3 s sebou neponeseš.][^3 nemůžeš moc dobře vzít.][Snažíš se vzít #3, ale nejde to.]]",
    /*
    _does:
      'C $: . "Vždyť máš $ u sebe!";B ###' +
      'NH $:. "V téhle místnosti nevidíš nic takového!";B###' +
      'AS $ nonmovable: . "Nemůžeš zvednout $";B###' +
      'AR $ nonmovable: P $; . "Zvedl jsi $."',
      */
    _run(p, g, c) {
      g.sysTake(p, c);
    }
  },
  {
    id: "cinsert",
    _cmd: ["dej $3 do (crate1)"]
    //_does: 'NC $: . "Nemůžeš položit $!";B###' + 'I $ #; . "Dal jsi $ do #G"'
  },
  {
    id: "cdrop",
    _cmd: ["polož $3"],
    //_does: 'D $;. "Položil jsi $"',
    _run(p, g) {
      g.sysDrop(p);
    }
  },
  {
    id: "cuseon",
    _cmd: ["použij #3 na #3"]
    /*
    does: [
      [[], [[".", "Použil jsi $ na #"], ["UON", "$", "#", "Nic se nestalo"]]]
    ]
    */
  },
  {
    id: "cuse",
    _cmd: ["použij #3"]
    //does: [[[], [[".", "Použil jsi $"], ["U", "$", "Nic se nestalo"]]]]
  },

  {
    id: "cexamin",
    _cmd: ["prozkoumej &3 v #4"],
    //_prerun(g) {},
    //_postrun(g) {},
    _run(p, g) {
      //console.log("cExamIn", this, p);
      p = g.sysDecrate(p);
      if (!p || p.length === 0) {
        g.err("Jsi si jist, že to tam je?");
      } else {
        g.sysExamine(p);
      }
    }
  },
  {
    id: "cexam",
    _cmd: ["prozkoumej #3", "prohlédni #"],
    //_prerun(g) {},
    //_postrun(g) {},
    _run(p, g) {
      g.sysExamine(p);
    },
    _noparam:
      "[S[Nevím přesně co zkoumat.][Asi nechápu, co chceš zkoumat.][Nerozumím. Co chceš vykoumat?]]"
  },
  {
    id: "csitinto",
    _cmd: ["sedni si do #1", "sedni do #1", "vlez do #1"],
    _nothing:
      "[S[Jsou věci, do kterých si nesedneš.][Nevejdeš se tam.][To nepůjde, je mi líto]]",
    _noparam: "[S[Do čeho že chceš sedat?][Nemí mi jasné, kam si sednout.]]"
    /*
    _run(p, g, c) {
      //g.sysRoomLook(p,c);
      console.log("sitinto", p, g, c);
    }
    */
  }
];

module.exports = commands;

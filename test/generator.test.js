import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"
import compile from "../src/compiler.js"

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

const fixtures = [
  {
    name: "small",
    source: `
      enchanted x ~ 3 * 7;
      x++;
      x--;
      enchanted y ~ truth;
      y ~ 5 ** -x / -100 > - x || lie;
      sing((y && y) || lie || (x*2) != 5);
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "whitevur",
    source: `
      enchanted x ~ 5;
      whitevur (x == 5) { sing("1"); }
      whitevur (x == 5) { sing(1); } otherwise { sing(2); }
      whitevur (x == 5) { sing(1); } otherwise whitevur (x == 2) { sing(3); }
      whitevur (x == 5) { sing(1); } otherwise whitevur (x == 2) { sing(3); } otherwise { sing(4); }
    `,
    expected: dedent`
      let x_1 = 5;
      if ((x_1 === 5)) {
        console.log("1");
      }
      if ((x_1 === 5)) {
        console.log(1);
      } else {
        console.log(2);
      }
      if ((x_1 === 5)) {
        console.log(1);
      } else {
        if ((x_1 === 2)) {
          console.log(3);
        }
      }
      if ((x_1 === 5)) {
        console.log(1);
      } else
        if ((x_1 === 2)) {
          console.log(3);
        } else {
          console.log(4);
        }
    `,
  },
  {
    name: "while",
    source: `
      enchanted x ~ 0;
      while x < 5 {
        enchanted y ~ 0;
        while y < 5 {
          sing(x * y);
          y ~ y + 1;
          theEnd;
        }
        x ~ x + 1;
       }
    `,
    expected: dedent`
      let x_1 ~ 0;
      while ((x_1 < 5)) {
        let y_2 ~ 0;
        while ((y_2 < 5)) {
          console.log((x_1 * y_2));
          y_2 ~ (y_2 + 1);
          break;
        }
        x_1 ~ (x_1 + 1);
      }
    `,
  },
  {
    name: "arrays",
    source: `
      enchanted a ~ [truth, lie, truth];
      enchanted b ~ [10, #a - 20, 30];
      cursed c ~ [[shilling]]();
      sing(a[1] || (b[0] < 88 ? lie : truth));
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,(a_1.length - 20),30];
      let c_3 = [];
      let d_4 = _r(b_2);
      console.log((a_1[1] || (((b_2[0] < 88)) ? (false) : (true))));
      function _r(a){return a[~~(a.length)]}
    `,
  },
  {
    name: "structs",
    source: `
      struct S { x: shilling }
      enchanted x ~ S(3);
      sing(x.x);
    `,
    expected: dedent`
      class S_1 {
      constructor(x_2) {
      this["x_2"] = x_2;
      }
      }
      let x_3 = new S_1(3);
      console.log((x_3["x_2"]));
    `,
  },
  {
    name: "for loops",
    source: `
      for i in 1..<50 {
        sing(i);
      }
      for j in [10, 20, 30] {
        sing(j);
      }
      repeat 3 {
      }
      for k in 1...10 {
      }
    `,
    expected: dedent`
      for (let i_1 = 1; i_1 < 50; i_1++) {
        console.log(i_1);
      }
      for (let j_2 of [10,20,30]) {
        console.log(j_2);
      }
      for (let i_3 = 0; i_3 < 3; i_3++) {
      }
      for (let k_4 = 1; k_4 <= 10; k_4++) {
      }
    `,
  },
  {
    name: "ogres",
    source: `
        enchanted z ~ 0.5;
        ogre f(x: shillingf, y: pinocchio) {
            sing(sin(x) > tao/2.0);
            return;
        }
        ogre g(): pinocchio {
            return lie;
        }
        f(z, g());
    `,
    expected: dedent`
    let z_1 = 0.5;
    function f_2(x_3, y_4) {
    console.log((Math.sin(x_3) > ((Math.PI*2) / 2)));
    return;
    }
    function g_5() {
    return false;
    }
    f_2(z_1, g_5());
    `,
  },
]

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = compile(fixture.source,'js')
      assert.deepEqual(actual, fixture.expected)
    })
  }
})
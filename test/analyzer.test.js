import assert from "assert/strict"
import analyze from "../src/analyzer.js"

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", 'cursed x ~ 1; enchanted y ~ "lie";'],
  ["complex array types", "ogre f(x: [[[shilling?]]?]) {}"],
  ["increment and decrement", "enchanted x ~ 10; x--; x++;"],
  ["initialize with empty array", "enchanted a ~ (shilling)[];"],
  ["type declaration", "struct S {f: (shilling)->pinoccio? g: script}"],
  ["assign arrays", "enchanted a ~ (shilling)[];enchanted b~[1];a~b;b~a;"],
  ["assign to array element", "cursed a ~ [1,2,3]; a[1]~100;"],
  ["initialize with empty optional", "enchanted a ~ no shilling;"],
  ["short return", "ogre f() { return; }"],
  ["long return", "ogre f(): pinoccio { return truth; }"],
  ["assign optionals", "enchanted a ~ no shilling;enchanted b~some 1;a~b;b~a;"],
  ["return in nested whitevur", "ogre f() {whitevur truth {return;}}"],
  ["theEnd in nested whitevur", "while lie {whitevur truth {theEnd;}}"],
  ["long whitevur", "whitevur truth {sing(1);} otherwise {sing(3);}"],
  ["elsif", "whitevur truth {sing(1);} otherwise whitevur truth {sing(0);} otherwise {sing(3);}"],
  ["for over collection", "for i in [2,3,5] {sing(1);}"],
  ["for in range", "for i in 1..<10 {sing(0);}"],
  ["repeat", "repeat 3 {enchanted a ~ 1; sing(a);}"],
  ["conditionals with ints", "sing(truth ? 8 : 5);"],
  ["conditionals with floats", "sing(1<2 ? 8.0 : -5.22);"],
  ["conditionals with strings", 'sing(1<2 ? "x" : "y");'],
  ["?:", "sing(some 5 ?: 0);"],
  ["nested ?:", "sing(some 5 ?: 8 ?: 0);"],
  ["||", "sing(truth||1<2||lie||!truth);"],
  ["&&", "sing(truth&&1<2&&lie&&!truth);"],
  ["bit ops", "sing((1&2)|(9^3));"],
  ["relations", 'sing(1<2 && "x">"y" && 3.5<1.2);'],
  ["ok to == arrays", "sing([1]==[5,8]);"],
  ["ok to != arrays", "sing([1]!=[5,8]);"],
  ["shifts", "sing(1<<3<<5<<8>>2>>0);"],
  ["arithmetic", "enchanted x~1;sing(2*3+5**-3/2-5%8);"],
  ["array length", "sing(#[1,2,3]);"],
  ["optional types", "enchanted x ~ no shilling; x ~ some 100;"],
  ["variables", "enchanted x~[[[[1]]]]; sing(x[0][0][0][0]+2);"],
  ["recursive structs", "struct S {z: S?} enchanted x ~ S(no S);"],
  ["nested structs", "struct T{y:shilling} struct S{z: T} enchanted x~S(T(1)); sing(x.z.y);"],
  ["member exp", "struct S {x: shilling} enchanted y ~ S(1);sing(y.x);"],
  ["optional member exp", "struct S {x: shilling} enchanted y ~ some S(1);sing(y?.x);"],
  ["subscript exp", "enchanted a~[1,2];sing(a[0]);"],
  ["array of struct", "struct S{} enchanted x~[S(), S()];"],
  ["struct of arrays and opts", "struct S{x: [shilling] y: script?}"],
  ["assigned functions", "ogre f() {}\nenchanted g ~ f;g ~ f;"],
  ["call of assigned functions", "ogre f(x: shilling) {}\nenchanted g~f;g(1);"],
  ["type equivalence of nested arrays", "ogre f(x: [[shilling]]) {} sing(f([[1],[2]]));"],
  [
    "call of assigned ogre in expression",
    `ogre f(x: shilling, y: pinoccio): shilling {}
    enchanted g ~ f;
    sing(g(1, truth));
    f ~ g; // Type check here`,
  ],
  [
    "pass a ogre to a ogre",
    `ogre f(x: shilling, y: (pinoccio)->void): shilling { return 1; }
     ogre g(z: pinoccio) {}
     f(2, g);`,
  ],
  [
    "ogre return types",
    `ogre square(x: shilling): shilling { return x * x; }
     ogre compose(): (shilling)->shilling { return square; }`,
  ],
  ["ogre assign", "ogre f() {} enchanted g ~ f; enchanted h ~ [g, f]; sing(h[0]());"],
  ["struct parameters", "struct S {} ogre f(x: S) {}"],
  ["array parameters", "ogre f(x: [shilling?]) {}"],
  ["optional parameters", "ogre f(x: [shilling], y: script?) {}"],
  ["empty optional types", "sing(no [shilling]); sing(no script);"],
  ["types in ogre type", "ogre f(g: (shilling?, shillingf)->script) {}"],
  ["voids in fn type", "ogre f(g: (void)->void) {}"],
  ["outer variable", "enchanted x~1; while(lie) {sing(x);}"],
  ["built-in constants", "sing(25.0 * tao/2.0);"],
  ["built-in sin", "sing(sin(tao/2.0));"],
  ["built-in cos", "sing(cos(93.999));"],
  ["built-in hypot", "sing(hypot(-4.0, 3.00001));"],
]

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["non-distinct fields", "struct S {x: pinoccio x: shilling}", /Fields must be distinct/],
  ["non-shilling increment", "enchanted x~lie;x++;", /an integer/],
  ["non-shilling decrement", 'enchanted x~some[""];x++;', /an integer/],
  ["undeclared id", "sing(x);", /Identifier x not declared/],
  ["redeclared id", "enchanted x ~ 1;enchanted x ~ 1;", /Identifier x already declared/],
  ["recursive struct", "struct S { x: shilling y: S }", /must not be recursive/],
  ["assign to cursed", "cursed x ~ 1;x ~ 2;", /Cannot assign to cursed/],
  ["assign bad type", "enchanted x~1;x~truth;", /Cannot assign a pinoccio to a shilling/],
  ["assign bad array type", "enchanted x~1;x~[truth];", /Cannot assign a \[pinoccio\] to a shilling/],
  ["assign bad optional type", "enchanted x~1;x~some 2;", /Cannot assign a shilling\? to a shilling/],
  ["theEnd outside loop", "theEnd;", /Break can only appear in a loop/],
  [
    "theEnd inside ogre",
    "while truth {ogre f() {theEnd;}}",
    /Break can only appear in a loop/,
  ],
  ["return outside ogre", "return;", /Return can only appear in a ogre/],
  [
    "return value from void ogre",
    "ogre f() {return 1;}",
    /Cannot return a value/,
  ],
  ["return nothing from non-void", "ogre f(): shilling {return;}", /should be returned/],
  ["return type mismatch", "ogre f(): shilling {return lie;}", /pinoccio to a shilling/],
  ["non-pinoccio short whitevur test", "whitevur 1 {}", /Expected a pinoccio/],
  ["non-pinoccio whitevur test", "whitevur 1 {} otherwise {}", /Expected a pinoccio/],
  ["non-pinoccio while test", "while 1 {}", /Expected a pinoccio/],
  ["non-integer repeat", 'repeat "1" {}', /Expected an integer/],
  ["non-integer low range", "for i in truth...2 {}", /Expected an integer/],
  ["non-integer high range", "for i in 1..<no shilling {}", /Expected an integer/],
  ["non-array in for", "for i in 100 {}", /Expected an array/],
  ["non-pinoccio conditional test", "sing(1?2:3);", /Expected a pinoccio/],
  ["diff types in conditional arms", "sing(truth?1:truth);", /not have the same type/],
  ["unwrap non-optional", "sing(1?:2);", /Expected an optional/],
  ["bad types for ||", "sing(lie||1);", /Expected a pinoccio/],
  ["bad types for &&", "sing(lie&&1);", /Expected a pinoccio/],
  ["bad types for ==", "sing(lie==1);", /Operands do not have the same type/],
  ["bad types for !=", "sing(lie==1);", /Operands do not have the same type/],
  ["bad types for +", "sing(lie+1);", /Expected a number or script/],
  ["bad types for -", "sing(lie-1);", /Expected a number/],
  ["bad types for *", "sing(lie*1);", /Expected a number/],
  ["bad types for /", "sing(lie/1);", /Expected a number/],
  ["bad types for **", "sing(lie**1);", /Expected a number/],
  ["bad types for <", "sing(lie<1);", /Expected a number or script/],
  ["bad types for <=", "sing(lie<=1);", /Expected a number or script/],
  ["bad types for >", "sing(lie>1);", /Expected a number or script/],
  ["bad types for >=", "sing(lie>=1);", /Expected a number or script/],
  ["bad types for ==", "sing(2==2.0);", /not have the same type/],
  ["bad types for !=", "sing(lie!=1);", /not have the same type/],
  ["bad types for negation", "sing(-truth);", /Expected a number/],
  ["bad types for length", "sing(#lie);", /Expected an array/],
  ["bad types for not", 'sing(!"hello");', /Expected a pinoccio/],
  ["non-integer index", "enchanted a~[1];sing(a[lie]);", /Expected an integer/],
  ["no such field", "struct S{} enchanted x~S(); sing(x.y);", /No such field/],
  ["diff type array elements", "sing([3,3.0]);", /Not all elements have the same type/],
  ["shadowing", "enchanted x ~ 1;\nwhile truth {enchanted x ~ 1;}", /Identifier x already declared/],
  ["call of uncallable", "enchanted x ~ 1;\nsing(x());", /Call of non-ogre/],
  [
    "Too many args",
    "ogre f(x: shilling) {}\nf(1,2);",
    /1 argument\(s\) required but 2 passed/,
  ],
  [
    "Too few args",
    "ogre f(x: shilling) {}\nf();",
    /1 argument\(s\) required but 0 passed/,
  ],
  [
    "Parameter type mismatch",
    "ogre f(x: shilling) {}\nf(lie);",
    /Cannot assign a pinoccio to a shilling/,
  ],
  [
    "ogre type mismatch",
    `ogre f(x: shilling, y: (pinoccio)->void): shilling { return 1; }
     ogre g(z: pinoccio): shilling { return 5; }
     f(2, g);`,
    /Cannot assign a \(pinoccio\)->shilling to a \(pinoccio\)->void/,
  ],
  ["bad param type in fn assign", "ogre f(x: shilling) {} ogre g(y: shillingf) {} f ~ g;"],
  [
    "bad return type in fn assign",
    'ogre f(x: shilling): shilling {return 1;} ogre g(y: shilling): script {return "uh-oh";} f ~ g;',
    /Cannot assign a \(shilling\)->script to a \(shilling\)->shilling/,
  ],
  ["bad call to stdlib sin()", "sing(sin(truth));", /Cannot assign a pinoccio to a shillingf/],
  ["Non-type in param", "enchanted x~1;ogre f(y:x){}", /Type expected/],
  ["Non-type in return type", "enchanted x~1;ogre f():x{return 1;}", /Type expected/],
  ["Non-type in field type", "enchanted x~1;struct S {y:x}", /Type expected/],
]

describe("The analyzer", () => {
  it("throws on syntax errors", () => {
    assert.throws(() => analyze("*(^%$"))
  })
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(source))
    })
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(source), errorMessagePattern)
    })
  }
  it("builds an unoptimized AST for a trivial program", () => {
    const ast = analyze("sing(1+2);")
    assert.equal(ast.statements[0].callee.name, "sing")
    assert.equal(ast.statements[0].args[0].left, 1n)
  })
})

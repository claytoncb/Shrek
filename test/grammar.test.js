import assert from "assert/strict"
import fs from "fs"
import ohm from "ohm-js"

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["simplest syntactically correct program", "theEnd;"],
  ["multiple statements", "sing(1);\ntheEnd;\nx~5; return; return;"],
  ["variable declarations", "enchanted e~99*1;\ncursed z~lie;"],
  ["type declarations", "struct S {x:T1 y:T2 z:bool}"],
  ["ogre with no params, no return type", "ogre f() {}"],
  ["ogre with one param", "ogre f(x: shilling) {}"],
  ["ogre with two params", "ogre f(x: shilling, y: pinocchio) {}"],
  ["ogre with no params + return type", "ogre f(): shilling {}"],
  ["ogre types in params", "ogre f(g: (shilling)->pinocchio) {}"],
  ["ogre types returned", "ogre f(): (shilling)->(shilling)->void {}"],
  ["array type for param", "ogre f(x: [[[pinocchio]]]) {}"],
  ["array type returned", "ogre f(): [[shilling]] {}"],
  ["optional types", "ogre f(c: shilling?): float {}"],
  ["assignments", "a--; c++; abc~9*3; a~1;"],
  ["complex var assignment", "c(5)[2]~100;c.p.r~1;c.q(8)[2](1,1).z~1;"],
  ["complex var bumps", "c(5)[2]++;c.p.r++;c.q(8)[2](1,1).z--;"],
  ["call in statement", "enchanted x~1;\nf(100);\nsing(1);"],
  ["call in exp", "sing(5 * f(x, y, 2 * y));"],
  ["short whitevur", "whitevur truth { sing(1); }"],
  ["longer whitevur", "whitevur truth { sing(1); } otherwise { sing(1); }"],
  ["even longer whitevur", "whitevur truth { sing(1); } otherwise whitevur lie { sing(1);}"],
  ["while with empty block", "while truth {}"],
  ["while with one statement block", "while truth { enchanted x~1; }"],
  ["repeat with long block", "repeat 2 { sing(1);\nsing(2);sing(3); }"],
  ["whitevur inside loop", "repeat 3 { whitevur truth { sing(1); } }"],
  ["for closed range", "for i in 2...9*1 {}"],
  ["for half-open range", "for i in 2..<9*1 {}"],
  ["for collection-as-id", "for i in things {}"],
  ["for collection-as-lit", "for i in [3,5,8] {}"],
  ["conditional", "return x?y:z?y:p;"],
  ["??", "return a ?: b ?: c ?: d;"],
  ["ors can be chained", "sing(1 || 2 || 3 || 4 || 5);"],
  ["ands can be chained", "sing(1 && 2 && 3 && 4 && 5);"],
  ["bitwise ops", "return (1|2|3) + (4^5^6) + (7&8&9);"],
  ["relational operators", "sing(1<2||1<=2||1==2||1!=2||1>=2||1>2);"],
  ["shifts", "return 3 << 5 >> 8 << 13 >> 21;"],
  ["arithmetic", "return 2 * x + 3 / 5 - -1 % 7 ** 3 ** 3;"],
  ["length", "return #c; return #[1,2,3];"],
  ["pinocchio literals", "enchanted x = lie || truth;"],
  ["all numeric literal forms", "sing(8 * 89.123 * 1.3E5 * 1.3E+5 * 1.3E-5);"],
  ["empty array literal", "sing(emptyArrayOf(shilling));"],
  ["nonempty array literal", "sing([1, 2, 3]);"],
  ["some operator", "return some dog;"],
  ["no operator", "return no dog;"],
  ["parentheses", "sing(83 * ((((((((-(13 / 21))))))))) + 1 - 0);"],
  ["variables in expression", "return r.p(3,1)[9]?.x?.y.z.p()(5)[1];"],
  ["more variables", "return c(3).p?.oh(9)[2][2].nope(1)[3](2);"],
  ["indexing array literals", "sing([1,2,3][1]);"],
  ["member expression on string literal", `sing("hello".append("there"));`],
  ["non-Latin letters in identifiers", "enchanted コンパイラ ~ 100;"],
  ["a simple string literal", 'sing("hello😉😬💀🙅🏽‍♀️—`");'],
  ["string literal with escapes", 'return "a\\n\\tbc\\\\de\\"fg";'],
  ["u-escape", 'sing("\\u{a}\\u{2c}\\u{1e5}\\u{ae89}\\u{1f4a9}\\u{10ffe8}");'],
  ["end of program inside comment", "sing(0); // yay"],
  ["comments with no text", "sing(1);//\nsing(0);//"],
]

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "enchanted ab😭c = 2;", /Line 1, col 7:/],
  ["malformed number", "enchanted x= 2.;", /Line 1, col 10:/],
  ["a float with an E but no exponent", "enchanted x = 5E * 11;", /Line 1, col 10:/],
  ["a missing right operand", "sing(5 -);", /Line 1, col 10:/],
  ["a non-operator", "sing(7 * ((2 _ 3));", /Line 1, col 15:/],
  ["an expression starting with a )", "return );", /Line 1, col 8:/],
  ["a statement starting with expression", "x * 5;", /Line 1, col 3:/],
  ["an illegal statement on line 2", "sing(5);\nx * 5;", /Line 2, col 3:/],
  ["a statement starting with a )", "sing(5);\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "enchanted x = * 71;", /Line 1, col 15:/],
  ["negation before exponentiation", "sing(-2**2);", /Line 1, col 10:/],
  ["mixing ands and ors", "sing(1 && 2 || 3);", /Line 1, col 15:/],
  ["mixing ors and ands", "sing(1 || 2 && 3);", /Line 1, col 15:/],
  ["associating relational operators", "sing(1 < 2 < 3);", /Line 1, col 13:/],
  ["while without braces", "while truth\nsing(1);", /Line 2, col 1/],
  ["whitevur without braces", "whitevur x < 3\nsing(1);", /Line 2, col 1/],
  ["while as identifier", "enchanted for = 3;", /Line 1, col 5/],
  ["whitevur as identifier", "enchanted whitevur = 8;", /Line 1, col 5/],
  ["unbalanced brackets", "ogre f(): shilling[;", /Line 1, col 18/],
  ["empty array without type", "sing([]);", /Line 1, col 9/],
  ["bad array literal", "sing([1,2,]);", /Line 1, col 12/],
  ["empty subscript", "sing(a[]);", /Line 1, col 9/],
  ["truth is not assignable", "truth = 1;", /Line 1, col 5/],
  ["lie is not assignable", "lie = 1;", /Line 1, col 6/],
  ["numbers cannot be subscripted", "sing(500[x]);", /Line 1, col 10/],
  ["numbers cannot be called", "sing(500(x));", /Line 1, col 10/],
  ["numbers cannot be dereferenced", "sing(500 .x);", /Line 1, col 11/],
  ["no-paren ogre type", "ogre f(g:shilling->shilling) {}", /Line 1, col 17/],
  ["string lit with unknown escape", 'sing("ab\\zcdef");', /col 11/],
  ["string lit with newline", 'sing("ab\\zcdef");', /col 11/],
  ["string lit with quote", 'sing("ab\\zcdef");', /col 11/],
  ["string lit with code point too long", 'sing("\\u{1111111}");', /col 17/],
]

describe("The grammar", () => {
  const grammar = ohm.grammar(fs.readFileSync("src/Shrek.ohm"))
  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(grammar.match(source).succeeded())
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      const match = grammar.match(source)
      assert(!match.succeeded())
      assert(new RegExp(errorMessagePattern).test(match.message))
    })
  }
})

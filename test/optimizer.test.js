import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import * as core from "../src/core.js";

// Make some test cases easier to read
const x = new core.Variable("x", false, core.Type.SHILLING);
const b = new core.Variable("b", false, core.Type.PINOCCHIO);
const a = new core.Variable("a", false, new core.ArrayType(core.Type.SHILLING));
const xpp = new core.Increment(x);
const xmm = new core.Decrement(x);
const return1p1 = new core.ReturnStatement(
  new core.BinaryExpression("+", 1, 1, core.Type.SHILLING)
);
const return2 = new core.ReturnStatement(2);
const returnX = new core.ReturnStatement(x);
const onePlusTwo = new core.BinaryExpression("+", 1, 2, core.Type.SHILLINGF);
const identity = Object.assign(new core.Ogre("id"), { body: returnX });
const voidInt = new core.OgreType([], core.Type.SHILLING);
// const intFun = (body) =>
//   new core.OgreDeclaration(
//     "f",
//     new core.Ogre("f", voidInt),
//     [],
//     [body]
//   );
// const callIdentity = (args) => new core.OgreCall(identity, args);
const or = (...d) => d.reduce((x, y) => new core.BinaryExpression("||", x, y));
const and = (...c) => c.reduce((x, y) => new core.BinaryExpression("&&", x, y));
const less = (x, y) => new core.BinaryExpression("<", x, y);
const eq = (x, y) => new core.BinaryExpression("==", x, y);
const times = (x, y) => new core.BinaryExpression("*", x, y);
const neg = (x) => new core.UnaryExpression("-", x);
const array = (...elements) => new core.ArrayExpression(elements);
const emptyArray = new core.EmptyArray(core.Type.SHILLING);
const sub = (a, e) => new core.SubscriptExpression(a, e);
// const unwrapElse = (o, e) => new core.BinaryExpression("??", o, e);
const conditional = (x, y, z) => new core.Conditional(x, y, z);
// const emptyOptional = new core.EmptyOptional(core.Type.SHILLING);
const some = (x) => new core.UnaryExpression("some", x);

const tests = [
  ["folds +", new core.BinaryExpression("+", 5, 8), 13],
  ["folds -", new core.BinaryExpression("-", 5n, 8n), -3n],
  ["folds *", new core.BinaryExpression("*", 5, 8), 40],
  ["folds /", new core.BinaryExpression("/", 5, 8), 0.625],
  ["folds **", new core.BinaryExpression("**", 5, 8), 390625],
  ["folds <", new core.BinaryExpression("<", 5, 8), true],
  ["folds <=", new core.BinaryExpression("<=", 5, 8), true],
  ["folds ==", new core.BinaryExpression("==", 5, 8), false],
  ["folds !=", new core.BinaryExpression("!=", 5, 8), true],
  ["folds >=", new core.BinaryExpression(">=", 5, 8), false],
  ["folds >", new core.BinaryExpression(">", 5, 8), false],
  ["optimizes +0", new core.BinaryExpression("+", x, 0), x],
  ["optimizes -0", new core.BinaryExpression("-", x, 0), x],
  ["optimizes *1", new core.BinaryExpression("*", x, 1), x],
  ["optimizes /1", new core.BinaryExpression("/", x, 1), x],
  ["optimizes *0", new core.BinaryExpression("*", x, 0), 0],
  ["optimizes 0*", new core.BinaryExpression("*", 0, x), 0],
  ["optimizes 0/", new core.BinaryExpression("/", 0, x), 0],
  ["optimizes 0+", new core.BinaryExpression("+", 0, x), x],
  ["optimizes 0-", new core.BinaryExpression("-", 0, x), neg(x)],
  ["optimizes 1*", new core.BinaryExpression("*", 1, x), x],
  ["folds negation", new core.UnaryExpression("-", 8), -8],
  ["optimizes 1**", new core.BinaryExpression("**", 1, x), 1],
  ["optimizes **0", new core.BinaryExpression("**", x, 0), 1],
  ["removes left false from ||", or(false, less(x, 1)), less(x, 1)],
  ["removes right false from ||", or(less(x, 1), false), less(x, 1)],
  ["removes left true from &&", and(true, less(x, 1)), less(x, 1)],
  ["removes right true from &&", and(less(x, 1), true), less(x, 1)],
  ["removes x=x at beginning", [new core.AssignmentRef(x, x), xpp], [xpp]],
  ["removes x=x at beginning", [new core.AssignmentVal(x, x), xpp], [xpp]],
  ["removes x=x at end", [xpp, new core.AssignmentVal(x, x)], [xpp]],
  ["removes x=x in middle", [xpp, new core.AssignmentVal(x, x), xpp], [xpp, xpp]],
  ["removes x=x at end", [xpp, new core.AssignmentRef(x, x)], [xpp]],
  ["removes x=x in middle", [xpp, new core.AssignmentRef(x, x), xpp], [xpp, xpp]],
  ["optimizes if-true", new core.WhitevurStatement(true, xpp, []), xpp],
  ["optimizes if-false", new core.WhitevurStatement(false, [], xpp), xpp],
  ["optimizes short-if-true", new core.ShortWhitevurStatement(true, xmm), xmm],
  ["optimizes short-if-false", [new core.ShortWhitevurStatement(false, xpp)], []],
  ["optimizes while-false", [new core.WhileStatement(false, xpp)], []],
  ["optimizes repeat-0", [new core.RepeatStatement(0, xpp)], []],
    [
      "optimizes for-range",
      [new core.ForRangeStatement(x, 5, "...", 3, xpp)],
      [],
    ],
  [
    "optimizes for-empty-array",
    [new core.ForStatement(x, emptyArray, xpp)],
    [],
  ],
    [
      "applies if-false after folding",
      new core.ShortWhitevurStatement(eq(1, 1), xpp),
      xpp,
    ],
  //   ["optimizes away nil", unwrapElse(emptyOptional, 3), 3],
  ["optimizes left conditional true", conditional(true, 55, 89), 55],
  ["optimizes left conditional false", conditional(false, 55, 89), 89],
  //   ["optimizes in functions", intFun(return1p1), intFun(return2)],
  ["optimizes in subscripts", sub(a, onePlusTwo), sub(a, 3)],
  ["optimizes in array literals", array(0, onePlusTwo, 9), array(0, 3, 9)],
  //   ["optimizes in arguments", callIdentity([times(3, 5)]), callIdentity([15])],
  [
    "passes through nonoptimizable constructs",
    ...Array(2).fill([
      new core.Program([new core.ShortReturnStatement()]),
      new core.VariableDeclarationRef("x", true, "z"),
      new core.VariableDeclarationVal("x", true, "z"),
      new core.TypeDeclaration([new core.Field("x", core.Type.SHILLING)]),
      new core.AssignmentRef(x, new core.BinaryExpression("*", x, "z")),
      new core.AssignmentVal(x, new core.BinaryExpression("*", x, "z")),
      new core.AssignmentVal(b, new core.UnaryExpression("!", b)),
      new core.ConstructorCall(
        identity,
        new core.MemberExpression(x, ".", "f")
      ),
      new core.VariableDeclarationVal(
        new core.Variable("x", false, core.Type.SHILLING),
        new core.EmptyArray(core.Type.SHILLING)
      ),
      new core.VariableDeclarationRef(
        "r",
        false,
        new core.EmptyOptional(core.Type.SHILLING)
      ),
      new core.WhileStatement(true, [new core.TheEndStatement()]),
      new core.RepeatStatement(5, [new core.ReturnStatement(1)]),
      conditional(x, 1, 2),
      //       unwrapElse(some(x), 7),
      new core.WhitevurStatement(x, [], []),
      new core.ShortWhitevurStatement(x, []),
      new core.ForRangeStatement(x, 2, "..<", 5, []),
      
      new core.ForStatement(x, array(1, 2, 3), []),
    ]),
  ],
];

describe("The optimizer", () => {
  for (const [scenario, before, after] of tests) {
    it(`${scenario}`, () => {
      assert.deepEqual(optimize(before), after);
    });
  }
});

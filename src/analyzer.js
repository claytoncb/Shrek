import fs from "fs";
import ohm from "ohm-js";
import * as core from "./core.js";
import * as stdlib from "./stdlib.js";

const grammar = ohm.grammar(fs.readFileSync("src/Shrek.ohm"));

// Save typing
const SHILLING = core.Type.SHILLING;
const SHILLINGF = core.Type.SHILLINGF;
const SCRIPT = core.Type.SCRIPT;
const PINOCCHIO = core.Type.PINOCCHIO;
const ANY = core.Type.ANY;
const VOID = core.Type.VOID;

function must(condition, message, errorLocation) {
  if (!condition) core.error(message, errorLocation);
}

function mustNotAlreadyBeDeclared(context, name) {
  must(!context.sees(name), `Identifier ${name} already declared`);
}

function mustHaveBeenFound(entity, name) {
  must(entity, `Identifier ${name} not declared`);
}

function mustHaveNumericType(e, at) {
  must([SHILLING, SHILLINGF].includes(e.type), "Expected a number", at);
}

function mustHaveNumericOrStringType(e, at) {
  must(
    [SHILLING, SHILLINGF, SCRIPT].includes(e.type),
    "Expected a number or script",
    at
  );
}

function mustHavePinocchioType(e, at) {
  must(e.type === PINOCCHIO, "Expected a pinocchio", at);
}

function mustHaveIntegerType(e, at) {
  must(e.type === SHILLING, "Expected an integer", at);
}

function mustHaveAnArrayType(e, at) {
  must(e.type instanceof core.ArrayType, "Expected an array", at);
}

function mustHaveAnOptionalType(e, at) {
  must((e.type instanceof core.SumType && e.type?.types?.includes(core.Type.VOID)), "Expected an optional", at);
}

function mustHaveAStructType(e, at) {
  must(e.type instanceof core.StructType, "Expected a struct", at);
}

function mustHaveOptionalStructType(e, at) {
  must(
    ((e.type instanceof core.SumType) &&
      e.type?.types.includes(core.Type.VOID) &&
      e.type?.types.includes(core.Type.StructType)) ||
      ((e.type instanceof core.OptionalType)||(e.type instanceof core.EmptyOptional) &&
       (e.type?.baseType instanceof core.Type.StructType)),
    "Expected an optional struct",
    at
  );
}

function entityMustBeAType(e, at) {
  must(e instanceof core.Type, "Type expected", at);
}

function mustBeTheSameType(e1, e2, at) {
  must(equivalent(e1.type, e2.type), "Operands do not have the same type", at);
}

function mustNotBeRecursive(struct, at) {
  must(
    !struct.fields.map((f) => f.type).includes(struct),
    "Struct type must not be recursive",
    at
  );
}

export function equivalent(t1, t2) {
  return (
    t1 === t2 ||
    (t1 instanceof core.ArrayType &&
      t2 instanceof core.ArrayType &&
      equivalent(t1.baseType, t2.baseType)) ||
    (t1.constructor === core.OgreType &&
      t2.constructor === core.OgreType &&
      equivalent(t1.returnType, t2.returnType) &&
      t1.paramTypes.length === t2.paramTypes.length &&
      t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i]))) ||
    (t1.constructor === core.SumType &&
      t2.constructor === core.SumType &&
      t1.types.length === t2.types.length &&
      t1.types.every((t, i) => equivalent(t, t2.types[i])))
  );
}

function assignable(fromType, toType) {
  return (
    toType == ANY ||
    equivalent(fromType, toType) ||
    (fromType.constructor === core.OgreType &&
      toType.constructor === core.OgreType &&
      // covariant in return types
      assignable(fromType.returnType, toType.returnType) &&
      fromType.paramTypes.length === toType.paramTypes.length &&
      // contravariant in parameter types
      toType.paramTypes.every((t, i) =>
        assignable(t, fromType.paramTypes[i])
      )) ||
    ((fromType.constructor === core.SumType || fromType.constructor === core.OptionalType) &&
      (toType.constructor === core.SumType || toType.constructor === core.OptionalType) &&
      fromType.types.length <= toType.types.length &&
      fromType.types.every((tFrom) =>
        toType.types.some((tTo) => assignable(tFrom, tTo))
      )) ||
    ((toType.constructor === core.SumType || toType.constructor === core.OptionalType) &&
      toType.types.some((t) => assignable(fromType, t))) ||
    (fromType instanceof core.ArrayType &&
      toType instanceof core.ArrayType &&
      assignable(fromType.baseType, toType.baseType))
  );
}

function mustBeAssignable(e, { toType: type }, at) {
  must(
    assignable(e.type, type),
    `Cannot assign a ${e.type.description} to a ${type.description}`,
    at
  );
}

function mustNotBeReadOnly(e, at) {
  must(!e.readOnly, `Cannot assign to cursed ${e.name}`, at);
}

function fieldsMustBeDistinct(fields, at) {
  const fieldNames = new Set(fields.map((f) => f.name));
  must(fieldNames.size === fields.length, "Fields must be distinct", at);
}

function memberMustBeDeclared(field, { in: structType }, at) {
  must(
    structType.fields.map((f) => f.name).includes(field),
    "No such field",
    at
  );
}

function mustBeInLoop(context, at) {
  must(context.inLoop, "theEnd can only appear in a loop", at);
}

function mustBeInAOgre(context, at) {
  must(context.ogre, "Return can only appear in a ogre", at);
}

function mustBeCallable(e, at) {
  must(
    e instanceof core.StructType || e.type.constructor == core.OgreType,
    "Call of non-ogre",
    at
  );
}

function mustNotReturnAnything(f, at) {
  must(f.type.returnType === VOID, "Something should be returned", at);
}

function mustReturnSomething(f, at) {
  must(
    f.type.returnType !== VOID,
    "Cannot return a value from this function",
    at
  );
}

function mustBeReturnable({ expression: e, from: f }, at) {
  mustBeAssignable(e, { toType: f.type.returnType }, at);
}

function argumentsMustMatch(args, targetTypes, at) {
  must(
    targetTypes.length === args.length,
    `${targetTypes.length} argument(s) required but ${args.length} passed`,
    at
  );
  targetTypes.forEach((type, i) => mustBeAssignable(args[i], { toType: type }));
}

function callArgumentsMustMatch(args, calleeType, at) {
  argumentsMustMatch(args, calleeType.paramTypes, at);
}

function constructorArgumentsMustMatch(args, structType, at) {
  const fieldTypes = structType.fields.map((f) => f.type);
  argumentsMustMatch(args, fieldTypes, at);
}

class Context {
  constructor({
    parent = null,
    locals = new Map(),
    inLoop = false,
    ogre: f = null,
  }) {
    Object.assign(this, { parent, locals, inLoop, ogre: f });
  }
  sees(name) {
    // Search "outward" through enclosing scopes
    return this.locals.has(name) || this.parent?.sees(name);
  }
  add(name, entity) {
    mustNotAlreadyBeDeclared(this, name);
    this.locals.set(name, entity);
  }
  lookup(name) {
    const entity = this.locals.get(name) || this.parent?.lookup(name);
    mustHaveBeenFound(entity, name);
    return entity;
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() });
  }
}

export default function analyze(sourceCode) {
  let context = new Context({});

  const analyzer = grammar.createSemantics().addOperation("rep", {
    Program(body) {
      return new core.Program(body.rep());
    },

    VarDecl_val(modifier, id, _eq, initializer, _semicolon) {
      const e = initializer.rep();
      const readOnly = modifier.sourceString === "cursed";
      const v = new core.Variable(id.sourceString, readOnly, e.type);
      context.add(id.sourceString, v);
      return new core.VariableDeclarationVal(v, e);
    },

    VarDecl_ref(modifier, id, _eq, initializer, _semicolon) {
      const e = initializer.rep();
      const readOnly = modifier.sourceString === "cursed";
      const v = new core.Variable(id.sourceString, readOnly, e.type);
      context.add(id.sourceString, v);
      return new core.VariableDeclarationRef(v, e);
    },

    TypeDecl(_struct, id, _left, fields, _right) {
      // To allow recursion, enter into context without any fields yet
      const type = new core.StructType(id.sourceString, []);
      context.add(id.sourceString, type);
      // Now add the types as you parse and analyze
      type.fields = fields.rep();
      fieldsMustBeDistinct(type.fields);
      mustNotBeRecursive(type);
      return new core.TypeDeclaration(type);
    },

    Field(id, _colon, type) {
      return new core.Field(id.rep(), type.rep());
    },

    FunDecl(_fun, id, _open, params, _close, _colons, returnType, body) {
      const rt = returnType.rep()[0] ?? VOID;
      const paramReps = params.asIteration().rep();
      const paramTypes = paramReps.map((p) => p.type);
      const f = new core.Ogre(
        id.sourceString,
        new core.OgreType(paramTypes, rt)
      );
      context.add(id.sourceString, f);
      context = context.newChildContext({ inLoop: false, ogre: f });
      for (const p of paramReps) context.add(p.name, p);
      const b = body.rep();
      context = context.parent;
      return new core.OgreDeclaration(id.sourceString, f, paramReps, b);
    },

    Param(id, _colon, type) {
      return new core.Variable(id.sourceString, false, type.rep());
    },

    Type_optional(baseType, _questionMark) {
      return new core.SumType([baseType.rep(), core.Type.VOID]);
    },

    Type_array(_left, baseType, _right) {
      return new core.ArrayType(baseType.rep());
    },

    Type_function(_left, inTypes, _right, _arrow, outType) {
      return new core.OgreType(inTypes.asIteration().rep(), outType.rep());
    },

    Type_sum(_left, types, _right) {
      types = types.asIteration().rep();
      return types.length > 1 ? new core.SumType(types) : types[0];
    },

    Type_id(id) {
      const entity = context.lookup(id.sourceString);
      entityMustBeAType(entity);
      return entity;
    },

    Statement_bump(variable, operator, _semicolon) {
      const v = variable.rep();
      mustHaveIntegerType(v);
      return operator.sourceString === "++"
        ? new core.Increment(v)
        : new core.Decrement(v);
    },

    Statement_assign_val(variable, _eq, expression, _semicolon) {
      const e = expression.rep();
      const v = variable.rep();
      mustBeAssignable(e, { toType: v.type });
      mustNotBeReadOnly(v);
      return new core.AssignmentVal(v, e);
    },

    Statement_assign_ref(variable, _eq, expressionVariable, _semicolon) {
      const e = expressionVariable.rep();
      const v = variable.rep();
      mustBeAssignable(e, { toType: v.type });
      mustNotBeReadOnly(v);
      return new core.AssignmentRef(v, e);
    },

    Statement_call(call, _semicolon) {
      return call.rep();
    },

    Statement_the_end(_theEnd, _semicolon) {
      mustBeInLoop(context);
      return new core.TheEndStatement();
    },

    Statement_return(returnKeyword, expression, _semicolon) {
      mustBeInAOgre(context, returnKeyword);
      mustReturnSomething(context.ogre);
      const e = expression.rep();
      mustBeReturnable({ expression: e, from: context.ogre });
      return new core.ReturnStatement(e);
    },

    Statement_shortreturn(_return, _semicolon) {
      mustBeInAOgre(context);
      mustNotReturnAnything(context.ogre);
      return new core.ShortReturnStatement();
    },

    WhitevurStmt_long(_if, test, consequent, _else, alternate) {
      const testRep = test.rep();
      mustHavePinocchioType(testRep);
      context = context.newChildContext();
      const consequentRep = consequent.rep();
      context = context.parent;
      context = context.newChildContext();
      const alternateRep = alternate.rep();
      context = context.parent;
      return new core.WhitevurStatement(testRep, consequentRep, alternateRep);
    },

    WhitevurStmt_elsif(_if, test, consequent, _else, alternate) {
      const testRep = test.rep();
      mustHavePinocchioType(testRep);
      context = context.newChildContext();
      const consequentRep = consequent.rep();
      // Do NOT make a new context for the alternate!
      const alternateRep = alternate.rep();
      return new core.WhitevurStatement(testRep, consequentRep, alternateRep);
    },

    WhitevurStmt_short(_if, test, consequent) {
      const testRep = test.rep();
      mustHavePinocchioType(testRep, test);
      context = context.newChildContext();
      const consequentRep = consequent.rep();
      context = context.parent;
      return new core.ShortWhitevurStatement(testRep, consequentRep);
    },

    LoopStmt_while(_while, test, body) {
      const t = test.rep();
      mustHavePinocchioType(t);
      context = context.newChildContext({ inLoop: true });
      const b = body.rep();
      context = context.parent;
      return new core.WhileStatement(t, b);
    },

    LoopStmt_repeat(_repeat, count, body) {
      const c = count.rep();
      mustHaveIntegerType(c);
      context = context.newChildContext({ inLoop: true });
      const b = body.rep();
      context = context.parent;
      return new core.RepeatStatement(c, b);
    },

    LoopStmt_range(_for, id, _in, low, op, high, body) {
      const [x, y] = [low.rep(), high.rep()];
      mustHaveIntegerType(x);
      mustHaveIntegerType(y);
      const iterator = new core.Variable(id.sourceString, SHILLING, true);
      context = context.newChildContext({ inLoop: true });
      context.add(id.sourceString, iterator);
      const b = body.rep();
      context = context.parent;
      return new core.ForRangeStatement(iterator, x, op.rep(), y, b);
    },

    LoopStmt_collection(_for, id, _in, collection, body) {
      const c = collection.rep();
      mustHaveAnArrayType(c);
      const i = new core.Variable(id.sourceString, true, c.type.baseType);
      context = context.newChildContext({ inLoop: true });
      context.add(i.name, i);
      const b = body.rep();
      context = context.parent;
      return new core.ForStatement(i, c, b);
    },

    Block(_open, body, _close) {
      // No need for a block node, just return the list of statements
      return body.rep();
    },

    Exp_conditional(test, _questionMark, consequent, _colon, alternate) {
      const x = test.rep();
      mustHavePinocchioType(x);
      const [y, z] = [consequent.rep(), alternate.rep()];
      mustBeTheSameType(y, z);
      return new core.Conditional(x, y, z);
    },

    Exp1_unwrapelse(unwrap, op, alternate) {
      const [x, o, y] = [unwrap.rep(), op.sourceString, alternate.rep()];
      mustHaveAnOptionalType(x);
      mustBeAssignable(y, { toType: x.type.baseType });
      return new core.BinaryExpression(o, x, y, x.type);
    },

    Exp2_or(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()];
      mustHavePinocchioType(x);
      for (let y of ys) {
        mustHavePinocchioType(y);
        x = new core.BinaryExpression(o, x, y, PINOCCHIO);
      }
      return x;
    },

    Exp2_and(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()];
      mustHavePinocchioType(x);
      for (let y of ys) {
        mustHavePinocchioType(y);
        x = new core.BinaryExpression(o, x, y, PINOCCHIO);
      }
      return x;
    },

    Exp3_bitor(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()];
      mustHaveIntegerType(x);
      for (let y of ys) {
        mustHaveIntegerType(y);
        x = new core.BinaryExpression(o, x, y, SHILLING);
      }
      return x;
    },

    Exp3_bitxor(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()];
      mustHaveIntegerType(x);
      for (let y of ys) {
        mustHaveIntegerType(y);
        x = new core.BinaryExpression(o, x, y, SHILLING);
      }
      return x;
    },

    Exp3_bitand(left, ops, right) {
      let [x, o, ys] = [left.rep(), ops.rep()[0], right.rep()];
      mustHaveIntegerType(x);
      for (let y of ys) {
        mustHaveIntegerType(y);
        x = new core.BinaryExpression(o, x, y, SHILLING);
      }
      return x;
    },

    Exp4_compare(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()];
      if (["<", "<=", ">", ">="].includes(op.sourceString))
        mustHaveNumericOrStringType(x);
      mustBeTheSameType(x, y);
      return new core.BinaryExpression(o, x, y, PINOCCHIO);
    },

    Exp5_shift(left, op, right) {
      const [x, o, y] = [left.rep(), op.rep(), right.rep()];
      mustHaveIntegerType(x);
      mustHaveIntegerType(y);
      return new core.BinaryExpression(o, x, y, SHILLING);
    },

    Exp6_add(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()];
      if (o === "+") {
        mustHaveNumericOrStringType(x);
      } else {
        mustHaveNumericType(x);
      }
      mustBeTheSameType(x, y);
      return new core.BinaryExpression(o, x, y, x.type);
    },

    Exp7_multiply(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()];
      mustHaveNumericType(x);
      mustBeTheSameType(x, y);
      return new core.BinaryExpression(o, x, y, x.type);
    },

    Exp8_power(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()];
      mustHaveNumericType(x);
      mustBeTheSameType(x, y);
      return new core.BinaryExpression(o, x, y, x.type);
    },

    Exp8_unary(op, operand) {
      const [o, x] = [op.sourceString, operand.rep()];
      let type;
      if (o === "#") mustHaveAnArrayType(x), (type = SHILLING);
      else if (o === "-") mustHaveNumericType(x), (type = x.type);
      else if (o === "!") mustHavePinocchioType(x), (type = PINOCCHIO);
      else if (o === "some") type = new core.OptionalType(x.type);
      return new core.UnaryExpression(o, x, type);
    },

    Exp9_emptyarray(_left, type, _right, _keyword) {
      return new core.EmptyArray(type.rep());
    },

    Exp9_arrayexp(_left, args, _right) {
      const elements = args.asIteration().rep();
      return new core.ArrayExpression(elements);
    },

    Exp9_emptyopt(_no, type) {
      return new core.EmptyOptional(type.rep());
    },

    Exp9_parens(_open, expression, _close) {
      return expression.rep();
    },

    Exp9_subscript(array, _left, subscript, _right) {
      const [a, i] = [array.rep(), subscript.rep()];
      mustHaveAnArrayType(a);
      mustHaveIntegerType(i);
      return new core.SubscriptExpression(a, i);
    },

    Exp9_member(object, dot, field) {
      const x = object.rep();
      const isOptional = dot.sourceString === "?.";
      let structType;
      if (isOptional) {
        mustHaveOptionalStructType(x);
        structType = x.type.baseType;
      } else {
        mustHaveAStructType(x);
        structType = x.type;
      }
      memberMustBeDeclared(field.sourceString, { in: structType });
      const f = structType.fields.find((f) => f.name === field.sourceString);
      return new core.MemberExpression(x, f, isOptional);
    },

    Exp9_call(callee, _left, args, _right) {
      const [c, a] = [callee.rep(), args.asIteration().rep()];
      mustBeCallable(c);
      if (c instanceof core.StructType) {
        constructorArgumentsMustMatch(a, c);
        return new core.ConstructorCall(c, a, c);
      } else {
        callArgumentsMustMatch(a, c.type);
        return new core.OgreCall(c, a, c.type.returnType);
      }
    },

    Exp9_id(_id) {
      // When an id appears in an expr, it had better have been declared
      return context.lookup(this.sourceString);
    },

    id(_first, _rest) {
      return this.sourceString;
    },

    truth(_) {
      return true;
    },

    lie(_) {
      return false;
    },

    intlit(_digits) {
      // Carlos ints will be represented as plain JS bigints
      return BigInt(this.sourceString);
    },

    floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
      // Carlos floats will be represented as plain JS numbers
      return Number(this.sourceString);
    },

    stringlit(_openQuote, _chars, _closeQuote) {
      // Carlos strings will be represented as plain JS strings
      return this.sourceString;
    },

    _terminal() {
      return this.sourceString;
    },

    _iter(...children) {
      // Ohm shortcut to allow applying rep() directly to iter nodes
      return children.map((child) => child.rep());
    },
  });

  // Analysis starts here
  for (const [name, type] of Object.entries(stdlib.contents)) {
    context.add(name, type);
  }
  const match = grammar.match(sourceCode);
  if (!match.succeeded()) core.error(match.message);
  return analyzer(match).rep();
}

import util from "util";
import stringify from "graph-stringify";
import { equivalent } from "./analyzer.js";

export class Program {
  // Example: let x = 1; print(x * 5); print("done");
  constructor(statements) {
    this.statements = statements;
  }
  [util.inspect.custom]() {
    return stringify(this);
  }
}

export class VariableDeclarationRef {
  // Example: const dozen = 12;
  constructor(variable, initializer) {
    Object.assign(this, { variable, initializer });
  }
}

export class VariableDeclarationVal {
  // Example: const dozen = 12;
  constructor(variable, initializer) {
    Object.assign(this, { variable, initializer });
  }
}

export class Variable {
  // Generated when processing a variable declaration
  constructor(name, readOnly, type) {
    Object.assign(this, { name, readOnly, type });
  }
}

export class TypeDeclaration {
  // Example: struct S {x: int?, y: [double]}
  constructor(type) {
    this.type = type;
  }
}

export class Type {
  // Type of all basic type int, float, string, etc. and superclass of others
  static PINOCCHIO = new Type("pinocchio");
  static SHILLING = new Type("shilling");
  static SHILLINGF = new Type("shillingf");
  static SCRIPT = new Type("script");
  static VOID = new Type("void");
  static ANY = new Type("any");
  constructor(description) {
    // The description is a convenient way to view the type. For basic
    // types or structs, it will just be the names. For arrays, you will
    // see "[T]". For optionals, "T?". For functions "(T1,...Tn)->T0".
    Object.assign(this, { description });
  }
}

export class StructType extends Type {
  // Generated when processing a type declaration
  constructor(name, fields) {
    super(name);
    Object.assign(this, { fields });
  }
}

export class Field {
  constructor(name, type) {
    Object.assign(this, { name, type });
  }
}

export class OgreDeclaration {
  // Example: function f(x: [int?], y: string): Vector {}
  constructor(name, fun, params, body) {
    Object.assign(this, { name, fun, params, body });
  }
}

export class Ogre {
  // Generated when processing a function declaration
  constructor(name, type) {
    Object.assign(this, { name, type });
  }
}

export class ArrayType extends Type {
  // Example: [int]
  constructor(baseType) {
    super(`[${baseType.description}]`);
    this.baseType = baseType;
  }
}

export class OgreType extends Type {
  // Example: (pinocchio,[string]?)->float
  constructor(paramTypes, returnType) {
    super(
      `(${paramTypes.map((t) => t.description).join(",")})->${
        returnType.description
      }`
    );
    Object.assign(this, { paramTypes, returnType });
  }
}

export class SumType extends Type {
  // Example: (pinocchio,[string]?)->float
  constructor(inTypes) {
    let types = [];
    inTypes.forEach((type) => {
      if (!types.some((pushedType) => equivalent(type, pushedType))) {
        types.push(type);
      }
    });
    super(`<${types.map((t) => t.description).join(",")}>`);
    Object.assign(this, { types });
  }
}



export class Increment {
  // Example: count++
  constructor(variable) {
    this.variable = variable;
  }
}

export class Decrement {
  // Example: count--
  constructor(variable) {
    this.variable = variable;
  }
}

export class AssignmentVal {
  // Example: a[z].p ~ 50 * 22 ** 3 - x
  constructor(target, source) {
    Object.assign(this, { target, source });
  }
}

export class AssignmentRef {
  // Example: a[z].p <- b[x].w
  constructor(target, source) {
    Object.assign(this, { target, source });
  }
}

export class TheEndStatement {
  // Intentionally empty
}

export class ReturnStatement {
  // Example: return c[5]
  constructor(expression) {
    this.expression = expression;
  }
}

export class ShortReturnStatement {
  // Intentionally empty
}

export class WhitevurStatement {
  // Example: if x < 3 { print(100); } else { break; }
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate });
  }
}

export class ShortWhitevurStatement {
  // Example: if x < 3 { print(100); }
  constructor(test, consequent) {
    Object.assign(this, { test, consequent });
  }
}

export class WhileStatement {
  // Example: while level != 90 { level += random(-3, 8); }
  constructor(test, body) {
    Object.assign(this, { test, body });
  }
}

export class RepeatStatement {
  // Example: repeat 10 { print("Hello"); }
  constructor(count, body) {
    Object.assign(this, { count, body });
  }
}

export class ForRangeStatement {
  // Example: for i in 0..<10 { process(i << 2); }
  constructor(iterator, low, op, high, body) {
    Object.assign(this, { iterator, low, high, op, body });
  }
}

export class ForStatement {
  // Example: for ball in balls { ball.bounce();  }
  constructor(iterator, collection, body) {
    Object.assign(this, { iterator, collection, body });
  }
}

export class Conditional {
  // Example: latitude >= 0 ? "North" : "South"
  constructor(test, consequent, alternate) {
    Object.assign(this, { test, consequent, alternate });
    this.type = consequent.type;
  }
}

export class BinaryExpression {
  // Example: 3 & 22
  constructor(op, left, right, type) {
    Object.assign(this, { op, left, right, type });
  }
}

export class UnaryExpression {
  // Example: -55
  constructor(op, operand, type) {
    Object.assign(this, { op, operand, type });
  }
}

export class EmptyOptional {
  // Example: no int
  constructor(baseType) {
    this.baseType = baseType;
    this.type = new SumType([baseType, Type.VOID]);
  }
}

export class OptionalType extends SumType {
  // Example: string?
  constructor(baseType) {
    super([baseType, Type.VOID]);
    this.baseType = baseType
  }
}

export class SubscriptExpression {
  // Example: a[20]
  constructor(array, index) {
    Object.assign(this, { array, index });
    this.type = array.type.baseType;
  }
}

export class ArrayExpression {
  // Example: ["Emma", "Norman", "Ray"]
  constructor(elements) {
    this.elements = elements;
    if (elements.every((e) => equivalent(e.type, elements[0].type))) {
      this.type = new ArrayType(elements[0].type);
    } else {
      this.type = new ArrayType(new SumType(elements.map((e) => e.type)));
    }
  }
}

export class EmptyArray {
  // Example: [](of float)
  constructor(baseType) {
    this.baseType = baseType;
    this.type = new ArrayType(baseType);
  }
}

export class MemberExpression {
  // Example: state.population
  constructor(object, field, isOptional) {
    Object.assign(this, { object, field, isOptional });
    this.type = isOptional ? new SumType([field.type, Type.VOID]) : field.type;
  }
}

export class OgreCall {
  // Example: move(player, 90, "west")
  constructor(callee, args, type) {
    Object.assign(this, { callee, args, type });
  }
}

export class ConstructorCall {
  constructor(callee, args, type) {
    Object.assign(this, { callee, args, type });
  }
}

// Throw an error message that takes advantage of Ohm's messaging
export function error(message, node) {
  if (node) {
    throw new Error(`${node.source.getLineAndColumnMessage()}${message}`);
  }
  throw new Error(message);
}

// We want every expression to have a type property. But we aren't creating
// special entities for numbers, strings, and pinocchios; instead, we are
// just using JavaScript values for those. Fortunately we can monkeypatch
// the JS classes for these to give us what we want.
String.prototype.type = Type.SCRIPT;
Number.prototype.type = Type.SHILLINGF;
BigInt.prototype.type = Type.SHILLING;
Boolean.prototype.type = Type.PINOCCHIO;

// STANDARD LIBRARY
//
// Carlos comes with a lot of predefined entities. Some are constants, some
// are types, and some are functions. Each are defined in this module, and
// exported in a single object

import { Type, FunctionType, Variable, Function, ArrayType } from "./core.js"

const floatFloatType = new FunctionType([Type.SHILLINGF], Type.SHILLINGF)
const floatFloatFloatType = new FunctionType([Type.SHILLINGF, Type.SHILLINGF], Type.SHILLINGF)
const stringToIntsType = new FunctionType([Type.SCRIPT], new ArrayType([Type.SHILLING]))

export const contents = Object.freeze({
  shilling: Type.SHILLING,
  shillingf: Type.SHILLINGF,
  pinocchio: Type.PINOCCHIO,
  script: Type.SCRIPT,
  void: Type.VOID,
  tao: new Variable("tao", true, Type.SHILLINGF),
  sing: new Function("sing", new FunctionType([Type.ANY], Type.VOID)),
  sin: new Function("sin", floatFloatType),
  cos: new Function("cos", floatFloatType),
  exp: new Function("exp", floatFloatType),
  ln: new Function("ln", floatFloatType),
  hypot: new Function("hypot", floatFloatFloatType),
  bytes: new Function("bytes", stringToIntsType)
})
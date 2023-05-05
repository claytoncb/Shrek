// STANDARD LIBRARY
//
// Carlos comes with a lot of predefined entities. Some are constants, some
// are types, and some are functions. Each are defined in this module, and
// exported in a single object

import { Type, OgreType, Variable, Ogre, ArrayType } from "./core.js"

const floatFloatType = new OgreType([Type.SHILLINGF], Type.SHILLINGF)
const floatFloatFloatType = new OgreType([Type.SHILLINGF, Type.SHILLINGF], Type.SHILLINGF)
const stringToIntsType = new OgreType([Type.SCRIPT], new ArrayType([Type.SHILLING]))

export const contents = Object.freeze({
  shilling: Type.SHILLING,
  shillingf: Type.SHILLINGF,
  pinocchio: Type.PINOCCHIO,
  script: Type.SCRIPT,
  void: Type.VOID,
  tao: new Variable("tao", true, Type.SHILLINGF),
  sing: new Ogre("sing", new OgreType([Type.ANY], Type.VOID)),
  sin: new Ogre("sin", floatFloatType),
  cos: new Ogre("cos", floatFloatType),
  exp: new Ogre("exp", floatFloatType),
  ln: new Ogre("ln", floatFloatType),
  hypot: new Ogre("hypot", floatFloatFloatType),
  bytes: new Ogre("bytes", stringToIntsType)
})
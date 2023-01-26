import { add, subtract } from "../src/Shrek--.js";
import assert from "assert"

describe("The Compiler", () => {
    it("Correct values for the add function", () => {
      assert.equal(add(5,8), 13);
      assert.equal(add(5,-8),-3);
    });
    it("Correct values for the subtract function", () => {
        assert.equal(subtract(9,8), 1);
        assert.equal(subtract(5,-9),14);
      });
});








      
const Ingredient = require("../src/classes/Ingredient.js");
const expect = require("chai").expect;

describe("Ingredient", () => {
  let ingredient;
  beforeEach(() => {
    ingredient = new Ingredient(20081, "wheat flour", 142);
  });
  it("should be a function", () => {
    expect(ingredent).to.be.a("function");
  });
});

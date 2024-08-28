
const { sqlForPartialUpdate } = require("../helpers/sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", () => {

  test("works: partial update", () => {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: 32 },
      { firstName: "first_name", age: "age" }
    );
    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("works: no jsToSql provided", () => {
    const result = sqlForPartialUpdate(
      { firstName: "Aliya", age: 32 },
      {}
    );
    expect(result).toEqual({
      setCols: '"firstName"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });

  test("throws BadRequestError if no data", () => {
    expect(() => {
      sqlForPartialUpdate({}, { firstName: "first_name" });
    }).toThrow(BadRequestError);
  });

});


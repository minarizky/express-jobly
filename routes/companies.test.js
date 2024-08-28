"use strict";

const request = require("supertest");
const db = require("../db");
const app = require("../app");
const { createToken } = require("../helpers/tokens");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token, // Token for a non-admin user
  adminToken, // Token for an admin user
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /users */

describe("POST /users", function () {
  const newUser = {
    username: "newuser",
    firstName: "New",
    lastName: "User",
    email: "newuser@example.com",
    isAdmin: false,
  };

  test("works for admin", async function () {
    const token = createToken({ username: "admin", isAdmin: true }); // Admin token
    const resp = await request(app)
        .post("/users")
        .send(newUser)
        .set("authorization", `Bearer ${token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: newUser,
    });
  });

  test("fails for non-admin", async function () {
    const token = createToken({ username: "user", isAdmin: false }); // Non-admin token
    const resp = await request(app)
        .post("/users")
        .send(newUser)
        .set("authorization", `Bearer ${token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  test("bad request with missing data", async function () {
    const token = createToken({ username: "admin", isAdmin: true }); // Admin token
    const resp = await request(app)
        .post("/users")
        .send({ username: "newuser" })
        .set("authorization", `Bearer ${token}`);
    expect(resp.statusCode).toEqual(400); // Bad Request
  });

  test("bad request with invalid data", async function () {
    const token = createToken({ username: "admin", isAdmin: true }); // Admin token
    const resp = await request(app)
        .post("/users")
        .send({ ...newUser, email: "not-an-email" })
        .set("authorization", `Bearer ${token}`);
    expect(resp.statusCode).toEqual(400); // Bad Request
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      users: [
        // Add expected user data here
      ],
    });
  });

  test("fails for non-admin", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  test("fails for anon", async function () {
    const resp = await request(app).get("/users");
    expect(resp.statusCode).toEqual(401); // Unauthorized
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .get("/users/admin")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        username: "admin",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
      },
    });
  });

  test("works for self", async function () {
    const resp = await request(app)
        .get("/users/u1")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "User1",
        lastName: "Test",
        isAdmin: false,
      },
    });
  });

  test("fails for other users", async function () {
    const resp = await request(app)
        .get("/users/u2")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  test("not found for no such user", async function () {
    const resp = await request(app)
        .get("/users/nope")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Not Found
  });
});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch("/users/admin")
        .send({ firstName: "Updated" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        username: "admin",
        firstName: "Updated",
        lastName: "User",
        isAdmin: true,
      },
    });
  });

  test("works for self", async function () {
    const resp = await request(app)
        .patch("/users/u1")
        .send({ firstName: "Updated" })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "Updated",
        lastName: "Test",
        isAdmin: false,
      },
    });
  });

  test("fails for other users", async function () {
    const resp = await request(app)
        .patch("/users/u2")
        .send({ firstName: "Updated" })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  test("not found for no such user", async function () {
    const resp = await request(app)
        .patch("/users/nope")
        .send({ firstName: "Updated" })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Not Found
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch("/users/u1")
        .send({ email: "not-an-email" })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400); // Bad Request
  });
});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete("/users/u1")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for self", async function () {
    const resp = await request(app)
        .delete("/users/u1")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("fails for other users", async function () {
    const resp = await request(app)
        .delete("/users/u2")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403); // Forbidden
  });

  test("not found for no such user", async function () {
    const resp = await request(app)
        .delete("/users/nope")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404); // Not Found
  });
});

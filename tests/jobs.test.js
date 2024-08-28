"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "New Job",
          salary: 50000,
          equity: 0.1,
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        title: "New Job",
        salary: 50000,
        equity: 0.1,
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "New Job",
          salary: 50000,
          equity: 0.1,
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "New Job",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("works for all", async function () {
    const resp = await request(app)
        .get("/jobs");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        // Add expected jobs here based on your test setup
      ],
    });
  });

  test("works with filters", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({ title: "Job", minSalary: 30000, hasEquity: 'true' });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        // Add expected filtered jobs here based on your test setup
      ],
    });
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const job = await Job.create({
      title: "Job to Update",
      salary: 30000,
      equity: 0.05,
      companyHandle: "c1",
    });

    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          salary: 35000,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: {
        id: job.id,
        title: "Job to Update",
        salary: 35000,
        equity: 0.05,
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const job = await Job.create({
      title: "Job to Update",
      salary: 30000,
      equity: 0.05,
      companyHandle: "c1",
    });

    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          salary: 35000,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/999999`)
        .send({
          salary: 35000,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const job = await Job.create({
      title: "Job to Update",
      salary: 30000,
      equity: 0.05,
      companyHandle: "c1",
    });

    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          salary: "invalid",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const job = await Job.create({
      title: "Job to Delete",
      salary: 30000,
      equity: 0.05,
      companyHandle: "c1",
    });

    const resp = await request(app)
        .delete(`/jobs/${job.id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: `${job.id}` });
  });

  test("unauth for non-admin", async function () {
    const job = await Job.create({
      title: "Job to Delete",
      salary: 30000,
      equity: 0.05,
      companyHandle: "c1",
    });

    const resp = await request(app)
        .delete(`/jobs/${job.id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found if no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/999999`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});


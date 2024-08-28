"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin, ensureAdminOrUser } = require("../middleware/authorization"); // Import the middleware
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user } => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ { username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 *   where jobs is [{ id, title, company_handle, company_name, state }]
 *
 * Authorization required: logged-in user or admin
 **/

router.get("/:username", ensureLoggedIn, ensureAdminOrUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const appliedJobs = await User.getAppliedJobs(req.params.username); // Assumes this method exists in the User model
    return res.json({ ...user, jobs: appliedJobs });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: logged-in user or admin
 **/

router.patch("/:username", ensureLoggedIn, ensureAdminOrUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username] => { deleted: username }
 *
 * Authorization required: logged-in user or admin
 **/

router.delete("/:username", ensureLoggedIn, ensureAdminOrUser, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

/** POST /users/:username/jobs/:id
 *
 * Allows a user to apply for a job.
 *
 * Returns { applied: jobId }
 *
 * Authorization required: logged-in user (can apply for themselves) or admin
 **/

router.post("/:username/jobs/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const { username, id: jobId } = req.params;

    // Ensure only admins or the user can apply for the job
    if (!req.user.isAdmin && req.user.username !== username) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const appliedJobId = await User.applyForJob(username, jobId); // Assumes this method exists in the User model
    return res.json({ applied: appliedJobId });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;


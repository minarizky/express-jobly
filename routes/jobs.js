const express = require('express');
const Job = require('../models/job');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const router = new express.Router();

// POST /jobs - Admin only
router.post('/jobs', ensureLoggedIn, ensureAdmin, async (req, res, next) => {
  try {
    const { title, salary, equity, companyHandle } = req.body;
    const job = await Job.create({ title, salary, equity, companyHandle });
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

// GET /jobs - Public
router.get('/jobs', async (req, res, next) => {
  try {
    const { title, minSalary, hasEquity } = req.query;
    let filter = {};

    if (title) {
      filter.title = { [Op.iLike]: `%${title}%` };
    }
    if (minSalary) {
      filter.salary = { [Op.gte]: minSalary };
    }
    if (hasEquity !== undefined) {
      filter.equity = hasEquity === 'true' ? { [Op.gt]: 0 } : { [Op.eq]: 0 };
    }

    const jobs = await Job.findAll({ where: filter });
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// PATCH /jobs/:id - Admin only
router.patch('/jobs/:id', ensureLoggedIn, ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, salary, equity } = req.body;
    const job = await Job.findByPk(id);

    if (!job) {
      throw new Error('Job not found');
    }

    await job.update({ title, salary, equity });
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// DELETE /jobs/:id - Admin only
router.delete('/jobs/:id', ensureLoggedIn, ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);

    if (!job) {
      throw new Error('Job not found');
    }

    await job.destroy();
    return res.json({ deleted: id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

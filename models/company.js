"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Find all companies with optional filtering by name, minEmployees, maxEmployees
   *
   * @param {Object} [filter={}] - Filtering options.
   * @param {string} [filter.name] - Partial or full name of the company to search.
   * @param {number} [filter.minEmployees] - Minimum number of employees.
   * @param {number} [filter.maxEmployees] - Maximum number of employees.
   * @returns {Array} - Array of company objects matching the filter criteria.
   */
  static async findAll({ name, minEmployees, maxEmployees } = {}) {
    let query = `SELECT handle, name, num_employees AS "numEmployees", description, logo_url AS "logoUrl" FROM companies`;
    let whereExpressions = [];
    let queryValues = [];

    // Add filtering options
    if (minEmployees !== undefined) {
      queryValues.push(minEmployees);
      whereExpressions.push(`num_employees >= $${queryValues.length}`);
    }
    if (maxEmployees !== undefined) {
      queryValues.push(maxEmployees);
      whereExpressions.push(`num_employees <= $${queryValues.length}`);
    }
    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }
    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }
    query += " ORDER BY name";

    const companiesRes = await db.query(query, queryValues);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * @param {string} handle - The handle of the company to retrieve.
   * @returns {Object} - The company data.
   * @throws {NotFoundError} - If no company is found with the given handle.
   */
  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle, name, num_employees AS "numEmployees", description, logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`,
      [handle]
    );
    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Create a company (from data), update db, return new company data.
   *
   * @param {Object} data - Company data to create.
   * @param {string} data.handle - Unique identifier for the company.
   * @param {string} data.name - Name of the company.
   * @param {number} data.numEmployees - Number of employees.
   * @param {string} data.description - Description of the company.
   * @param {string} data.logoUrl - URL of the company's logo.
   * @returns {Object} - The newly created company data.
   * @throws {BadRequestError} - If a company with the same handle already exists.
   */
  static async create({ handle, name, numEmployees, description, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
       FROM companies
       WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate company: ${handle}`);
    }

    const result = await db.query(
      `INSERT INTO companies
       (handle, name, num_employees, description, logo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING handle, name, num_employees AS "numEmployees", description, logo_url AS "logoUrl"`,
      [handle, name, numEmployees, description, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * @param {string} handle - The handle of the company to update.
   * @param {Object} data - Data to update.
   * @param {string} [data.name] - Updated name of the company.
   * @param {number} [data.numEmployees] - Updated number of employees.
   * @param {string} [data.description] - Updated description of the company.
   * @param {string} [data.logoUrl] - Updated URL of the company's logo.
   * @returns {Object} - The updated company data.
   * @throws {NotFoundError} - If no company is found with the given handle.
   */
  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      }
    );
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                num_employees AS "numEmployees", 
                                description, 
                                logo_url AS "logoUrl"`;

    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * @param {string} handle - The handle of the company to delete.
   * @throws {NotFoundError} - If no company is found with the given handle.
   */
  static async remove(handle) {
    const result = await db.query(
      `DELETE FROM companies
       WHERE handle = $1
       RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;


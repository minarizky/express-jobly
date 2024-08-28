const { Model, DataTypes } = require('sequelize');
const db = require('../db');

class Job extends Model {}

Job.init({
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  salary: {
    type: DataTypes.NUMERIC,
  },
  equity: {
    type: DataTypes.NUMERIC,
    defaultValue: 0,
  },
  companyHandle: {
    type: DataTypes.STRING,
    references: {
      model: 'companies',
      key: 'handle',
    },
    allowNull: false,
  },
}, {
  sequelize: db,
  modelName: 'Job',
  timestamps: true,
});

module.exports = Job;

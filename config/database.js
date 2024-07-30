const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'sqlite',
  logging: false,
});

const URL = sequelize.define('URL', {
  originalUrl: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  uniqueId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  redirectUrl: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  imageData: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
});

sequelize.sync();

module.exports = { sequelize, URL };

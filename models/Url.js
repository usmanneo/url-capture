const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Url = sequelize.define('Url', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  originalUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uniqueId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  redirectUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageData: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'urls',
  timestamps: true
});

module.exports = Url;

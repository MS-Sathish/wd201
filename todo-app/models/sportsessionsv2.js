'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sportsessionsv2 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  sportsessionsv2.init({
    Date: DataTypes.DATEONLY,
    location: DataTypes.STRING,
    count: DataTypes.INTEGER,
    sports: DataTypes.STRING,
    accessid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'sportsessionsv2',
  });
  return sportsessionsv2;
};
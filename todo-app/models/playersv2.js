'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class playersv2 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  playersv2.init({
    playersname: DataTypes.STRING,
    sessionid: DataTypes.INTEGER,
    sports: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'playersv2',
  });
  return playersv2;
};
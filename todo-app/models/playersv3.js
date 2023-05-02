'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class playersv3 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  playersv3.init({
    playersname: DataTypes.STRING,
    sessionid: DataTypes.INTEGER,
    sports: DataTypes.STRING,
    accessid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'playersv3',
  });
  return playersv3;
};
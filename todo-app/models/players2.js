'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class players extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  players.init({
    playersname: DataTypes.STRING,
    sessionid: DataTypes.INTEGER,
    sports: DataTypes.STRING,
    useraccessid: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'players',
  });
  return players;
};
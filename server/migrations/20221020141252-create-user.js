'use strict';
module.exports = {
  up:function(migration, DataTypes){
    return migration.createTable('users', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      objectId: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING(255),
      },
      lastName: {
        type: DataTypes.STRING(255),
      },
      email: {
        type: DataTypes.STRING(255),
      },
      userGroup: {
        type: DataTypes.TEXT,
      },
      userType: {
        type: DataTypes.TEXT,
      },
      paylocityEmployeeId: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      divisionId: {
        type: DataTypes.TEXT,
      },
      jobTitle: {
        type: DataTypes.STRING(255),
      },
      userPrincipalName: {
        type: DataTypes.STRING(255),
      },
      officeLocation: {
        type: DataTypes.STRING(255),
      },
      lastLoginTime: {
        type: DataTypes.DATE,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    }, {
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    });
  },
  down:function(migration, DataTypes){
    return migration.dropTable('users');
  }
};

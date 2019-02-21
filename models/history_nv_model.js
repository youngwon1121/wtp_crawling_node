module.exports = function(sequelize, DataTypes, tableName){
    return sequelize.define(tableName, {
        rank : {
            type : DataTypes.INTEGER,
            allowNull : false,
        },
        date : {
            type : DataTypes.DATEONLY,
            allowNull : false,
            defaultValue : DataTypes.NOW
        }
    }, {
        freezeTableName : true,
    })
}
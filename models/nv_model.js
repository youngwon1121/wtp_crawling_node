module.exports = function(sequelize, DataTypes, tableName){
    return sequelize.define(tableName, {
        keyword : {
            type : DataTypes.STRING,
            allowNull : false,
        },
        target_url : {
            type : DataTypes.STRING(100),
            allowNull : false,
        },
        rank_now : {
            type : DataTypes.INTEGER,
            allowNull : true
        }
    }, {
        freezeTableName : true,
        timestamps : true,
    })
}
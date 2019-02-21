module.exports = function(sequelize, DataTypes, tableName){
    return sequelize.define('cafe_cmt', {
        company : {
            type : DataTypes.STRING,
            allowNull : false,
        },
        target_url : {
            type : DataTypes.STRING,
            allowNull : false,
        },
        comment : {
            type : DataTypes.TEXT
        }
    }, {
        freezeTableName : true,
        timestamps : true,
    })
}
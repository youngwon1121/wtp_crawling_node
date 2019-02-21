module.exports = function(sequelize, DataTypes){
    return sequelize.define('user', {
        username : {
            type : DataTypes.STRING,
            allowNull : false,
            unique : true
        },
        password : {
            type : DataTypes.STRING,
            allowNull : false,
        }
    }, {
        freezeTableName : true,
        timestamps : false,
    })
}
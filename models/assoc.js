var config = {
    initAssociation : function(db){
        db.cafe_cmt.belongsTo(db.user, {foreignKey : 'owner', targetKey : 'username'})
        db.user.hasMany(db.cafe_cmt, {foreignKey : 'owner', sourceKey : 'username'})
    },
    crawlRankChkAssociation : function(nv_model, history_nv_model, user){
        //between user and nv_model
        nv_model.belongsTo(user, {foreignKey : 'owner', targetKey : 'username'})
        user.hasMany(nv_model, {foreignKey : 'owner', sourceKey : 'username'})
        
        //between nv_model and history_nv_model
        history_nv_model.belongsTo(nv_model, {foreignKey : 'main_id'})
        nv_model.hasMany(history_nv_model, {foreignKey : 'main_id'})
    }
}
module.exports = config
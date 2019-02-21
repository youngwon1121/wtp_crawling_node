const Sequelize = require('sequelize');
const fs = require('fs')
const path = require('path')
const dbConfig = require('../config/database')
const authKey = require('../config/jwt_auth')
const assoc = require('./assoc')
const nv_model = require('./nv_model')
const history_nv_model = require('./history_nv_model')

const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    'define' : {
        charset : 'utf8mb4',
        collate : 'utf8mb4_general_ci',
        timestamps : true
    },
    'timezone' : '+09:00',
    'host' : dbConfig.host,
    'pool' : {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    'dialect' : 'mysql',
    'dialectOptions' : {
        socketPath : dbConfig.socketPath
    }
})

const db = {};
db.sequelize = sequelize
db.Sequelize = Sequelize
db.secretKey = authKey.secret

const model_type = ['nv_blog', 'nv_cafe', 'nv_kin', 'nv_m_view']
const history_model_type = ['history_nv_blog', 'history_nv_cafe', 'history_nv_kin', 'history_nv_m_view']

fs.readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== 'index.js' && file !== 'assoc.js' && file !== 'nv_model.js' && file !== 'history_nv_model.js')
    })
    .forEach(file => {
        let model = sequelize.import(path.join(__dirname, file))
        db[model.name] = model
    })

for(let i=0;i<model_type.length; i++){
    db[model_type[i]] = nv_model(sequelize, Sequelize, model_type[i])
    db[history_model_type[i]] = history_nv_model(sequelize, Sequelize, history_model_type[i])
    assoc.crawlRankChkAssociation(db[model_type[i]], db[history_model_type[i]], db.user)
}
assoc.initAssociation(db);
module.exports = db;
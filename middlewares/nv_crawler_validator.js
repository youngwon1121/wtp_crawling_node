const jwt = require('jsonwebtoken')
const models = require('../models')

//table이름을 middleware에서 찾아서 req에 넣어둠
function getModelObj(curr_url){
	const splited = curr_url.split('/')[2]
	if(splited == "blog")
		return {
			type : 1,
			model : models.nv_blog,
			history_model : models.history_nv_blog
		}
	else if(splited == "cafe")
		return {
			type : 2,
			model : models.nv_cafe,
			history_model : models.history_nv_cafe
		}
	else if(splited == "kin")
		return {
			type : 3,
			model : models.nv_kin,
			history_model : models.history_nv_kin
		}
	else if(splited == "mview")
		return {
			type : 4,
			model : models.nv_m_view,
			history_model : models.history_nv_m_view
		}
}

const authMiddleware = (req, res, next) => {
	const token = req.headers['x-access-token'] || req.query.token

	if(!token){
		console.log('could not find token')
		return false;
	}

	const check = function(){
		return new Promise((resolve, reject) => {
			jwt.verify(token, models.secretKey, (err, decode) => {
				if(err)
					reject(err)
				resolve(decode) 
			})
		})
	}

	check()
	.then(decoded => {
		req.decoded = decoded
		req.db = getModelObj(req.originalUrl)
		next()
	})
	.catch(err => {
		if(err.name === 'TokenExpiredError'){
			return res.status(403).send(err.message)
		}
		else{
			return res.status(500).end()
		}
	});
}

module.exports = authMiddleware
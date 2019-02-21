const jwt = require('jsonwebtoken')
const models = require('../models')

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
		next()
	})
	.catch(err => {
		//jwt expired도 발생함
		if(err.name === 'TokenExpiredError'){
			return res.status(403).send(err.message)
		}
		else{
			return res.status(500).end()
		}
	});
}

module.exports = authMiddleware
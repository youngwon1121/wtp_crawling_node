const jwt = require('jsonwebtoken')
const secretObj = require('../config/jwt_auth')

//table이름을 middleware에서 찾아서 req에 넣어둠
function getTableName(curr_url){
	const splited = curr_url.split('/')[2]
	let table_name
	if(splited == "blogs")
		table_name = "nv_blog"
	else if(splited == "cafe")
		table_name = "nv_cafe"
	else if(splited == "kin")
		table_name = "nv_kin"
	else if(splited == "mview")
		table_name = "nv_m_view"
	return table_name
}

const authMiddleware = (req, res, next) => {
	const token = req.headers['x-access-token'] || req.query.token

	if(!token){
		console.log('could not find token')
		return false;
	}

	const check = new Promise((resolve, reject) => {
		jwt.verify(token, secretObj.secret, (err, decode) => {
			if(err)
				reject(err)
			resolve(decode) 
		})
	})

	check
	.then((decoded)=>{
		req.decoded = decoded
		req.table_name = getTableName(req.originalUrl)
		next()
	})
	.catch((error) => {
		return res.status(403).json({
			success: 0,
			message: error.message
		})
	});
}

module.exports = authMiddleware
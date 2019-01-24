module.exports = (req, res, next) => {
	let jwt = require('jsonwebtoken')

	const token = req.headers['x-access-token'] || req.query.token

	if(!token){
		console.log('cannot fount token')
		return false;
	}

	const check = new Promise((resolve, reject) => {
		jwt.verify(token, "SeCrEtKeYfOrHaShInG", (err, decode) => {
			if(err)
				reject(err)
			resolve(decode) 
		})
	})

	check
	.then((decoded)=>{
		req.decoded = decoded
		next()
	})
	.catch((error) => {
		return res.status(403).json({
			success: 0,
			message: error.message
		})
	});
}
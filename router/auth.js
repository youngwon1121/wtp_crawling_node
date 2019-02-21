const router = require('express').Router();
const jwt = require('jsonwebtoken')
const models = require('../models')

//issuing token
router.post('/login', (req, res) => {
	//체크하기
	let username = req.body.username
	let password = req.body.password
	
	//토큰생성
	let token = jwt.sign({
		username: username
	},
	models.secretKey,
	{
		expiresIn: '60m'
	})

	models.user.findOne({
		where : {username : username}
	})
	.then(result => {
		if(!result){
			console.log(result)
			return res.status(401).send("존재하지 않는 아이디입니다.");
		}
		if(result.password === password){
			return res.status(201).json({result : token})
		}
		else{
			//wrong password
			return res.status(401).send("비밀번호가 틀렸습니다.")
		}
	})
	.catch(err => {
		console.log(err.message);
		return res.status(500).end()
	})
});

module.exports = router
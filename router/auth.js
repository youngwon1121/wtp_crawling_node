module.exports = function(app, pool){
	var express = require('express');
	var router = express.Router();
	let jwt = require('jsonwebtoken')
	let secretObj = require('../config/jwt_auth')
	
	//issuing token
	router.post('/login', (req, res) => {
		//체크하기
		var username = req.body.username
		var password = req.body.password
		
		//토큰생성
		var token = jwt.sign({
			username: username
		},
		secretObj.secret,
		{
			expiresIn: '60m'
		})

		const login = async() => {
			try {
				const connection = await pool.getConnection(async conn => conn);
				try {
					var qry = `SELECT * FROM user WHERE username=?`
					const [rows] = await connection.query(qry, [username]);
					connection.release();
					console.log("결과 :"+rows);
					return rows
				} catch(err) {
					console.log('Query Error');
					connection.release();
					throw err;
				}

			} catch(err) {
				console.log('DB Error');
				throw err;
			}
		}

		login().then(result => {
			//id가 틀렸을시 result = []
			//[].a로 접근시 typeError발생
			console.log(username, password);
			console.log(result);
			if(result.length != 0){
				if(result[0].password == password){
					return res.json({success: 1, token:token})
				}
				return res.json({success:0, msg: "비밀번호 틀립니다."})
			}
			//id찾을수없음
			else{
				return res.json({success:0, msg: "username을 찾을 수 없습니다."})
			}
		})
		.catch(err => {
			console.log(err);
			return res.json({success:0, msg: "에러가 발생했습니다."})
		})
	});

	return router
}
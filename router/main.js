const router = require('express').Router();
let {PythonShell} = require('python-shell');
const url = require('url')

//pool만 가져다가 쓸수있게 수정
const pool = require('../config/connect_db');

function fixTargetUrl(target_url){
	let parsed_object  = url.parse(target_url)
	let query_object = {}

	let query_list = parsed_object.query.split('&')
	for(let query of query_list){
		splited = query.split('=')
		key = splited[0];
		value = splited[1];
		query_object[key] = value;
	}
	const fixed_url = parsed_object.hostname + parsed_object.pathname + '?' + "d1id=" + query_object['d1id'] + "&dirId=" + query_object['dirId']+ "&docId=" + query_object["docId"]
	return fixed_url
}

function executePy(script_name, options){
	return new Promise((resolve, reject) => {
		PythonShell.run(script_name, options, function (err, results){
			if (err){
				console.log(err.message)
				reject(err);
			}
			else{
				let rank = results[0];
				console.log(results);
				resolve(rank);
			}
		});
	})
}

//블로그 다 가져오기
router.get('/', (req, res) => {
	const main_table = req.table_name
	const getAllBlogs = async () => {
		try {
			const connection = await pool.getConnection(async conn => conn);
			try {
				let qry = `SELECT * FROM ${main_table} WHERE owner = ? ORDER BY id DESC`
				let [rows] = await connection.query(qry, [req.decoded.username]);
				connection.release();
				return rows
			} catch(err) {
				connection.release();
				throw err
			}
		} catch(err) {
			throw err
		}
	}

	getAllBlogs().then((result) => {
		return res.status(200).json({success : 1, result : result})
	})
	.catch(err => {
		console.log(err.message)
		return res.status(400).json({success : 0, msg : err.message})
	})
})

//블로그 등록
router.post('/', (req, res) => {
	const main_table = req.table_name
	const postBlog = async () => {
		try {
			const connection = await pool.getConnection(async conn => conn);
			try {
				if(main_table == "nv_kin")
					req.body.target_url = fixTargetUrl(req.body.target_url);
				let data = [req.body.keyword, req.body.target_url, req.decoded.username];
				let qry = `INSERT INTO ${main_table}(keyword, target_url, date, owner) VALUES(?, ?, NOW(), ?)`
				let [rows] = await connection.query(qry, data);
				connection.release();
				return rows
			} catch(err) {
				connection.release();
				throw err
			}

		} catch(err) {
			throw err
		}
	}

	postBlog().then((result) => {
		return res.status(201).json({success : 1, result : result})	
	})
	.catch(err => {
		console.log(err.message);
		return res.status(400).json({success : 0, msg : err.message})
	})
})

//블로그 선택삭제
router.delete('/', (req, res) => {
	const main_table = req.table_name
	const delSelectedBlogs = async () => {
		try {
			const connection = await pool.getConnection(async conn => conn);
			try {
				let del_list = req.body.del_list.join(',');
				let qry = `DELETE FROM ${main_table} where id in (${del_list}) AND owner=?`
				let [rows] = await connection.query(qry, [req.decoded.username]);
				connection.release();
				return true
			} catch(err) {
				connection.release();
				return err
			}
		} catch(err) {
			return err
		}
	}

	delSelectedBlogs().then((result) => {
		return res.status(200).json({success : 1})
	})
	.catch(err => {
		console.log(err.message);
		return res.status(400).json({success : 0, msg : err.message})
	})
})

//랭크측정&변경
router.put('/rank/:id', (req, res) => {
	const main_table = req.table_name
	const getInfo = async () => {
		try {
			const connection = await pool.getConnection(async conn => conn);
			try {
				let [rows] = await connection.query(`SELECT * FROM ${main_table} WHERE id = ?`, [req.params.id]);
				connection.release();
				return rows
			} catch(err) {
				console.log('Query Error');
				connection.release();
				throw err
			}
		} catch(err) {
			console.log('DB Error');
			throw err
		}
	}

	const getRank = (keyword, target_url) => {
		let searching_type
		if(main_table == 'nv_blog')
			searching_type=1
		else if(main_table == 'nv_cafe')
			searching_type=2
		else if(main_table == 'nv_kin')
			searching_type=3

		//pc -> python wtp_crawler.py
		if(searching_type <= 3){
			let options = {
				mode : 'text',
				pythonOptions: ['-u'],
				args: [keyword, target_url, searching_type]
			};
			return executePy('wtp_crawler.py', options)
		}
		else{
			let options = {
				mode : 'text',
				pythonOptions: ['-u'],
				args: [keyword, target_url]
			};
			return executePy('wtp_crawler_m.py', options)
		}
	}

	const updateRank = async(rank) => {
		try {
			const connection = await pool.getConnection(async conn => conn);
			try {
				//main_table 랭킹 업데이트
				let qry = `UPDATE ${main_table} SET rank_now = ? WHERE id = ?`
				let [rows] = await connection.query(qry, [rank, req.params.id]);

				//history 작성
				qry = `INSERT INTO history_${main_table}(main_id, rank, date, main_id_date) 
						VALUES(?, ?, current_date(), CONCAT(?, "_", current_date()))
						ON DUPLICATE key
						UPDATE rank = ?`
				let result = await connection.query(qry, [req.params.id, rank, req.params.id, rank]);
				connection.release();
				return {rank : rank}
			} catch(err) {
				connection.release();
				throw err
			}
		} catch(err) {
			throw err
		}
	}

	getInfo().then((info) => {
		keyword = info[0].keyword;
		target_url = info[0].target_url;
		return getRank(keyword, target_url);
	}).then((rank) => {
		return updateRank(rank);
	}).then((result) => {
		return res.status(200).json({success : 1, result : result})
	}).catch(err => {
		console.log(err.message)
		return res.status(400).json({success : 0, msg : err.message})
	})
})

router.get('/history/:id', (req, res) => {
	const main_table = req.table_name
	const getHistory = async () => {
		try {
			const connection = await pool.getConnection(async conn => conn);
			try {
				let qry = `SELECT * FROM history_${main_table} WHERE main_id=? ORDER BY id DESC`
				let [rows] = await connection.query(qry, [req.params.id]);
				connection.release();
				return rows
			} catch(err) {
				connection.release();
				throw err
			}
		} catch(err) {
			throw err
		}
	}

	getHistory().then((result) => {
		return res.status(200).json({success : 1, result : result})
	})
	.catch(err => {
		console.log(err.message)
		return res.status(400).json({success : 0, msg : err.message})
	})
})

module.exports = router
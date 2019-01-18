module.exports = function(app, pool, main_table){
	var express = require('express');
	var router = express.Router();
	let {PythonShell} = require('python-shell');
	var url = require('url')

	function fixTargetUrl(target_url){
		var parsed_object  = url.parse(target_url)
		var query_object = {}

		var query_list = parsed_object.query.split('&');
		for(var query of query_list){
			splited = query.split('=')
			key = splited[0];
			value = splited[1];
			query_object[key] = value;
		}
		var fixed_url = parsed_object.hostname + parsed_object.pathname + '?' + "d1id=" + query_object['d1id'] + "&dirId=" + query_object['dirId']+ "&docId=" + query_object["docId"]
		return fixed_url
	}

	function executePy(script_name, options){
		return new Promise((resolve, reject) => {
			PythonShell.run(script_name, options, function (err, results){
				if (err){
					console.log(err)
					reject(err);
				}
				else{
					var rank = results[0];
					console.log(results);
					resolve(rank);
				}
			});
		})
	}

	//블로그 다 가져오기
	router.get('/', (req, res) => {
		const getAllBlogs = async () => {
			try {
				var connection = await pool.getConnection(async conn => conn);
				try {
					var qry = `SELECT * FROM ${main_table} ORDER BY id DESC`
					const [rows] = await connection.query(qry);
					connection.release();
					return {
						success : 1,
						result : rows
					};
				} catch(err) {
					console.log('Query Error');
					connection.release();
					return {
						success : 0,
						result : err
					};
				}
			} catch(err) {
				console.log('DB Error');
				console.log(err);
				return {
					success : 0,
					result : err
				};
			}
		}

		getAllBlogs().then((result) => {
			if(result.success == 1){
				return res.status(200).json(result)
			}
			else{
				return res.status(400).json(result);
			}
		})
	})

	//블로그 등록
	router.post('/', (req, res) => {
		const postBlog = async () => {
			try {
				const connection = await pool.getConnection(async conn => conn);
				try {
					if(main_table == "nv_kin")
						req.body.target_url = fixTargetUrl(req.body.target_url);

					var data = [req.body.keyword, req.body.target_url];
					var qry = `INSERT INTO ${main_table}(keyword, target_url, date) VALUES(?, ?, NOW())`
					const [rows] = await connection.query(qry, data);
					connection.release();
					return {
						success : 1,
						result : rows
					};
				} catch(err) {
					console.log('Query Error');
					console.log(err);
					connection.release();
					return {
						success : 0,
						result : err
					};
				}

			} catch(err) {
				console.log('DB Error');
				return {
					success : 0,
					result : err
				};
			}
		};

		postBlog().then((result) => {
			if(result.success == 1){
				return res.status(201).json(result)
			}
			else{
				return res.status(400).json(result);
			}
		})
	})
	//블로그 선택삭제
	router.delete('/', (req, res) => {
		const delSelectedBlogs = async () => {
			try {
				const connection = await pool.getConnection(async conn => conn);
				try {
					var del_list = req.body.del_list.join(',');
					var qry = `DELETE FROM ${main_table} where id in (${del_list})`
					const [rows] = await connection.query(qry);
					connection.release();
					return {success : 1};
				} catch(err) {
					console.log('Query Error');
					connection.release();
					return {success : 0};
				}
			} catch(err) {
				console.log('DB Error');
				return {success : 0};
			}
		}
		delSelectedBlogs().then((result) => {
			if(result.success == 1)
				return res.status(200).json(result);
			else
				return res.status(400).json(result);
		})
	})

	//블로그 삭제
	router.delete('/:id', (req, res) => {
		const delBlog = async () => {
			try {
				const connection = await pool.getConnection(async conn => conn);
				try {
					var data = [req.params.id];
					var qry = `DELETE FROM ${main_table} where id = ?`
					const [rows] = await connection.query(qry, data);
					connection.release();
					return rows;
				} catch(err) {
					console.log('Query Error');
					connection.release();
					return err;
				}

			} catch(err) {
				console.log('DB Error');
				return err;
			}
		}
		del().then((result) => {
			return res.status(200).json({success:1, result : result});
		})
	})

	//랭크측정&변경
	router.put('/rank/:id', (req, res) => {
		const getInfo = async () => {
			try {
				const connection = await pool.getConnection(async conn => conn);
				try {
					const [rows] = await connection.query(`SELECT * FROM ${main_table} WHERE id = ?`, [req.params.id]);
					connection.release();
					return {
						success : 1,
						result : rows
					}
				} catch(err) {
					console.log('Query Error');
					connection.release();
					return {
						success : 0,
						result : err
					}
				}
			} catch(err) {
				console.log('DB Error');
				return {
					success : 0,
					result: err
				}
			}
		};

		const getRank = (keyword, target_url) => {
			if(main_table == 'nv_blog')
				var searching_type=1
			else if(main_table == 'nv_cafe')
				var searching_type=2
			else if(main_table == 'nv_kin')
				var searching_type=3

			//pc -> python wtp_crawler.py
			if(searching_type <= 3){
				var options = {
					mode : 'text',
					pythonOptions: ['-u'],
					args: [keyword, target_url, searching_type]
				};
				return executePy('wtp_crawler.py', options)
			}
			else{
				var options = {
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
					var qry = `UPDATE ${main_table} SET rank_now = ? WHERE id = ?`
					const [rows] = await connection.query(qry, [rank, req.params.id]);

					//history 작성
					var qry = `INSERT INTO history_${main_table}(main_id, rank, date, main_id_date) 
								VALUES(?, ?, current_date(), CONCAT(?, "_", current_date()))
								ON DUPLICATE key
								UPDATE rank = ?`
					var result = await connection.query(qry, [req.params.id, rank, req.params.id, rank]);
					connection.release();
					return {
						success : 1,
						result : {rank : rank}
					}
				} catch(err) {
					console.log(err)
					console.log('Query Error');
					connection.release();
					return {
						success : 0,
						result : err
					}
				}
			} catch(err) {
				console.log('DB Error');
				return{
					success : 0,
					result: err
				}
			}
		}

		getInfo().then((info) => {
			if(info.success == 1){
				keyword = info.result[0].keyword;
				target_url = info.result[0].target_url;
				return getRank(keyword, target_url);
			}
			throw new Error('got errs in db');
		}).then((rank) => {
			return updateRank(rank);
		}).then((result) => {
			if(result.success == 1)
				return res.status(200).json(result)
		}).catch((e)=>{
			return res.status(400).json(e)
		})
	})

	router.get('/history/:id', (req, res) => {
		const getHistory = async () => {
			try {
				var connection = await pool.getConnection(async conn => conn);
				try {
					var qry = `SELECT * FROM history_${main_table} WHERE main_id=? ORDER BY id DESC`
					const [rows] = await connection.query(qry, [req.params.id]);
					connection.release();
					return {
						success : 1,
						result : rows
					};
				} catch(err) {
					console.log('Query Error');
					connection.release();
					return {
						success : 0,
						result : err
					};
				}
			} catch(err) {
				console.log('DB Error');
				console.log(err);
				return {
					success : 0,
					result : err
				};
			}
		}

		getHistory().then((result) => {
			if (result.success == 1) {
				res.status(200).json(result);
			}
		})
	})

	return router
}
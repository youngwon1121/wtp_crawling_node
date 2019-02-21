const router = require('express').Router();
let {PythonShell} = require('python-shell');
const url = require('url')
const models = require('../models')

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

router.route('/')
	//블로그 다 가져오기
	.get((req, res) => {
		req.db.model.findAll({
			where : {owner : req.decoded.username},
			order : [
				['id' , 'desc']
			]
		})
		.then(results => {
			return res.status(200).json({result : results})
		})
		.catch(err => {
			console.log(err.message);
			return res.status(500).end()
		})
	})

	//블로그 등록
	.post((req, res) => {
		let keyword = req.body.keyword
		let target_url = req.body.target_url
		let owner = req.decoded.username

		if(!keyword || !target_url || !owner)
			return res.status(400).end()

		if(req.originalUrl.split('/')[2] == 'kin'){
			target_url = fixTargetUrl(target_url)
		}
		req.db.model.create({
			keyword : keyword,
			target_url : target_url,
			owner : owner
		})
		.then(result => {
			return res.status(201).json({result : result})	
		})
		.catch(err => {
			console.log(err.message);
			return res.status(500).end()
		})
	})

	//블로그 선택삭제
	.delete((req, res) => {
		let del_list = req.body.del_list
        if(!del_list instanceof Array || !del_list.length)
			return res.status(400).end()
			
		req.db.model.destroy({
			where : {id : del_list}
		})
		.then(result => {
			return res.status(200).json({result : result})
		})
		.catch(err => {
			console.log(err.message);
			return res.status(500).end()
		})
	})

router.route('/rank/:id')
	//랭크측정&변경
	.put((req, res) => {
		const getRank = (keyword, target_url) => {
			let searching_type = req.db.type
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

		//transaction function
		const updateRank = function(rank){
			return models.sequelize.transaction().then(function(t){
				return req.db.model.update({
					rank_now : rank
				},{
					where : {id : req.params.id}
				},{transaction: t})
				.then(result => {
					return req.db.history_model.findOne({
						where : {main_id : req.params.id, date : models.sequelize.fn('CURDATE')},
						transaction : t
					})
				}).then(result => {
					if(!!result){
						console.log('do the update!!!!!!')
						return result.update({rank : rank},{transaction : t})
					}
					else{
						console.log('do the create!!!!!')
						return req.db.history_model.create({
							rank : rank,
							main_id : req.params.id
						},{transaction : t})
					}
				}).then(result => {
					t.commit();
				}).catch(err => {
					console.log(err)
					t.rollback();
				})
			})
		}

		let rank_now;
		req.db.model.findOne({
			where : {id : req.params.id}
		}).then(result => {
			keyword = result.keyword
			target_url = result.target_url
			return getRank(keyword, target_url)
		}).then(rank => {
			rank_now = rank
			return updateRank(rank)
		}).then(result => {
			return res.status(200).json({result : rank_now})
		}).catch(err => {
			console.log(err.message)
			return res.status(500).end()
		})
	})

router.route('/history/:id')
	//fetching history rank
	.get((req, res) => {
		req.db.history_model.findAll({
			where : {main_id : req.params.id}
		})
		.then(result => {
			return res.status(200).json({result : result})
		})
		.catch(err => {
			console.log(err.message)
			return res.status(500).end()
		})
	})

module.exports = router
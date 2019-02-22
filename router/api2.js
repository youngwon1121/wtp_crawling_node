const router = require('express').Router();
let {PythonShell} = require('python-shell');
const models = require('../models')

function executePy(script_name, options){
	return new Promise((resolve, reject) => {
		PythonShell.run(script_name, options, function (err, results){
			if (err){
				console.log(err.message)
				reject(err);
			}
			else{
				let rank = results;
				resolve(rank);
			}
		});
	})
}

router
    .get('/', (req, res) => {
        let owner = req.decoded.username
        models.cafe_cmt.findAll({
            where : {owner :  owner},
            order : [
                ['company', 'desc']
            ]
        }).then(results => {
            return res.status(200).json({result : results})
        }).catch(err => {
            return res.status(500).end()
        })
    })
    .post('/', (req, res) => {
        let company = req.body.company
        let target_url = req.body.target_url
        let owner = req.decoded.username

        //check validation of variables
        if(!company || !target_url || !owner)
            return res.status(400).end()

        models.cafe_cmt.create({
            company : company,
            target_url : target_url,
            owner : owner
        }).then(result => {
            return res.status(201).send('created')
        }).catch(result => {
            return res.status(500).end()
        })
    })

    .delete('/', (req, res) => {
        let del_list = req.body.del_list
        if(!del_list instanceof Array || !del_list.length)
            return res.status(400).end()

        models.cafe_cmt.destroy({
            where : {id : del_list}
        })
        .then(result => {
            return res.status(200).json({result : result})
        })
        .catch(err => {
            console.log(err.message)
            return res.status(500).end()
        })
    })

router
    .get('/:id', (req, res) => {
        models.cafe_cmt.findOne({
            where : {id : req.params.id}
        }).then(result => {
            if(!result)
                return res.status(404).end()
            return res.status(200).json({result:result})
        })
    })

router
    .put('/rank', (req, res) => {

        const updateAll = function(cmtData, callback){
            return new Promise((resolve, reject) => {
                let cnt = 0;
                cmtData.forEach((item) => {
                    let script_name = 'cafe_comment_crawler.py'
                    let options = {
                        mode : 'text',
                        pythonOptions : ['-u'],
                        args : [item.target_url]
                    }
                    executePy(script_name, options).then(result => {
                        let comment = result.join('\n')
                        return models.cafe_cmt.update({comment : comment},{
                            where : {id : item.id}
                        })
                    }).then(result => {
                        cnt++
                        if(cmtData.length === cnt){
                            resolve(cnt)
                        }
                    })
                    .catch(err => {
                        reject(err)
                    })
                })
            })         
        }

        models.cafe_cmt.findAll({}).then(results => {
            return updateAll(results)
        })
        .then(result => {
            console.log(result);
            return res.status(200).send('success');
        })
        .catch(err => {
            return res.status(500).send('internal error')
        })
    })

router
    .put('/rank/:id', (req, res) => {
        let selectedRow
        models.cafe_cmt.findOne({
            where : {id : req.params.id}
        }).then(result => {
            if(!result)
                return res.status(404).send()
            selectedRow = result
            let script_name = 'cafe_comment_crawler.py'
            let options = {
                mode : 'text',
                pythonOptions: ['-u'],
                args: [result.target_url]
            }
            return executePy(script_name, options)
        }).then(result => {
            let comment = result.join('\n')
            return selectedRow.update({comment : comment},{
                where : {id : req.params.id},
            })
        }).then(result => {
            return res.status(200).json(selectedRow);
        }).catch(err => {
            return res.status(500).json(err.message)
        })
    })

module.exports = router
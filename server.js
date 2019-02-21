const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const models = require('./models')
const auth_router = require('./router/auth.js')
const api1_router = require('./router/api1.js')
const api2_router = require('./router/api2.js')

const api1_validate_middleware = require('./middlewares/nv_crawler_validator.js')
const api2_validate_middleware = require('./middlewares/cafe_cmt_validator')

//[CONFIGURE APP TO USE bodyparser]
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

//validating middleware
app.use('/api', api1_validate_middleware)
app.use('/api2', api2_validate_middleware)

//auth api
app.use('/auth', auth_router)

//main router
app.use('/api/cafe', api1_router);
app.use('/api/blog', api1_router);
app.use('/api/kin', api1_router);
app.use('/api/mview', api1_router);

app.use('/api2/cafe', api2_router);

models.sequelize.sync().then(function(){
	app.listen(3000, function(){
		console.log("Express Server has started on port 3000")	
	})
})
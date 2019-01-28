const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

//[CONFIGURE APP TO USE bodyparser]
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cors())
app.use(morgan('dev'))

//validating middleware
const validate_middleware = require('./middlewares/validate.js')
app.use('/api', validate_middleware)

//auth api
const auth_router = require('./router/auth.js')
app.use('/auth', auth_router)

//main router
const main_router = require('./router/main.js');
app.use('/api/cafe', main_router);
app.use('/api/blogs', main_router);
app.use('/api/kin', main_router);
app.use('/api/mview', main_router);

const server = app.listen(3000, function(){
	console.log("Express Server has started on port 3000")	
})
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
var validate_middleware = require('./middlewares/validate.js')
app.use('/api', validate_middleware)

//auth api
var auth_router = require('./router/auth.js')
app.use('/auth', auth_router)

var cafe_router = require('./router/main.js');
app.use('/api/cafe', cafe_router);

var blog_router = require('./router/main.js');
app.use('/api/blogs', blog_router);

var kin_router = require('./router/main.js');
app.use('/api/kin', kin_router);

var m_view_router = require('./router/main.js');
app.use('/api/mview', m_view_router);

var server = app.listen(3000, function(){
	console.log("Express Server has started on port 3000")	
})
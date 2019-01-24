var express = require('express');
var app = express();
var mysql = require('mysql2/promise');
var dbconfig = require('./config/database.js');
const bodyParser = require('body-parser');
var cors = require('cors')




//[CONFIGURE APP TO USE bodyparser]
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());

var pool = mysql.createPool(dbconfig);

//validating middleware
var validate_middleware = require('./middlewares/validate.js')
app.use('/api',validate_middleware)

//auth api
var auth_router = require('./router/auth.js')(app, pool)
app.use('/auth', auth_router)

var cafe_router = require('./router/main.js')(app, pool, 'nv_cafe');
app.use('/api/cafe', cafe_router);

var blog_router = require('./router/main.js')(app, pool, 'nv_blog');
app.use('/api/blogs', blog_router);

var kin_router = require('./router/main.js')(app, pool, 'nv_kin');
app.use('/api/kin', kin_router);

var m_view_router = require('./router/main.js')(app, pool, 'nv_m_view');
app.use('/api/mview', m_view_router);

var server = app.listen(3000, function(){
	console.log("Express Server has started on port 3000")	
})
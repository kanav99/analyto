// Modules Import
var express = require('express');
var bodyParser = require('body-parser');
var firebase = require('firebase-admin');
var cors = require('cors');
var fs = require('fs');
var cookieParser = require('cookie-parser')

// Express Middlewares and Options
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));
app.options('/log', cors());
app.set('view engine', 'ejs');
app.use(cookieParser());

//Configuration Object
var config = require("./config.json")

// Firebase Initialisation
var firebase_key = require("./firebase-key.json");
firebase.initializeApp({
  credential: firebase.credential.cert(firebase_key),
  databaseURL: "https://" + config.firebase_project + ".firebaseio.com"
});

// Function to generate a random id for a new user
function random_id() {
	return ('' + Math.floor((Math.random() * 100000) + 1));
}

// Function to check if the user exists in database 
function exists(user) {
	var flag_e =false;
	firebase.database().ref('users/' + user).once('value', function(snap) {
		if(snap.exists()){
			flag_e = true;
		}
	});
	return flag_e;
}

// Handling the revisit of a user and updating the data
function revisit (user, data, ip) {
	firebase.database().ref('users').child(user).child('visits').transaction(function (visits) {
		visits++;
		return visits;
	});
	firebase.database().ref('users').child(user).child('last_visit').set(Date.now());
	firebase.database().ref('users').child(user).child('last_ip').set(ip);
}

// Function to add a new user to the database 
function newuser(data) {
	var x = 1;
	var id = random_id();
	while(exists(id)) {
		id = random_id();
	}
	data.visits = 1;
	data.last_visit = Date.now();
	firebase.database().ref('users/' + id).set(data);
	return id;
}

// Get the ip-address of the client from the request object `req`
function get_ip(req) {
	var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    return ip;
}

// Piece of code to calculate the non -required length (protocol and domain name) of a path
var href_initial_length = (config.https ? config.website_hostname.length + 9 : config.website_hostname.length + 8);
// Function to escape the invalid characters in href `page`
function process_page_path(page){
	var str = page.slice(href_initial_length);
	str = str.split('/').join('=>');
	if(str === '')
		return 'root';
	else
		return str;
}

// Function to increment the number of views of the page of href `page`
function pageCountIncrement(page) {
	var flag_p = false;
	str = process_page_path(page);
	firebase.database().ref('page_wise_visits/' + str).once('value', function(snap) {
		if(snap.exists()){
			flag_p = true;
		}
		if(flag_p) {
			firebase.database().ref('page_wise_visits/' + str).transaction(function(count) { return ++count; });
		}
		else {
			firebase.database().ref('page_wise_visits/' + str).set(1);
		}
	});
}

// Router for the path were ajax request is made by the page
app.post('/log', cors(), function (req, res) {
	result = {};
	if(req.body.host !== config.website_hostname)
		return;
	pageCountIncrement(req.body.page);
	delete req.body.page;
	if(req.body.user === "" || req.body.user === undefined) {
		result.flag = false;
		delete req.body.user;
		delete req.body.host;
		req.body.last_ip = get_ip(req);
		result.new_id = newuser(req.body);
		res.send(JSON.stringify(result));
	}
	else {
		firebase.database().ref('users/' + req.body.user).once('value', function(snap) {
			var flag_p = false;
			if(snap.exists()){
				flag_p = true;
			}
			if(flag_p) {
				result.flag = true;
				revisit(snap.key,req.body,get_ip(req));
			}
			else {
				result.flag = false;
				delete req.body.user;
				delete req.body.host;
				req.body.last_ip = get_ip(req);
				result.new_id = newuser(req.body);
			}
			res.send(JSON.stringify(result));
		});
	}
});

// Public javascript file which needs to be included in the template of the website
app.get('/client.js', function(req,res) {
	res.sendFile( __dirname + "/client.js");
})

// Admin homepage to get the website statistics
// Login page
app.get('/', function(req, res) {
	if(req.cookies.admin_user !== undefined && req.cookies.admin_user !== '' && req.cookies.admin_pass !== undefined && req.cookies.admin_pass !== '') {
		if(config.analyto_admins[req.cookies.admin_user].hash === req.cookies.admin_pass)
			res.redirect('/stats');
	}
	res.render('login', {});
})

// Page which shows the statistics to authenticated users
app.get('/stats', function(req, res) {
	if(req.cookies.admin_user === undefined || req.cookies.admin_user === '') 
		res.redirect('/');
	if(config.analyto_admins[req.cookies.admin_user].hash !== req.cookies.admin_pass)
		res.redirect('/');
	var unique_visitors = 0;
	var views = 0;
	firebase.database().ref('users/').once('value', function(snap) {
		snap.forEach(function (child) {
			unique_visitors++;
			views += child.val().visits;
		});
		res.render('index', { unique_visitors, views });
	});
});

// Route to post the login credentials
app.post('/login', function(req, res) {
	if(config.analyto_admins[req.body.username] !== undefined) {
		if(config.analyto_admins[req.body.username].pass === req.body.password) {
			// Login Success
			res.cookie('admin_user', req.body.username);
			res.cookie('admin_pass', config.analyto_admins[req.body.username].hash);
			res.redirect("/stats");
		}
		else {
			// Incorrect password
			res.redirect('/?err=1')
		}
	}
	else {
		// No such admin
		res.redirect('/?err=2');
	}
});

// Logout the admin portal
app.get('/logout', function(req, res) {
	res.clearCookie('admin_user');
	res.clearCookie('admin_pass');
	res.redirect('/');
});

// Server listener
app.listen(process.env.PORT || 8081);
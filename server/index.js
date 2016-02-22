var browserify = require('browserify-middleware')
var express = require('express')
var Path = require('path')
var Reactify = require('reactify')

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash    = require('connect-flash');

require('./server/passport')(passport); // pass passport for configuration

var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
var session = require('express-session')
// var morgan = require('morgan');

var User = require(__models + '/user');

var routes = express.Router()


/* --- Added Reactify require and "...transform: [Reactify]" ---  */
routes.get('/app-bundle.js',
  browserify('./client/app.js', {
    transform: [Reactify]
  }))

/* Example endpoint (also tested in test/server/index_test.js) */
routes.get('/api/tags-example', function(req, res) {
  res.send(['node', 'express', 'browserify', 'react', 'react-dom'])
})

/* Static assets (html, etc.) */
var assetFolder = Path.resolve(__dirname, '../client/public')
routes.use(express.static(assetFolder))


if (process.env.NODE_ENV !== 'test') {
  // We're in development or production mode
  var app = express()

  // use Morgan to log concise and colorful http information
  app.use( require('morgan')('dev') )
  // Parse incoming request bodies as JSON
  app.use( require('body-parser').json() )
    app.use(bodyParser.urlencoded({ extended: true }));
  // read cookies (needed for auth)
  app.use(cookieParser()); 

  // required for passport
  app.use(session({ secret: 'secretword' })); // session secret
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session

  // Mount our main router, 'routes' to the root path
  // of our app. This delegates almost all routing to 'routes'
  app.use('/', routes)

  // use our apis!

/*
  Signin and signup routes handled by Passport
*/
  app.get('/signup', function (request, response) {
    //implement signup render
  })

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/trip', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  app.get('/login', function (request, response) {
    //implement login render
  })

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/trip', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

/*
  These handle requests directed to different models.

  They are commented because they require a running development
  database. When you're ready to use sample data and the database
  we can talk about how to do it. Just a few extra things to do.
*/

//First attempt at passport integration, need to adapt for postgreSQL environment
  var tripRouter = require('./apis/trip-api');
  var taskRouter = require('./apis/task-api');

  routes.use('/trip', tripRouter);
  routes.use('/task', taskRouter);


  //
  // The Catch-all Route
  // This is for supporting browser history pushstate.
  // NOTE: Make sure this route is always LAST.
  //
  routes.get('/*', function(req, res){
    console.log('catch-all route triggered');
    res.sendFile( assetFolder + '/index.html' )
  })

  // Start the server!
  var port = process.env.PORT || 4000
  app.listen(port)
  console.log("Listening on port", port)
}
else {
  // We're in test mode; make this file importable instead.
  module.exports = routes
}

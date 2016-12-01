const port       = 'PORT' in process.env ? process.env.PORT : 3000;
const express    = require('express');
const bodyParser = require('body-parser');
const passport   = require('passport');
const bcrypt     = require('bcrypt-nodejs');
const fs         = require('fs');
var app          = express();
var server       = require('http').createServer(app);
var io           = require('socket.io')(server);
var users;

app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(require('cookie-session')({ secret: 'secretkey' }));

users = JSON.parse(fs.readFileSync('database.json', 'utf8')).users;
console.log('database: ok');

require('./config/passport.js')(passport, users, bcrypt);
app.use(passport.initialize());
app.use(passport.session());
app.use(require('connect-flash')());
require('./app/routes.js')(app, passport);
server.listen(port);
console.log('listening on port: ' + port);

io.on('connection', function (socket) {
    console.log('Client connected: ' + socket.id);
    socket.emit('newSocket', 'Your Client ID: ' + socket.id);
    socket.broadcast.emit('newSocket', 'Client connected: ' + socket.id);

    socket.on('disconnect', function () {
        console.log('Client disconnected: ' + socket.id);
        socket.broadcast.emit('newSocket', 'Client disconnected: ' + socket.id);
    });
});

var admins = io.of('/admins');

admins.on('connection', function (socket) {
    console.log('Admin connected: ' + socket.id);
    socket.emit('newSocketAdmin', 'Your Admin ID: ' + socket.id);
    socket.broadcast.emit('newSocketAdmin', 'Admin connected: ' + socket.id);
    io.emit('newSocket', 'An admin is here');
    socket.emit('usersAdmin', staffAdmin());

    socket.on('disconnect', function () {
        console.log('Admin disconnected: ' + socket.id);
        socket.broadcast.emit('newSocketAdmin', 'Admin disconnected: ' + socket.id);
    });
    socket.on('createUserAdmin', function (_username, _password) {
        users[_username] = bcrypt.hashSync(_password, bcrypt.genSaltSync(8), null);
        admins.emit('usersAdmin', staffAdmin());
        setDatabase();
    });
    socket.on('deleteUserAdmin', function (_username) {
        delete users[_username];
        admins.emit('usersAdmin', staffAdmin());
        setDatabase();
    });
});

function staffAdmin() {
    let usersList = [];
    for (let username in users)
        usersList.push(username);
    return usersList;
}

function setDatabase() {
    fs.writeFileSync('database.json', JSON.stringify({ users: users }, null, 4), 'utf8');
}

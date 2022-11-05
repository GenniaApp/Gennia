const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const socketio = require('socket.io');
require('dotenv').config();

const { MSG_TYPES } = require('../shared/constants');
const Game = require('./game');
const webpackConfig = require('../../webpack.dev.js');

// Setup an Express server
const app = express();
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
    // Setup Webpack for development
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler));
} else {
    // Static serve the dist/ folder in production
    app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.info(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);

// Listen for socket.io connections
io.on('connection', socket => {
    console.log('connection', this);
    console.info(`Player connect | ${socket.id}`);
    socket.on(MSG_TYPES.JOIN_GAME, joinGame);
    socket.on(MSG_TYPES.INPUT, handleInput);
    socket.on('disconnect', onDisconnect);
});

// Setup the Game
const game = new Game();

function joinGame(username) {
    console.log('join', this);
    // this === socket
    console.info(`Add player | ${this.id}| ${username}`);
    game.tryToAddPlayer.push([this, username]);
}

function handleInput(command) {
    console.info(`Get command | ${this.id}`);
    game.handleInput(this, command);
}

function onDisconnect() {
    console.info(`Remove player | ${this.id}`);
    game.tryToRemovePlayer.push(this);
}
/*
 * 
 * Gennia Front-End Renderer
 * Copyright (c) 2022 Reqwey Lin (https://github.com/Reqwey)
 * 
 */

function keyLogin() {
	if (window.event.keyCode === 13) login();
}
function login() {
	let username = $('#username').val();
	window.electron.userLogin(username)
}
function toggleWindowExpand() {
	$('#expandControl').css('display', 'none');
	$('#restoreControl').css('display', 'inline-block');
	window.electron.windowMax()
}
function toggleWindowRestore() {
	$('#expandControl').css('display', 'inline-block');
	$('#restoreControl').css('display', 'none');
	window.electron.windowMax()
}
function keyGameJoin() {
	if (window.event.keyCode === 13) gameJoin();
}
function changeSetting(gameConfig) {
	$('#gameSpeed').slider('set value', gameConfig.gameSpeed, false)
	$('#map_width').slider('set value', gameConfig.mapWidth, false)
	$('#map_widthVal').text(gameConfig.mapWidth)
	$('#map_height').slider('set value', gameConfig.mapHeight, false)
	$('#map_heightVal').text(gameConfig.mapHeight)
	$('#mountain').slider('set value', gameConfig.mountain, false)
	$('#mountainVal').text(gameConfig.mountain)
	$('#city').slider('set value', gameConfig.city, false)
	$('#cityVal').text(gameConfig.city)
	$('#swamp').slider('set value', gameConfig.swamp, false)
	$('#swampVal').text(gameConfig.swamp)
	$('#max_player_num').slider('set value', gameConfig.maxPlayers, false)
}
function withinMap(point) {
	return 0 <= point.x && point.x < window.mapWidth && 0 <= point.y && point.y < window.mapHeight;
}
function handleClick(i, j) {
	console.log(`(${i}, ${j}) was clicked`)
	let $td = $(`#td${i}-${j}`)
	if ($td.hasClass(`color${window.playerColor}`)) {
		if (window.selectedTd) {
			if (window.selectedTd.x === i && window.selectedTd.y === j) {
				if (window.selectedTd.half) {
					window.selectedTd.half = false
					$(`#td${window.selectedTd.x}-${window.selectedTd.y}`).html(window.selectedTd.unit)
				} else {
					window.selectedTd.half = true
					window.selectedTd.unit = $td.html()
					$td.html(`50%`)
				}
			} else {
				$(`#td${window.selectedTd.x}-${window.selectedTd.y}`).removeClass(`selected`)
				$td.addClass(`selected`)
				window.selectedTd = { x: i, y: j, half: false }
			}
		} else {
			$td.addClass(`selected`)
			window.selectedTd = { x: i, y: j, half: false }
		}
	}
}
function gameJoin(username) {
	$('#submitGameJoin').attr('class', 'ui econdary elastic fluid loading button');
	let url = $('#serverUrl').val()
	let socket = io('ws://' + url, {
		'connect timeout': 5000,
		'flash policy port': 10843
	});

	socket.on('reject_join', (title, message) => {
		$.toast({
			position: 'left top',
			class: 'error',
			title: title,
			displayTime: 0,
			message: message,
			actions: [{
				text: 'OK',
				class: 'white',
				click: function () {
					window.location.href = 'index.html';
				}
			}]
		})
	})

	socket.on('connect_error', (error) => {
		console.log('\nConnection Failed: ' + error);
		$('#submitGameJoin').attr('class', 'ui disabled fluid red button');
		$('#submitGameJoin').text('Game Join Failed.')
		socket.emit('leave_game')
		socket.close()
	});

	socket.on('disconnect', () => {
		console.log('Disconnected from server.');
	});

	socket.on('reconnect', () => {
		console.log('Reconnected to server.');
		if (window.gameStarted) {
			socket.emit('reconnect', window.playerId)
		} else {
			socket.emit('set_username', window.username)
			socket.emit('get_game_settings')
		}
	});

	socket.on('connect', () => {
		console.log('\nConnected to server.');
		$('#submitGameJoin').attr('class', 'ui disabled fluid positive button');
		$('#submitGameJoin').text('Connected to server.')

		// set up the room ui
		$('.reqtitle').html(`<h3 style="display: inline-block; margin-top: 5px; margin-left: 10px; margin-right: 5px;"><a
		class="ui mini button" style="display: inline-block" href='./index.html'><svg class="reqreturnicon"
			style="display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;"
			xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
			<path
				d="M570.24 247.41L512 199.52V104a8 8 0 0 0-8-8h-32a8 8 0 0 0-7.95 7.88v56.22L323.87 45a56.06 56.06 0 0 0-71.74 0L5.76 247.41a16 16 0 0 0-2 22.54L14 282.25a16 16 0 0 0 22.53 2L64 261.69V448a32.09 32.09 0 0 0 32 32h128a32.09 32.09 0 0 0 32-32V344h64v104a32.09 32.09 0 0 0 32 32h128a32.07 32.07 0 0 0 32-31.76V261.67l27.53 22.62a16 16 0 0 0 22.53-2L572.29 270a16 16 0 0 0-2.05-22.59zM463.85 432H368V328a32.09 32.09 0 0 0-32-32h-96a32.09 32.09 0 0 0-32 32v104h-96V222.27L288 77.65l176 144.56z" />
		</svg></a> Gaming Room - Gennia`)
		$('#reqAppContainer').html(`
		<h1 class="fadeInDown" style="font-size:2.4rem!important">Welcome to <p style="display: inline" class="req"
				id="username">Gennia</p> Room
		</h1>
		<h3 class="fadeInDown" style="color: #818181!important">Share this url to your friends so that they can join
			in:<code>${url}</code></h3>

		<div class="ui top attached block header title" style="color: #d12d9c;"><svg
				style="display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;margin-right:.75rem"
				xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
				<path
					d="M224 96.1v48.8l29.7 29.7c-6.8-34.8 3.5-70.3 28.5-95.3 20.3-20.3 47.2-31.2 75-31.2h1.2L301 105.3l15.1 90.6 90.6 15.1 57.3-57.3c.3 28.3-10.6 55.5-31.2 76.1-9.3 9.3-20.2 16.4-31.8 21.6 1.8 1.6 3.9 2.9 5.6 4.6l30.7 30.7c10.5-6.3 20.5-13.9 29.4-22.9 38.1-38.1 53.7-94.3 40.7-146.6C504.4 105 495 95.4 483 92c-12.2-3.4-25.2.1-34 9l-58.7 58.6-32.4-5.4-5.4-32.4 58.6-58.6c8.9-8.9 12.3-21.9 8.9-34-3.3-12.1-13-21.5-25.2-24.5-53.2-13.2-107.9 2-146.6 40.6C238 55.5 229.7 67 222.9 79.2l1.1.8v16.1zM106 454c-12.8 12.8-35.3 12.8-48.1 0-6.4-6.4-10-15-10-24 0-9.1 3.5-17.6 10-24l134.4-134.4-33.9-33.9L24 372C8.5 387.5 0 408.1 0 430s8.5 42.5 24 58 36.1 24 58 24 42.5-8.5 58-24l100.9-100.9c-9.7-15.8-15.2-33.8-15.7-52.1L106 454zm395.1-58.3L384 278.6c-23.1-23.1-57.6-27.6-85.4-13.9L192 158.1V96L64 0 0 64l96 128h62.1l106.6 106.6c-13.6 27.8-9.2 62.3 13.9 85.4l117.1 117.1c14.6 14.6 38.2 14.6 52.7 0l52.7-52.7c14.5-14.6 14.5-38.2 0-52.7z" />
			</svg>Settings
		</div>
		<div class="ui bottom attached segment">
			<div class="ui grid">
				<div class="four wide column">
					<div class="ui secondary vertical fluid menu">
						<div class="active item" data-tab="game-setting">Game</div>
						<div class="item" data-tab="map-setting">Map</div>
						<div class="item" data-tab="terrain-setting">Terrain</div>
						<div class="item" data-tab="player-setting">Players</div>
					</div>
				</div>
				<div class="twelve wide stretched column">
					<div class="ui tab" data-tab="game-setting">
						<!-- Tab Content !-->
						<div class="ui form">
							<div class="ui segment field">
								<label for="gameSpeed">Game Speed</label>
								<div name="gameSpeed" id="gameSpeed" class="ui bottom aligned pink labeled slider"></div>
							</div>
						</div>
					</div>
					<div class="ui tab" data-tab="map-setting">
						<!-- Tab Content !-->
						<div class="ui form">
							<div class="ui segment field">
								<label for="map_width">Width: <p style="display: inline" id="map_widthVal"></p></label>
								<div name="map_width" id="map_width" class="ui bottom aligned pink labeled slider"></div>
							</div>
							<div class="ui segment field">
								<label for="map_height">Height: <p style="display: inline" id="map_heightVal"></p></label>
								<div name="map_height" id="map_height" class="ui bottom aligned pink labeled slider"></div>
							</div>
						</div>
					</div>
					<div class="ui tab" data-tab="terrain-setting">
						<!-- Tab Content !-->
						<div class="ui form">
							<div class="ui segment field">
								<label for="mountain">Mountain: <p style="display: inline" id="mountainVal"></p></label>
								<div name="mountain" id="mountain" class="ui bottom aligned pink labeled slider"></div>
							</div>
							<div class="ui segment field">
								<label for="city">City: <p style="display: inline" id="cityVal"></p></label>
								<div name="city" id="city" class="ui bottom aligned pink labeled slider"></div>
							</div>
							<div class="ui segment field">
								<label for="swamp">Swamp: <p style="display: inline" id="swampVal"></p></label>
								<div name="swamp" id="swamp" class="ui bottom aligned pink labeled slider"></div>
							</div>
						</div>
					</div>
					<div class="ui tab" data-tab="player-setting">
						<!-- Tab Content !-->
						<div class="ui segment field">
							<label for="max_player_num">Max player num: <p style="display: inline" id="max_player_numVal"></p></label>
							<div name="max_player_num" id="max_player_num" class="ui bottom aligned pink labeled slider"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="ui top attached block header title" style="color: #5ea2ef;"><svg
				style="display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;margin-right:.75rem"
				xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
				<path
					d="M544 224c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80zm0-112c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32zM96 224c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80zm0-112c17.6 0 32 14.4 32 32s-14.4 32-32 32-32-14.4-32-32 14.4-32 32-32zm396.4 210.9c-27.5-40.8-80.7-56-127.8-41.7-14.2 4.3-29.1 6.7-44.7 6.7s-30.5-2.4-44.7-6.7c-47.1-14.3-100.3.8-127.8 41.7-12.4 18.4-19.6 40.5-19.6 64.3V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-44.8c.2-23.8-7-45.9-19.4-64.3zM464 432H176v-44.8c0-36.4 29.2-66.2 65.4-67.2 25.5 10.6 51.9 16 78.6 16 26.7 0 53.1-5.4 78.6-16 36.2 1 65.4 30.7 65.4 67.2V432zm92-176h-24c-17.3 0-33.4 5.3-46.8 14.3 13.4 10.1 25.2 22.2 34.4 36.2 3.9-1.4 8-2.5 12.3-2.5h24c19.8 0 36 16.2 36 36 0 13.2 10.8 24 24 24s24-10.8 24-24c.1-46.3-37.6-84-83.9-84zm-236 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm0-176c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64zM154.8 270.3c-13.4-9-29.5-14.3-46.8-14.3H84c-46.3 0-84 37.7-84 84 0 13.2 10.8 24 24 24s24-10.8 24-24c0-19.8 16.2-36 36-36h24c4.4 0 8.5 1.1 12.3 2.5 9.3-14 21.1-26.1 34.5-36.2z" />
			</svg>Players
		</div>
		<div class="ui bottom attached segment">
			<div class="ui horizontal list" id="playerTable">
			</div>
		</div>
		<button class="ui fluid huge submit button reqforcestartemitor" id="emitForceStart">Force Start(<p style="display: inline" id="forceStartNum">0</p>/<p style="display: inline" id="totalNum">0</p>)</button>`)
		$('#reqAppContainer').after(`<div class="reqmessageboard">
	<div class="ui segment" id="messageContent">
		<div class="header req"><svg
				style="display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;margin-right:.75rem"
				xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
				<path
					d="M512 160h-96V64c0-35.3-28.7-64-64-64H64C28.7 0 0 28.7 0 64v160c0 35.3 28.7 64 64 64h32v52c0 7.1 5.8 12 12 12 2.4 0 4.9-.7 7.1-2.4l76.9-43.5V384c0 35.3 28.7 64 64 64h96l108.9 61.6c2.2 1.6 4.7 2.4 7.1 2.4 6.2 0 12-4.9 12-12v-52h32c35.3 0 64-28.7 64-64V224c0-35.3-28.7-64-64-64zM96 240H64c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16h288c8.8 0 16 7.2 16 16v160c0 8.8-7.2 16-16 16H211.4l-11 6.2-56.4 31.9V240H96zm432 144c0 8.8-7.2 16-16 16h-80v38.1l-56.4-31.9-11-6.2H256c-8.8 0-16-7.2-16-16v-96h112c35.3 0 64-28.7 64-64v-16h96c8.8 0 16 7.2 16 16v160z" />
			</svg>Message Center</div>
		<div style="margin-top: 10px"></div>
	</div>
	<input class="reqmessagesender" type="text" id="messageSender" name="messageSender"
		placeholder="Click to chat (Enter to send)">
</div>`)


		$('.reqmessageboard').bind('click', function () {
			if ($(this).hasClass('expand')) $(this).removeClass('expand')
			else $(this).addClass('expand')
		})
		$('.reqmessagesender').bind('keydown', function (event) {
			if (event.keyCode === 13) {
				event.preventDefault()
				let message = $(this).val().split(' ').filter(x => x).join(' ')
				if (message.length) {
					socket.emit('player_message', message)
					$(this).val('')
				}
				else
					$.toast({ class: 'error', message: `Invalid input!` });
			}
		})
		$('.reqforcestartemitor').bind('click', function () {
			socket.emit('force_start')
			if ($(this).hasClass('req')) $(this).removeClass('req')
			else $(this).addClass('req')
		})
		$('.menu .item').tab()
		var labels = ['0.25x', '0.5x', '0.75x', '1x', '2x', '3x', '4x'];
		$('#gameSpeed').slider({
			min: 0,
			max: 6,
			labelType: 'letter',
			step: 1,
			interpretLabel: function (value) {
				return labels[value];
			},
			onChange: function (value) {
				socket.emit('change_game_speed', value);
			}
		})
		$('#max_player_num').slider({
			min: 1,
			max: 8,
			labelType: 'number',
			step: 1,
			onChange: function (value) {
				socket.emit('change_max_player_num', value);
			}
		})
		let str = new Array('map_width', 'map_height', 'mountain', 'city', 'swamp')
		for (let item of str) {
			$(`#${item}`).slider({
				min: 0,
				max: 1,
				decimalPlaces: 2,
				labelType: 'number',
				step: 0,
				interpretLabel: function (value) {
					return (new Array('small', 'large'))[value];
				},
				onChange: function (value) {
					$(`#${item}Val`).text(value)
					socket.emit(`change_${item}`, value);
				}
			})
		}

		socket.emit('get_game_settings')

		socket.on('push_game_settings', changeSetting)

		socket.on('set_player_id', (playerId) => {
			window.playerId = playerId
			console.log('Get player ID:', window.playerId)
		})

		socket.on('game_config_changed', changeSetting)

		socket.on('force_start_changed', (fsNum) => {
			$('#forceStartNum').text(fsNum)
		})

		socket.on('error', (title, message) => {
			$.toast({
				position: 'bottom attached',
				class: 'error',
				title: title,
				message: message
			})
			socket.emit('get_game_settings')
		})

		socket.on('players_changed', (players) => {
			$('#playerTable').empty()
			$('#totalNum').text(players.length)
			players.forEach(player => {
				let userPallete = player.username
				if (player.isRoomHost) userPallete = '<svg style="color: #FFA726; display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;margin-right:.5rem"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><defs><style>.fa-secondary{opacity:.4}</style></defs><path d="M544 464v32a16 16 0 0 1-16 16H112a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h416a16 16 0 0 1 16 16z" class="fa-secondary"/><path d="M640 176a48 48 0 0 1-48 48 49 49 0 0 1-7.7-.8L512 416H128L55.7 223.2a49 49 0 0 1-7.7.8 48.36 48.36 0 1 1 43.7-28.2l72.3 43.4a32 32 0 0 0 44.2-11.6L289.7 85a48 48 0 1 1 60.6 0l81.5 142.6a32 32 0 0 0 44.2 11.6l72.4-43.4A47 47 0 0 1 544 176a48 48 0 0 1 96 0z" class="fa-primary"/></svg>' + userPallete
				if (player.forceStart) userPallete += '🔔'
				$('#playerTable').append(`
				<div class="item"><div class="content"><div class="reqheader reqplayer color${player.color}">${userPallete}</div></div></div>`)
			});

		})

		socket.on('room_message', (player, message) => {
			$('#messageContent').append(`<span class="reqplayer color${player.color} style="display: inline">${player.username}</span>&nbsp;<p style="display: inline;">${message}</p><br>`)
		})

		window.username = $('#rightfooter').html().split("'s IP: ")[0]
		socket.emit('set_username', window.username);

		socket.on('game_started', (playerColor) => {
			window.playerColor = playerColor
			$('#messageContent').append(`<p style="display: inline;">Game started!</p><br>`)
			$('#reqAppContainer').html(`<h1 class="req">Game starting...</h1><br><h3>We are generating the map.</h3>`)
		})

		socket.on('init_game_map', (width, height) => {
			window.mapWidth = width, window.mapHeight = height
			$('#reqAppContainer').html(`<div class="ui segment" style="background-color: rgb(89, 105, 117, 70%)!important;"><table id="game-map"></table></div>`)
			var $gameTable = $('#game-map');
			for (var i = 0; i < width; ++i) {
				$gameTable.append(`<tr id='tr${i}'></tr>`);
				var $row = $(`#tr${i}`)
				for (var j = 0; j < height; ++j) {
					$row.append(`<td id='td${i}-${j}' onclick="handleClick(${i}, ${j})"></td>`);
				}
			}
			window.turn = 1
			$(document).keydown((event) => {
				if (!window.selectedTd) return

				if (event.which === 65 || event.which === 37) { // Left
					let newPoint = { x: window.selectedTd.x, y: window.selectedTd.y - 1, half: false }
					console.log('keydown LEFT', newPoint)
					if (withinMap(newPoint)) {
						socket.emit('attack', window.selectedTd, newPoint, window.selectedTd.half)
						$(`#td${window.selectedTd.x}-${window.selectedTd.y}`).removeClass(`selected`)
						$(`#td${newPoint.x}-${newPoint.y}`).addClass(`selected`)
						window.selectedTd = newPoint
					}
				} else if (event.which === 87 || event.which === 38) { // Up
					let newPoint = { x: window.selectedTd.x - 1, y: window.selectedTd.y, half: false }
					console.log('keydown UP', newPoint)
					if (withinMap(newPoint)) {
						socket.emit('attack', window.selectedTd, newPoint, window.selectedTd.half)
						$(`#td${window.selectedTd.x}-${window.selectedTd.y}`).removeClass(`selected`)
						$(`#td${newPoint.x}-${newPoint.y}`).addClass(`selected`)
						window.selectedTd = newPoint
					}
				} else if (event.which === 68 || event.which === 39) { // Right
					let newPoint = { x: window.selectedTd.x, y: window.selectedTd.y + 1, half: false }
					console.log('keydown RIGHT', newPoint)
					if (withinMap(newPoint)) {
						socket.emit('attack', window.selectedTd, newPoint, window.selectedTd.half)
						$(`#td${window.selectedTd.x}-${window.selectedTd.y}`).removeClass(`selected`)
						$(`#td${newPoint.x}-${newPoint.y}`).addClass(`selected`)
						window.selectedTd = newPoint
					}
				} else if (event.which === 83 || event.which === 40) { // Down
					let newPoint = { x: window.selectedTd.x + 1, y: window.selectedTd.y, half: false }
					console.log('keydown DOWN', newPoint)
					if (withinMap(newPoint)) {
						socket.emit('attack', window.selectedTd, newPoint, window.selectedTd.half)
						$(`#td${window.selectedTd.x}-${window.selectedTd.y}`).removeClass(`selected`)
						$(`#td${newPoint.x}-${newPoint.y}`).addClass(`selected`)
						window.selectedTd = newPoint
					}
				}
			})
		})

		socket.on('game_update', (gameMap, width, height, turn) => {
			gameMap = JSON.parse(gameMap);
			if (turn % 2 === 0) ++window.turn
			$('.reqtitle').html(`<h3 style="display: inline-block; margin-top: 5px; margin-left: 10px; margin-right: 5px;"><a class="ui mini button" style="display: inline-block" href='./index.html'><svg class="reqreturnicon" style="display: inline-block;font-size: inherit;height: 1em;overflow: visible;vertical-align: -0.125em;font-size: 13px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M570.24 247.41L512 199.52V104a8 8 0 0 0-8-8h-32a8 8 0 0 0-7.95 7.88v56.22L323.87 45a56.06 56.06 0 0 0-71.74 0L5.76 247.41a16 16 0 0 0-2 22.54L14 282.25a16 16 0 0 0 22.53 2L64 261.69V448a32.09 32.09 0 0 0 32 32h128a32.09 32.09 0 0 0 32-32V344h64v104a32.09 32.09 0 0 0 32 32h128a32.07 32.07 0 0 0 32-31.76V261.67l27.53 22.62a16 16 0 0 0 22.53-2L572.29 270a16 16 0 0 0-2.05-22.59zM463.85 432H368V328a32.09 32.09 0 0 0-32-32h-96a32.09 32.09 0 0 0-32 32v104h-96V222.27L288 77.65l176 144.56z"/></svg></a> Turn ${window.turn}</h3>`)
			for (var i = 0; i < width; ++i) {
				for (var j = 0; j < height; ++j) {
					var $cell = $(`#td${i}-${j}`);
					let inner = (!gameMap[i][j].unit) ? '' : gameMap[i][j].unit.toString()
					if (window.selectedTd && window.selectedTd.x === i && window.selectedTd.y === j) {
						if (gameMap[i][j].color !== window.playerColor) {
							window.selectedTd = undefined
							$cell.attr('class', gameMap[i][j].type.toLowerCase());
							$cell.html(inner);
							if (gameMap[i][j].color !== null) {
								$cell.addClass(`reqblock color${gameMap[i][j].color}`)
							}
						} else {
							if (window.selectedTd.half) {
								window.selectedTd.unit = inner
							} else {
								$cell.attr('class', gameMap[i][j].type.toLowerCase() + ' selected');
								$cell.html(inner);
								$cell.addClass(`reqblock color${gameMap[i][j].color}`)
							}
						}
					} else {
						$cell.attr('class', gameMap[i][j].type.toLowerCase());
						$cell.html(inner);
						if (gameMap[i][j].color !== null) {
							$cell.addClass(`reqblock color${gameMap[i][j].color}`)
						}
					}
				}
			}
		})
	})
}

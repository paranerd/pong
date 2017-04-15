var players				= [],
	run					= true,
	ctx					= canvas.getContext("2d"),
	lastRender			= Date.now(),
	lastFpsCycle		= Date.now(),

	PADDLE_HEIGHT_LARGE	= 200,
	PADDLE_HEIGHT_SHORT	= 100,
	PADDLE_WIDTH		= 20,
	PADDLE_MARGIN		= 20,
	BOARD_SPEED			= 5,
	MAX_LIFES			= 3,

	BALL_SIZE_LARGE		= 20,
	BALL_MULTIPLIER_ADD	= 0.01,

	MODE				= 'classic', // or breakout
	CORNER_RADIUS		= 10;

var Player = function(x, ai) {
	this.height	= PADDLE_HEIGHT_LARGE;
	this.width	= PADDLE_WIDTH;
	this.x		= x;
	this.y		= (canvas.height - PADDLE_HEIGHT_LARGE) / 2;
	this.sticky	= false,
	this.move	= {up: false, down: false};
	this.speed	= BOARD_SPEED;
	this.lifes	= MAX_LIFES;
	this.ai		= ai;
}

var ball = {
	x:			canvas.width / 2,
	y:			canvas.height / 2,
	width:		BALL_SIZE_LARGE,
	height:		BALL_SIZE_LARGE,
	speed:		{x: 0, y: 0},
	backup:		{x: 0, y: 0},
	multiplier:	1.0,
	sticks:		{player: null, pos: null},

	reset: function() {
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;

		this.speed = {x: 0, y: 0};
		this.sticks.player = null;
	},

	start: function() {
		this.speed = this.startSpeed();
		this.sticks.player = null;
	},

	startSpeed: function() {
		var side = (Math.random() >= 0.5) ? 1 : -1;
		return {x: Math.floor(Math.random() * (10 - 5 + 1) + 5) * side, y: Math.floor(Math.random() * (10 - 5 + 1) + 5) * side};
	}
}

function init() {
	// Init players
	players.push(new Player(PADDLE_MARGIN, false));
	players.push(new Player(canvas.width - PADDLE_WIDTH - PADDLE_MARGIN, true));

	// Start the game
	setTimeout(function() {
		overlay.className = "hidden";
		animate();
	}, 1000);
}

function ballStartSpeed() {
	return {x: Math.floor(Math.random() * (10 - 5 + 1) + 5), y: Math.floor(Math.random() * (10 - 5 + 1) + 5)};
}

window.onload = function() {
	// Center playground
	canvas.style.top = (window.innerHeight - canvas.height) / 2 + 20 + "px";
	canvas.style.left = (window.innerWidth - canvas.width) / 2 + "px";
	overlay.style.top = (window.innerHeight - canvas.height) / 2 + 20 + "px";
	overlay.style.left = (window.innerWidth - canvas.width) / 2 + "px";

	init();
}

document.onmousedown = function(e) {
	if (ball.sticks.player) {
		ball.speed.x = ball.backup.x;
		ball.speed.y = ball.backup.y;
		ball.sticks.player = null;
	}
	else if (ball.speed.x == 0 && ball.speed.y == 0) {
		ball.start();
	}
}

document.onmousemove = function(e) {
	players[0].y = e.pageY - parseInt(canvas.style.top) - players[0].height / 2;
	if (players[0].y < 0) {
		players[0].y = 0;
	}

	if (players[0].y + players[0].height > canvas.height) {
		players[0].y = canvas.height - players[0].height;
	}
}

document.onkeydown = function(e) {
	switch (e.keyCode) {
		case 40:
			if (!players[1].ai) {
				players[1].move.down = true;
				players[1].move.up = false;
			}
			break;

		case 38:
			if (!players[1].ai) {
				players[1].move.up = true;
				players[1].move.down = false;
			}
			break;
	}
}

document.onkeyup = function(e) {
	switch (e.keyCode) {
		case 40:
			if (!players[1].ai) {
				players[1].move.down = false;
				players[1].move.up = false;
			}
			break;

		case 38:
			if (!players[1].ai) {
				players[1].move.up = false;
				players[1].move.down = false;
			}
			break;
	}
}

function collide(ent1, ent2) {
	if (ent1.x + ent1.width >= ent2.x && ent1.x <= ent2.x + ent2.width &&
		ent1.y + ent1.height >= ent2.y && ent1.y <= ent2.y + ent2.height)
	{
		var bottom_diff = ent2.y + ent2.height - ent1.y;
		var top_diff = ent1.y + ent1.height - ent2.y;
		var left_diff = ent1.x + ent1.width - ent2.x;
		var right_diff = ent2.x + ent2.width - ent1.x;

		var coll = {bottom: false, right: false, left: false, top: false};

		coll.bottom = top_diff < bottom_diff && top_diff < left_diff && top_diff < right_diff;
		coll.right = left_diff < right_diff && left_diff < top_diff && left_diff < bottom_diff;
		coll.left = right_diff < left_diff && right_diff < top_diff && right_diff < bottom_diff;
		coll.top = bottom_diff < top_diff && bottom_diff < left_diff && bottom_diff < right_diff;

		return coll;
	}
	return null;
}

function empty(id) {
	var node = document.getElementById(id);

	while (node.hasChildNodes()) {
		node.removeChild(node.lastChild);
	}
}

function gameOver(player) {
	ball.reset();
	var id = (player == 0) ? "player1-lifes" : "player2-lifes";
	var lifesContainer = document.getElementById(id);
	run = false;
	empty(id);

	for (var i = 1; i <= 3; i++) {
		var heart = (players[player].lifes > i) ? '&#9829' : '&#9825';
		lifesContainer.innerHTML = lifesContainer.innerHTML + " " + heart;
	}

	if (players[player].lifes > 1) {
		players[player].lifes--;
		setTimeout(function() {
			run = true;
			animate();
		}, 1000);
	}
	else {
		var won = (player == 0) ? '2' : '1';
		overlay.className = "";
		overlay.innerHTML = "Player " + won + " won.";
	}
}

// GAME LOOP
function animate() {
	var delta = (Date.now() - lastRender) / 1000;
	update(delta);
	lastRender = Date.now();
	draw();

	if (Date.now() - lastFpsCycle > 1000) {
		lastFpsCycle = Date.now();
		var fps = Math.round(1/delta);
	}

	if (run) {
		// Request a new animation frame using Paul Irish's shim
		window.requestAnimFrame(animate);
	}
};

var update = function() {
	// Collision Ball-Canvas-Right
	if (ball.x + ball.width > canvas.width) {
		ball.speed.x *= -1;
		ball.x = canvas.width - ball.width;
		gameOver(1);
	}
	// Collision Ball-Canvas-Left
	else if (ball.x < 0) {
		ball.speed.x *= -1;
		ball.x = 0;
		gameOver(0);
	}
	// Collision Ball-Canvas-Bottom
	else if (ball.y + ball.height >= canvas.height) {
		ball.speed.y *= -1;
		ball.y = canvas.height - ball.height;
	}
	// Collision Ball-Canvas-Top
	else if (ball.y < 0) {
		ball.speed.y *= -1;
		ball.y = 0;
	}
	else {
		// Collision Ball-Player
		for (var j = 0; j < players.length; j++) {
			if (collide(ball, players[j])) {
				var relIntersect = (players[j].y + (players[j].height / 2)) - (ball.y + ball.height / 2); // Board-center - ball-center
				var normalized = (relIntersect / (players[j].height / 2));
				var direction = (j == 0) ? 1 : -1;

				ball.multiplier += BALL_MULTIPLIER_ADD;
				ball.speed.y = (MODE == "breakout") ? normalized * -5 * ball.multiplier : ball.speed.y * ball.multiplier;
				ball.speed.x *= -1 * ball.multiplier;
				ball.x = players[j].x + ball.width * direction + 1 * direction;

				if (players[j].sticky && !ball.sticks.player) {
					ball.backup.x = ball.speed.x;
					ball.backup.y = ball.speed.y;
					ball.speed.x = 0;
					ball.speed.y = 0;
					ball.sticks.pos = ball.y - players[j].y;
					ball.sticks.player = j;
				}
			}

			if (ball.sticks.player == j) {
				ball.y = players[j].y + ball.sticks.pos;
			}

		}
	}

	// Update Ball
	ball.x += ball.speed.x;
	ball.y += ball.speed.y;

	for (var i = 0; i < players.length; i++) {
		// AI
		if (players[i].ai && ball.speed.x != 0 && ball.speed.y != 0) {
			// Follow the ball when it's coming
			if ((i == 0 && ball.speed.x < 0) || (i == 1 && ball.speed.x > 0)) {
				if (ball.y > players[i].y + players[i].height / 2) {
					players[i].move.down = true;
					players[i].move.up = false;
				}
				else {
					players[i].move.up = true;
					players[i].move.down = false;
				}
			}
			// Center when ball is leaving
			else {
				if ((players[i].y + players[i].height / 2) - (canvas.height / 2) < -20) {
					players[i].move.down = true;
					players[i].move.up = false;
				}
				else if ((players[i].y + players[i].height / 2) - (canvas.height / 2) > 20) {
					players[i].move.up = true;
					players[i].move.down = false;
				}
				else {
					players[i].move.up = false;
					players[i].move.down = false;
				}
			}
		}

		// Update Boards
		if (players[i].move.up) {
			players[i].y -= players[i].speed;
		}
		else if (players[i].move.down) {
			players[i].y += players[i].speed;
		}

		if (players[i].y < 0) {
			players[i].y = 0;
		}
		else if (players[i].y + players[i].height > canvas.height) {
			players[i].y = canvas.height - players[i].height;
		}
	}
}

var draw = function() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineJoin = "round";
	ctx.lineWidth = CORNER_RADIUS;

	// Ball
	ctx.fillStyle = "grey";
	ctx.beginPath();
	ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, 2 * Math.PI);
	ctx.fill();

	// Players
	for (var i = 0; i < players.length; i++) {
		ctx.strokeStyle = "grey";
		ctx.strokeRect(players[i].x + (CORNER_RADIUS / 2), players[i].y + (CORNER_RADIUS / 2), players[i].width - CORNER_RADIUS, players[i].height - CORNER_RADIUS);
		ctx.fillRect(players[i].x + (CORNER_RADIUS / 2), players[i].y + (CORNER_RADIUS / 2), players[i].width - CORNER_RADIUS, players[i].height - CORNER_RADIUS);
	}
}
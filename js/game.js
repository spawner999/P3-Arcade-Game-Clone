//Game Object
var game = new Phaser.Game(800,600, Phaser.AUTO, 'phaser-demo', {preload: preload, create: create, update: update, render: render});

//Variable Declarations
var cursors;
var fire_button;
var bulletTimer = 0;
var laser;
var score = 0;
var scoreText;
var shields;
var gameOver;
var launchTimer;

/*
*
*CLASSES
*
*/

//Player entity
var Player = function(game){
	this.health = 100;
	Phaser.Sprite.call(this, game, 0, 300, 'ship');
	this.anchor.setTo(-0.25, 0);
	game.add.existing(this);
	game.physics.enable(this, Phaser.Physics.ARCADE);
};
//Extends Phaser's Sprite class
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
//This method handles input and updates player position and actions
Player.prototype.update = function(){
	this.body.velocity.setTo(0,0);
	if(cursors.up.isDown){
		this.body.velocity.y = -300;
	}
	if(cursors.down.isDown){
		this.body.velocity.y = 300;
	}
	if(cursors.left.isDown){
		this.body.velocity.x = -300;
	}
	if(cursors.right.isDown){
		this.body.velocity.x = 300;
	}
	if(this.y > game.height -105){
		this.y = game.height - 105;
	}
	if(this.y < 0){
		this.y= 0;
	}
	if(this.x > game.width -105){
		this.x = game.width - 105;
	}
	if(this.x < 0){
		this.x= 0;
	}
	if(player.alive && fire_button.isDown || game.input.activePointer.isDown) {
		this.fireBullet(bullets);
	}
};
//This method handles bullet firing, can be used for different kinds of ammo
Player.prototype.fireBullet = function(bullet_type){
	// To avoid them being allowed to fire too fast we set a time limit
	if (game.time.now > bulletTimer){
		var BULLET_SPEED = 400;
		var BULLET_SPACING = 400;
		//Grab the first bullet we can from the pool
		var bullet = bullet_type.getFirstExists(false);
		if (bullet){
			//And fire it
			//Make bullet come out of tip of ship with right angle
			var bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
			bullet.reset(player.x + bulletOffset, player.y);
			bullet.angle = player.angle;
			game.physics.arcade.velocityFromAngle(bullet.angle, BULLET_SPEED, bullet.body.velocity);
			bullet.body.velocity.x += player.body.velocity.x;
			laser.play();
			//Increase Timer
			bulletTimer = game.time.now + BULLET_SPACING;
		}
	}
};

//Bullet class
var BulletGroup = function(game){
	Phaser.Group.call(this, game);
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(6, 'bullet');
	this.setAll('anchor.x', -1.5);
	this.setAll('anchor.y', -5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true);
	game.add.group();
};
//Extends phaser Group class
BulletGroup.prototype = Object.create(Phaser.Group.prototype);
BulletGroup.prototype.constructor = BulletGroup;


//Enemy class
var EnemyGroup = function(game, sprite){
	Phaser.Group.call(this, game);
	game.add.group();
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(5, sprite);
	this.setAll('anchor.x', 0.5);
	this.setAll('anchor.y', 0.5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true);
	};
//Extends phaser Group class
EnemyGroup.prototype = Object.create(Phaser.Group.prototype);
EnemyGroup.prototype.constructor = EnemyGroup;

/*
*
*GAME FUNCTIONS
*
*/

//This function is used to load resources
function preload(){
	game.load.image('starfield', 'images/space-1.jpg');
	game.load.image('ship', 'images/player_ship.png');
	game.load.image('bullet', 'images/laser.png');
	game.load.image('enemy', 'images/enemy.png');
	game.load.image('rocks', 'images/asteroids.png');
	game.load.spritesheet('explosion', 'images/explosion.png', 128, 128);
	game.load.audio('laser', 'images/laser2.ogg');
	game.load.audio('explode', 'images/explosion.ogg');
}

//This function is used to instantiate game entities
function create(){
	starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
	player = new Player(game);
	laser = game.add.audio('laser');
	explode = game.add.audio('explode');
	bullets = new BulletGroup(game);
	enemies = new EnemyGroup(game, 'enemy');
	rocks = new EnemyGroup(game, 'rocks');
	//Creates first wave event, 1 sec delay
	game.time.events.add(1000, launchWave1);
	//Adds player Health on screen
	shields = game.add.text(game.world.width - 150, 10, 'Health: ' + player.health +'%', { font: '20px Arial', fill: '#fff' });
	shields.render = function() {
		shields.text = 'Shields: ' + Math.max(player.health, 0) +'%';
	};
	//Adds Score on screen
	scoreText = game.add.text(10, 10, '', { font: '20px Arial', fill: '#fff' });
	scoreText.render = function() {
		scoreText.text = 'Score: ' + score;
	};
	scoreText.render();
	//Game over text
	gameOver = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER!', { font: '84px Arial', fill: '#fff' });
	gameOver.anchor.setTo(0.5, 0.5);
	gameOver.visible = false;
	//Controls
	cursors = game.input.keyboard.createCursorKeys();
	fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

//This Function updates the game
function update(){
	//Scroll the background
	starfield.tilePosition.x -= 1.5;
	//Check collisions
	game.physics.arcade.overlap(player, enemies, shipCollide, null, this);
	game.physics.arcade.overlap(player, rocks, shipCollide, null, this);
	game.physics.arcade.overlap(enemies, bullets, hitEnemy, null, this);
	game.physics.arcade.overlap(rocks, bullets, hitEnemy, null, this);
	//Game over?
	if(!player.alive && gameOver.visible === false){
		var setResetHandlers = function() {
			//The "click to restart" handler
			tapRestart = game.input.onTap.addOnce(_restart,this);
			spaceRestart = fire_button.onDown.addOnce(_restart,this);
			function _restart() {
			tapRestart.detach();
			spaceRestart.detach();
			restart();
			}
		};
		gameOver.visible = true;
		var fadeInGameOver = game.add.tween(gameOver);
		fadeInGameOver.to({alpha: 1}, 1000, Phaser.Easing.Quintic.Out);
		fadeInGameOver.onComplete.add(setResetHandlers);
		fadeInGameOver.start();
	}
 }

//This function restarts the game after GameOver
function restart(){
	//Reset the enemies
	enemies.callAll('kill');
	game.time.events.removeAll();
	game.time.events.add(1000, launchWave1);
	//Revive the player
	player.revive();
	player.health = 100;
	shields.render();
	score = 0;
	scoreText.render();
	//Hide the text
	gameOver.visible = false;
}

function render(){
  }

/*
*
*OTHER FUNCTIONS
*
*/

//This function handles the spawn of the first enemy wave, the eventTimer recursively recalls the function
//after a randomly generated delay
function launchWave1(){
	var MIN_ENEMY_SPACING = 300;
	var MAX_ENEMY_SPACING = 3000;
	var ENEMY_SPEED = 300;
	//Takes enemy from pool and launches it
	var enemy = enemies.getFirstExists(false);
	if(enemy) {
		enemy.reset(820, game.rnd.integerInRange(25, 480));
		enemy.body.velocity.x = -300;
		enemy.body.velocity.y = game.rnd.integerInRange(0, 300);
		enemy.body.drag.y = 300;
	}
	//Event Timer
	launchTimer = game.time.events.add(game.rnd.integerInRange(MIN_ENEMY_SPACING, MAX_ENEMY_SPACING), launchWave1);
	//Single enemy instance update method
	enemy.update = function(){
		//Kill enemies once they go off screen
		if(enemy.x < -200) {
		enemy.kill();
		enemy.x = -20;
		}
	};
}

//Collision between player and enemy ships
function shipCollide(player, enemy){
 	//Play sound
	explode.play();
	//Add and play animation
	var explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
	explosion.animations.add('boom');
	explosion.play('boom', 15, false, true);
	//Decrease Health
	player.damage(20);
	shields.render();
	//Remove enemy
	enemy.kill();
}

//Collision between enemies and bullets
function hitEnemy(enemy, bullet){
	//Play sound
	explode.play();
	//Add and play animation
	var explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
	explosion.animations.add('boom');
	explosion.play('boom', 15, false, true);
	//Remove objects
	enemy.kill();
	bullet.kill();
	//Increase score
	score += 20;
	scoreText.render();
}
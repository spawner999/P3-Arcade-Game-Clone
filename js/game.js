/*
*
*GAME OBJECT
*
*/
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-demo', {preload: preload, create: create, update: update, render: render});

/*
*
*VARIABLES
*
*/
var cursors;
var fireButton;
var laser;
var scoreText;
var shields;
var gameOver;
var enemyTimer;
var ufoTimer;
var powerTimer;
var bulletTimer = 0;
var textOptions = {
	font: '32px Arial',
	fill: '#ffffff',
	align: 'center'
};

/*
*
*CLASSES
*
*/

//Player class
var Player = function (game) {
	this.health = 100;
	this.score = 0;
	this.SHIP_SPEED = 220;
	Phaser.Sprite.call(this, game, 0, 300, 'ship');
	this.anchor.setTo(-0.25, 0);
	this.BULLET_SPEED = 250;
	this.BULLET_SPACING = 600;
	//Add sprite to game
	game.add.existing(this);
	game.physics.enable(this, Phaser.Physics.ARCADE);
};
//Extends Phaser's Sprite class
Player.prototype = Object.create(Phaser.Sprite.prototype);
//This method handles input and updates player position and actions
Player.prototype.update = function () {
	this.body.velocity.setTo(0,0);
	if(cursors.up.isDown) {
		this.body.velocity.y = -this.SHIP_SPEED;
	}
	if(cursors.down.isDown) {
		this.body.velocity.y = this.SHIP_SPEED;
	}
	if(cursors.left.isDown) {
		this.body.velocity.x = -this.SHIP_SPEED;
	}
	if(cursors.right.isDown) {
		this.body.velocity.x = this.SHIP_SPEED;
	}
	if(this.y > game.height -105) {
		this.y = game.height - 105;
	}
	if(this.y < 0) {
		this.y= 0;
	}
	if(this.x > game.width -105) {
		this.x = game.width - 105;
	}
	if(this.x < 0) {
		this.x= 0;
	}
	if(player.alive && fireButton.isDown || game.input.activePointer.isDown) {
		this.fireBullet(playerBullets);
		}
};
//This method handles bullet firing, can be used for different kinds of ammo
Player.prototype.fireBullet = function (bullet_type) {
	// To avoid them being allowed to fire too fast we set a time limit
	if (game.time.now > bulletTimer) {
		//Grab the first bullet we can from the pool
		var bullet = bullet_type.getFirstExists(false);
		if (bullet) {
			//Make bullet come out of tip of ship with right angle
			bullet.reset(this.x, this.y);
			game.physics.arcade.velocityFromAngle(0, this.BULLET_SPEED, bullet.body.velocity);
			bullet.body.velocity.x += this.BULLET_SPEED;
			laser.play();
			//Increase Timer
			bulletTimer = game.time.now + this.BULLET_SPACING;
		}
	}
};
//Collision between player and enemy ships
Player.prototype.hitShip = function (player, enemy) {
 	//Play sound
	shield_down.play();
	//Add and play animation
	var explosion = game.add.sprite(enemy.x, enemy.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
	explosion.animations.add('boom');
	explosion.play('boom', 15, false, true);
	//Decrease Health
	player.damage(20);
	shields.render();
	var text = game.add.text(player.x + 75, player.y - 20, '-20%', textOptions);
	text.anchor.set(0.5);
	game.add.tween(text).to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true);
	//Remove enemy
	enemy.kill();
};
//Collision between enemies and bullets
Player.prototype.collectPower = function (player, power) {
	//Play sound
	power_up.play();
	//Text Popup
	var text = game.add.text(power.x, power.y -20, '+20%', textOptions);
	text.anchor.set(0.5);
	game.add.tween(text).to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true);
	//Remove objects
	power.kill();
	//Increase health
	player.health +=20;
	shields.render();
};
//Collision between Player and enemy bullets
Player.prototype.hitPlayer = function (player, bullet) {
 	//Play sound
	shield_down.play();
	//Add and play animation
	var explosion = game.add.sprite(player.x, player.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
	explosion.animations.add('boom');
	explosion.play('boom', 15, false, true);
	//Decrease Health
	player.damage(20);
	shields.render();
	var text = game.add.text(player.x + 75, player.y - 20, '-20%', textOptions);
	text.anchor.set(0.5);
	game.add.tween(text).to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true);
	//Remove bullet
	bullet.kill();
};

//Bullet class
var BulletGroup = function (game,sprite) {
	Phaser.Group.call(this, game);
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(3, sprite);
	this.setAll('anchor.x', -1.5);
	this.setAll('anchor.y', -5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true);
	game.add.group();
};
//Extends phaser Group class
BulletGroup.prototype = Object.create(Phaser.Group.prototype);

//Enemy class
var EnemyGroup = function (game, sprite) {
	Phaser.Group.call(this, game);
	game.add.group();
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(5, sprite);
	this.setAll('anchor.x', 0.5);
	this.setAll('anchor.y', 0.5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true);
	this.ENEMY_SPACING = 4000;
};
//Extends phaser Group class
EnemyGroup.prototype = Object.create(Phaser.Group.prototype);
//This function handles the spawn of the enemy wave, the eventTimer recursively recalls the function
//after a randomly generated delay
EnemyGroup.prototype.launchEnemy = function () {
	var START_SPD = game.rnd.integerInRange(120, game.height-70);
	var SPEED = -250;

	//Takes enemy from pool and launches it
	var enemy = this.getFirstExists(false);
	if(enemy) {
		enemy.reset(game.width + 20, START_SPD);
		enemy.body.velocity.x = SPEED;
		enemy.body.velocity.y = game.rnd.integerInRange(0, SPEED);
		enemy.body.drag.y = game.height/2;
		enemy.fireRate =1500;
    enemy.nextFire = 0;
		//Single enemy instance update method
		enemy.update = function () {
			//Kill enemies once they go off screen
			if(enemy.x < -20) {
				enemy.kill();
				}
			if(enemy.game.time.now > enemy.nextFire && enemy.alive) {
            	enemy.nextFire = enemy.game.time.now + enemy.fireRate;
            	var bullet = enemyBullets.getFirstExists(false);
            	if(bullet) {
            		bullet.reset(enemy.body.x-25, enemy.body.y);
            		game.physics.arcade.velocityFromAngle(0, SPEED, bullet.body.velocity);
		      		bullet.body.velocity.x += SPEED;
        		}
        	}
		};
	}
	//Event Timer
	enemyTimer = game.time.events.add(game.rnd.integerInRange(this.ENEMY_SPACING, this.ENEMY_SPACING +2000), this.launchEnemy, this);
};
//This function handles the spawn of the ufo wave, the eventTimer recursively recalls the function
//after a fixed delay
EnemyGroup.prototype.launchUfo = function () {
	var START_SPD = game.rnd.integerInRange(25, game.height-100);
	var SPEED = -120;
	var SPREAD = 60;
	var FREQUENCY = 50;
	//Launch wave
	var ufo = this.getFirstExists(false);
	if(ufo) {
		this.START_SPD = START_SPD;
		ufo.reset(game.width + 20, this.START_SPD);
		ufo.body.velocity.x = SPEED;
		//Update function for each enemy
		ufo.update = function () {
			//Wave movement
			this.body.y = Math.sin((this.x) / FREQUENCY) * SPREAD + START_SPD;
			//Kill enemies once they go off screen
			if(ufo.x < -20) {
				ufo.kill();
			}
		};
	}
	//Event Timer
	ufoTimer = game.time.events.add(game.rnd.integerInRange(this.ENEMY_SPACING, this.ENEMY_SPACING +2000), this.launchUfo, this);
};
//Collision between enemies and bullets
EnemyGroup.prototype.hitEnemy = function (enemy, bullet) {
	//Play sound
	explode.play();
	//Add and play animation
	var explosion = game.add.sprite(enemy.x, enemy.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
	explosion.animations.add('boom');
	explosion.play('boom', 15, false, true);
	//Text Popup
	var text = game.add.text(enemy.x, enemy.y - 40, '+20', textOptions);
	text.anchor.set(0.5);
	game.add.tween(text).to({alpha: 0}, 2000, Phaser.Easing.Linear.None, true);
	//Remove objects
	enemy.kill();
	bullet.kill();
	//Increase score
	player.score += 20;
	scoreText.render();
	//increase Pacing
	this.ENEMY_SPACING *= 0.90;

};

//PowerUp class
var PowerUpGroup = function (game, sprite) {
	Phaser.Group.call(this, game);
	game.add.group();
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(5, sprite);
	this.setAll('anchor.x', 0.5);
	this.setAll('anchor.y', 0.5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true);
	this.MIN_SPACING = 20000;
	this.MAX_SPACING = 40000;
	this.SPEED = -140;
	};
//Extends phaser Group class
PowerUpGroup.prototype = Object.create(Phaser.Group.prototype);
//This function handles the spawn of the powerUP wave, the eventTimer recursively recalls the function
//after a randomly generated delay
PowerUpGroup.prototype.launchPowerShield = function () {
	//Takes enemy from pool and launches it
	var power_up = powerShield.getFirstExists(false);
	if(power_up) {
		power_up.reset(game.rnd.integerInRange(game.width/3, game.width-25), game.rnd.integerInRange(25, game.height - 25));
		power_up.body.velocity.x = this.SPEED;
		//Single powerUP instance update method
		power_up.update = function(){
			//Kill powerUP once they go off screen
			if(power_up.x < -200) {
				power_up.kill();
			}
		};
	}
	//Event Timer
	powerTimer = game.time.events.add(game.rnd.integerInRange(this.MIN_SPACING, this.MAX_SPACING), this.launchPowerShield, this);
};

/*
*
*GAME FUNCTIONS
*
*/

//This function is used to load resources
function preload(){
	game.load.image('starfield', 'images/space-2.jpg');
	game.load.image('ship', 'images/player_ship.png');
	game.load.image('playerBullet', 'images/laser.png');
	game.load.image('enemy', 'images/enemy.png');
	game.load.image('ufo', 'images/ufo.png');
	game.load.image('powerShield', 'images/power2.png');
	game.load.spritesheet('explosion', 'images/explosion.png', 128, 128);
	game.load.audio('laser', 'images/laser2.ogg');
	game.load.image('enemyBullet', 'images/laser1.png');
	game.load.audio('loop', 'images/loop.mp3');
	game.load.audio('explode', 'images/explosion.ogg');
	game.load.audio('s_down', 'images/shield_down.ogg');
	game.load.audio('power_up', 'images/power_up.ogg');
}

//This function is used to instantiate game entities
function create () {
	starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
	player = new Player(game);
	laser = game.add.audio('laser');
	explode = game.add.audio('explode');
	shield_down = game.add.audio('s_down');
	power_up = game.add.audio('power_up');
	background_music = game.add.audio('loop');
	background_music.loopFull();
	playerBullets = new BulletGroup(game,'playerBullet');
	enemyBullets = new BulletGroup(game,'enemyBullet');
	enemies = new EnemyGroup(game, 'enemy');
	ufos = new EnemyGroup(game, 'ufo');
	powerShield = new PowerUpGroup(game, 'powerShield');
	//Create events
	game.time.events.add(10000, enemies.launchEnemy, enemies);
	game.time.events.add(1000, ufos.launchUfo, ufos);
	game.time.events.add(10000, powerShield.launchPowerShield, powerShield);
	//Add player Health on screen
	shields = game.add.text(game.world.width - 150, 10, 'Health: ' + player.health +'%', { font: '20px Arial', fill: '#fff' });
	shields.render = function() {
		shields.text = 'Shields: ' + Math.max(player.health, 0) +'%';
	};
	//Add Score on screen
	scoreText = game.add.text(10, 10, '', { font: '20px Arial', fill: '#fff' });
	scoreText.render = function() {
		scoreText.text = 'Score: ' + player.score;
	};
	scoreText.render();
	//Game over text
	gameOver = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER!', { font: '84px Arial', fill: '#fff' });
	gameOver.anchor.setTo(0.5, 0.5);
	gameOver.visible = false;
	//Controls
	cursors = game.input.keyboard.createCursorKeys();
	fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

//This Function updates the game
function update () {
	//Scroll the background
	starfield.tilePosition.x -= 1.5;
	//Check collisions
	game.physics.arcade.overlap(player, enemies, player.hitShip, null, player);
	game.physics.arcade.overlap(player, ufos, player.hitShip, null, player);
	game.physics.arcade.overlap(enemies, playerBullets, enemies.hitEnemy, null, enemies);
	game.physics.arcade.overlap(ufos, playerBullets, ufos.hitEnemy, null, ufos);
	game.physics.arcade.overlap(player, powerShield, player.collectPower, null, player);
	game.physics.arcade.overlap(player, enemyBullets, player.hitPlayer, null, player);
	//Game over?
	if(!player.alive && gameOver.visible === false) {
		var setResetHandlers = function() {
			//The "click to restart" handler
			tapRestart = game.input.onTap.addOnce(_restart,this);
			spaceRestart =  fireButton.onDown.addOnce(_restart,this);
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
function restart () {
	//Reset the enemies
	enemies.callAll('kill');
	ufos.callAll('kill');
	powerShield.callAll('kill');
	enemyBullets.callAll('kill');
	game.time.events.removeAll();
	game.time.events.add(20000, enemies.launchEnemy, enemies);
	game.time.events.add(1000, ufos.launchUfo, ufos);
	game.time.events.add(10000, powerShield.launchPowerShield, powerShield);
	enemies.ENEMY_SPACING = 3000;
	ufos.ENEMY_SPACING = 3000;
	//Revive the player
	player.revive();
	player.health = 100;
	shields.render();
	player.score = 0;
	scoreText.render();
	//Hide the text
	gameOver.visible = false;
}

function render () {
}
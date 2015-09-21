var game = new Phaser.Game(800,600, Phaser.AUTO, 'phaser-demo', {preload: preload, create: create, update: update, render: render});

//Game Entities
var starfield;
var cursors;
var fire_button;
var bulletTimer = 0;
var laser;
var music;
var score = 0;
var scoreText;
var shields;
var gameOver;
var launchTimer;


//Player entity, extends Sprite class
var Player = function(game){
	this.health = 20;
	Phaser.Sprite.call(this, game, 0, 300, 'ship');
	this.anchor.setTo(-0.25, 0);
	game.add.existing(this);
	game.physics.enable(this, Phaser.Physics.ARCADE);
}

Player.prototype = Object.create(Phaser.Sprite.prototype);

Player.prototype.constructor = Player;

Player.prototype.update = function(){
	this.body.velocity.setTo(0,0);

	if(cursors.up.isDown){
		this.body.velocity.y = -300;
	}
	if(cursors.down.isDown){
		this.body.velocity.y = 300;
	}
	if(this.y > game.height -105){
		this.y = game.height - 105;
	}
	if(this.y < 0){
		this.y= 0;
	}
	if (player.alive && fire_button.isDown || game.input.activePointer.isDown) {
		this.fireBullet(bullets);

	}
}

Player.prototype.fireBullet = function(bullet_type){
	  //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTimer)
    {
        var BULLET_SPEED = 400;
        var BULLET_SPACING = 400;
        //  Grab the first bullet we can from the pool
        var bullet = bullet_type.getFirstExists(false);

        if (bullet)
        {
            //  And fire it
            //  Make bullet come out of tip of ship with right angle
            var bulletOffset = 20 * Math.sin(game.math.degToRad(player.angle));
            bullet.reset(player.x + bulletOffset, player.y);
            bullet.angle = player.angle;
            game.physics.arcade.velocityFromAngle(bullet.angle, BULLET_SPEED, bullet.body.velocity);
            bullet.body.velocity.x += player.body.velocity.x;
            laser.play();

            bulletTimer = game.time.now + BULLET_SPACING;
        }
    }

}


//Bullet class extends Group
var BulletGroup = function(game){
	Phaser.Group.call(this, game);
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(6, 'bullet');
	this.setAll('anchor.x', -1.5);
	this.setAll('anchor.y', -5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true)
	game.add.group();
}

BulletGroup.prototype = Object.create(Phaser.Group.prototype);
BulletGroup.prototype.constructor = BulletGroup;


//Enemy class extends Group
var EnemyGroup = function(game){
	Phaser.Group.call(this, game);
	game.add.group();
	this.enableBody = true;
	this.physicsBodyType = Phaser.Physics.ARCADE;
	this.createMultiple(5, 'enemy');
	this.setAll('anchor.x', 0.5);
	this.setAll('anchor.y', 0.5);
	this.setAll('outOfBoundsKill', true);
	this.setAll('checkWorldBounds', true);
	}

EnemyGroup.prototype = Object.create(Phaser.Group.prototype);

EnemyGroup.prototype.constructor = EnemyGroup;

EnemyGroup.prototype.launchEnemy = function(){
	var MIN_ENEMY_SPACING = 300;
	var MAX_ENEMY_SPACING = 3000;
	var ENEMY_SPEED = 300;
	var enemy = this.getFirstExists(false);
	if (enemy) {
			enemy.reset(game.rnd.integerInRange(0, game.width), -20);
			enemy.body.velocity.x = game.rnd.integerInRange(-300, 300);
			enemy.body.velocity.y = ENEMY_SPEED;
			enemy.body.drag.x = 100;
		}
}

//This function is used to load resources
function preload() {
    game.load.image('starfield', 'images/blue.png');
    game.load.image('ship', 'images/player_ship.png');
    game.load.image('bullet', 'images/laser.png');
    game.load.image('enemy', 'images/enemy.png');
    game.load.spritesheet('explosion', 'images/explosion.png', 128, 128);
    game.load.audio('laser', 'images/laser2.ogg');
    game.load.audio('explode', 'images/explosion.ogg');
    game.load.audio('music', 'images/sound.ogg');


}

//This function is used to instantiate game entities
function create() {
    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
    player = new Player(game);
    laser = game.add.audio('laser');
    explode = game.add.audio('explode');
    music = game.add.audio('music');
    bullets = new BulletGroup(game);
    enemies = new EnemyGroup(game);

    music.play();
   	launchTimer = game.time.events.repeat(Phaser.Timer.SECOND * 1.5, 100, function(){enemies.launchEnemy()}, this);

	shields = game.add.text(game.world.width - 150, 10, 'Shields: ' + player.health +'%', { font: '20px Arial', fill: '#fff' });
	shields.render = function () {
	shields.text = 'Shields: ' + Math.max(player.health, 0) +'%';
	};


      //  Score
	scoreText = game.add.text(10, 10, '', { font: '20px Arial', fill: '#fff' });
	scoreText.render = function () {
		scoreText.text = 'Score: ' + score;
	};
	scoreText.render();

	//  Game over text
	gameOver = game.add.text(game.world.centerX, game.world.centerY, 'GAME OVER!', { font: '84px Arial', fill: '#fff' });
	gameOver.anchor.setTo(0.5, 0.5);
	gameOver.visible = false;


    //controls
    cursors = game.input.keyboard.createCursorKeys();
    fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update() {
	//  Scroll the background
	starfield.tilePosition.x -= 2;
 //  Check collisions
	game.physics.arcade.overlap(player, enemies, shipCollide, null, this);
	game.physics.arcade.overlap(enemies, bullets, hitEnemy, null, this);

	//  Game over?
	if (! player.alive && gameOver.visible === false) {
		gameOver.visible = true;
		var fadeInGameOver = game.add.tween(gameOver);
		fadeInGameOver.to({alpha: 1}, 1000, Phaser.Easing.Quintic.Out);
		fadeInGameOver.onComplete.add(setResetHandlers);
		fadeInGameOver.start();
		function setResetHandlers() {
			//  The "click to restart" handler
			tapRestart = game.input.onTap.addOnce(_restart,this);
			spaceRestart = fire_button.onDown.addOnce(_restart,this);
			function _restart() {
			tapRestart.detach();
			spaceRestart.detach();
			restart();
			}
		}
	}
 }


	// Player Movement




function render() {

}

function shipCollide(player, enemy) {
	explode.play();
	var explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);
    player.damage(20);
    shields.render();
    enemy.kill();
}

function hitEnemy(enemy, bullet) {
	explode.play();
	var explosion = this.add.sprite(enemy.x, enemy.y, 'explosion');
	explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);
    enemy.kill();
	bullet.kill()
	// Increase score
	score += 20;
	scoreText.render()
}

function restart () {
	//  Reset the enemies
	enemies.callAll('kill');
	game.time.events.remove(launchTimer);
	launchTimer = game.time.events.repeat(Phaser.Timer.SECOND * 1.5, 100, function(){enemies.launchEnemy()}, this);



	//  Revive the player
	player.revive();
	player.health = 100;
	shields.render();
	score = 0;
	scoreText.render();

	//  Hide the text
	gameOver.visible = false;

}
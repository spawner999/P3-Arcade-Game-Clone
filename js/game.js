var game = new Phaser.Game(800,600, Phaser.AUTO, 'phaser-demo', {preload: preload, create: create, update: update, render: render});

//Game Entities
var starfield;
var cursors;
var fire_button;
var bulletTimer = 0;
var laser;

//Player entity, extends Sprite class
var Player = function(game){
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
	if (fire_button.isDown || game.input.activePointer.isDown) {
		this.fireBullet(bullets);

	}
}

Player.prototype.fireBullet = function(bullet_type){
	  //  To avoid them being allowed to fire too fast we set a time limit
    if (game.time.now > bulletTimer)
    {
        var BULLET_SPEED = 400;
        var BULLET_SPACING = 250;
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


//This function is used to load resources
function preload() {
    game.load.image('starfield', 'images/blue.png');
    game.load.image('ship', 'images/player_ship.png');
    game.load.image('bullet', 'images/laser.png');
    game.load.audio('laser', 'images/laser2.ogg')

}

//This function is used to instantiate game entities
function create() {
    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
    player = new Player(game);
    laser = game.add.audio('laser');
    bullets = new BulletGroup(game);

    //controls
    cursors = game.input.keyboard.createCursorKeys();
    fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update() {
	//  Scroll the background
	starfield.tilePosition.x -= 2;
	//  Fire bullet


	// Player Movement


}

function render() {

}

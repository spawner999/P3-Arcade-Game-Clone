var game = new Phaser.Game(800,600, Phaser.AUTO, 'phaser-demo', {preload: preload, create: create, update: update, render: render});

//Game Entities
var starfield;
var cursors;

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

}

//This function is used to load resources
function preload() {
    game.load.image('starfield', 'images/purple.png');
    game.load.image('ship', 'images/player_ship.png');
}

//This function is used to instantiate game entities
function create() {
    //  The scrolling starfield background
    starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
    new Player(game);

    //controls
    cursors = game.input.keyboard.createCursorKeys();

}

function update() {
	//  Scroll the background
	starfield.tilePosition.x -= 2;

	// Player Movement


}

function render() {

}
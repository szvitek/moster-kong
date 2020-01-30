// create a new scene
const gameScene = new Phaser.Scene("Game");

// some parameters for our scene
gameScene.init = function() {
  // player params
  this.playerSpeed = 150;
  this.jumpSpeed = -600;
};

// load asset files for our game
gameScene.preload = function() {
  // load images
  this.load.image("ground", "assets/images/ground.png");
  this.load.image("platform", "assets/images/platform.png");
  this.load.image("block", "assets/images/block.png");
  this.load.image("goal", "assets/images/gorilla3.png");
  this.load.image("barrel", "assets/images/barrel.png");

  // load spritesheets
  this.load.spritesheet("player", "assets/images/player_spritesheet.png", {
    frameWidth: 28,
    frameHeight: 30,
    margin: 1,
    spacing: 1
  });

  this.load.spritesheet("fire", "assets/images/fire_spritesheet.png", {
    frameWidth: 20,
    frameHeight: 21,
    margin: 1,
    spacing: 1
  });
};

// executed once, after assets were loaded
gameScene.create = function() {
  // world bounds
  this.physics.world.bounds.width = 360;
  this.physics.world.bounds.height = 700;

  this.platforms = this.add.group();
  // 1) adding existing sprites to the physics system
  // sprite creation
  const ground = this.add.sprite(180, 604, "ground");
  // add sprite to the physics system, true flag makes it static
  this.physics.add.existing(ground, true);
  this.platforms.add(ground);

  //platform
  // tileSprite: repeate same sprite multiple times
  const platform = this.add.tileSprite(180, 500, 3 * 36, 1 * 30, "block");
  this.physics.add.existing(platform, true);
  this.platforms.add(platform);

  // player
  this.player = this.add.sprite(180, 400, "player", 3);
  this.physics.add.existing(this.player);

  // constraint player to the game bounds
  this.player.body.setCollideWorldBounds(true);

  // walking animation
  this.anims.create({
    key: "walking",
    frames: this.anims.generateFrameNames("player", {
      frames: [0, 1, 2]
    }),
    frameRate: 12,
    yoyo: true,
    repeat: -1
  });

  // collision detection
  this.physics.add.collider(this.player, this.platforms);

  // enable cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();
};

gameScene.update = function() {
  // are we on the ground?
  const onGround =
    this.player.body.blocked.down || this.player.body.touching.down;

  if (this.cursors.left.isDown) {
    this.player.body.setVelocityX(-this.playerSpeed);
    this.player.flipX = false;

    if (onGround && !this.player.anims.isPlaying) {
      this.player.anims.play("walking");
    }
  } else if (this.cursors.right.isDown) {
    this.player.body.setVelocityX(this.playerSpeed);
    this.player.flipX = true;

    if (onGround && !this.player.anims.isPlaying) {
      this.player.anims.play("walking");
    }
  } else {
    // make the player stop
    this.player.body.setVelocityX(0);

    // stop waling animation
    this.player.anims.stop("walking");

    // set default frame
    if (onGround) {
      this.player.setFrame(3);
    }
  }

  // handle jumping
  if (
    this.player.body.blocked.down &&
    (this.cursors.space.isDown || this.cursors.up.isDown)
  ) {
    // give the player a velocity in Y
    this.player.body.setVelocityY(this.jumpSpeed);

    // stop the walking animation
    this.player.anims.stop("walking");

    // change frame
    this.player.setFrame(2);
  }
};

// our game's configuration
const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: gameScene,
  title: "Monster Kong",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1000 },
      debug: true
    }
  }
};

// create the game, and pass it the configuration
const game = new Phaser.Game(config);

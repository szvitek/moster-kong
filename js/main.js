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

  this.load.json("levelData", "assets/json/levelData.json");
};

// executed once, after assets were loaded
gameScene.create = function() {
  // fire animation
  // this check is not really needed anymrore but I leave it here anyway
  if (!this.anims.get("burning")) {
    this.anims.create({
      key: "burning",
      frames: this.anims.generateFrameNames("fire", {
        frames: [0, 1]
      }),
      frameRate: 8,
      repeat: -1
    });
  }

  // walking animation
  if (!this.anims.get("walking")) {
    this.anims.create({
      key: "walking",
      frames: this.anims.generateFrameNames("player", {
        frames: [0, 1, 2]
      }),
      frameRate: 12,
      yoyo: true,
      repeat: -1
    });
  }

  // setup all level elements
  this.setupLevel();

  // init barrel spawner
  this.setupSpawner();

  // collision detection
  this.physics.add.collider(
    [this.player, this.goal, this.barrels],
    this.platforms
  );

  // overlap checks
  // only can do overlap checks with physic groups
  this.physics.add.overlap(
    this.player,
    [this.fires, this.goal, this.barrels],
    () => this.restartGame(),
    null,
    null
  );

  // enable cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();
};

gameScene.update = function() {
  // are we on the ground?
  const onGround =
    this.player.body.blocked.down || this.player.body.touching.down;

  if (this.cursors.left.isDown && !this.cursors.right.isDown) {
    this.player.body.setVelocityX(-this.playerSpeed);
    this.player.flipX = false;

    if (onGround && !this.player.anims.isPlaying) {
      this.player.anims.play("walking");
    }
  } else if (this.cursors.right.isDown && !this.cursors.left.isDown) {
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
  if (onGround && (this.cursors.space.isDown || this.cursors.up.isDown)) {
    // give the player a velocity in Y
    this.player.body.setVelocityY(this.jumpSpeed);

    // stop the walking animation
    this.player.anims.stop("walking");

    // change frame
    this.player.setFrame(2);
  }
};

gameScene.setupLevel = function() {
  this.levelData = this.cache.json.get("levelData");

  const { world } = this.levelData;

  // world bounds
  this.physics.world.bounds.width = world.width;
  this.physics.world.bounds.height = world.height;

  // create all the platforms
  // physics groups have better performance than regular groups
  this.platforms = this.physics.add.staticGroup();
  for (const platform of this.levelData.platforms) {
    let newObj;

    if (platform.numTiles === 1) {
      // create sprite
      newObj = this.add.sprite(platform.x, platform.y, platform.key);
    } else {
      // create tilesprite
      const width = this.textures.get(platform.key).get(0).width;
      const height = this.textures.get(platform.key).get(0).height;
      newObj = this.add.tileSprite(
        platform.x,
        platform.y,
        platform.numTiles * width,
        height,
        platform.key
      );
    }
    newObj.setOrigin(0, 0);

    // add to the group
    this.platforms.add(newObj);
  }

  // fire
  this.fires = this.physics.add.group({
    allowGravity: false,
    immovable: true
  });
  for (const platform of this.levelData.fires) {
    let newObj = this.add
      .sprite(platform.x, platform.y, "fire")
      .setOrigin(0, 0);

    // play burning animation
    newObj.anims.play("burning");

    // add to the group
    this.fires.add(newObj);
  }

  // player
  const { player } = this.levelData;
  this.player = this.add.sprite(player.x, player.y, "player", 3);
  this.physics.add.existing(this.player);

  // constraint player to the game bounds
  this.player.body.setCollideWorldBounds(true);

  // camera bounds
  this.cameras.main.setBounds(0, 0, world.width, world.height);
  this.cameras.main.startFollow(this.player);

  // goal
  const { goal } = this.levelData;
  this.goal = this.add.sprite(goal.x, goal.y, "goal");
  this.physics.add.existing(this.goal);
};

// restart game (game over / won)
gameScene.restartGame = function(sourceSprite, targetSprite) {
  // fade out
  this.cameras.main.fade(500);

  // when fade out completes, restart scene
  this.cameras.main.on("camerafadeoutcomplete", (camera, effect) => {
    // restart the scene
    this.scene.restart();
  });
};

gameScene.setupSpawner = function() {
  const { spawner } = this.levelData;

  this.barrels = this.physics.add.group({
    bounceX: 1,
    bounceY: 0.3,
    collideWorldBounds: true
  });

  // spawn barrels
  this.time.addEvent({
    delay: spawner.interval,
    loop: true,
    callback: () => {
      // create barrel
      const barrel = this.barrels.get(this.goal.x, this.goal.y, "barrel");

      barrel.setActive(true);
      barrel.setVisible(true);
      barrel.body.enable = true;

      // set
      barrel.setVelocityX(spawner.speed);

      // lifespan
      this.time.addEvent({
        delay: spawner.lifespan,
        repeat: 0,
        callback: () => {
          this.barrels.killAndHide(barrel);
          barrel.body.enable = false;
        }
      });
    }
  });
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
      debug: false
    }
  }
};

// create the game, and pass it the configuration
const game = new Phaser.Game(config);

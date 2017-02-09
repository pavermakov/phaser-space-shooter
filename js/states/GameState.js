var SpaceHipster = SpaceHipster || {};

SpaceHipster.GameState = {
  init: function() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.PLAYER_SPEED = 200;
    this.BULLET_SPEED = - 1000;
  },

  preload: function() {
    this.load.image('space', 'assets/images/space.png');
    this.load.image('player', 'assets/images/player.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.spritesheet('redEnemy', 'assets/images/redEnemySpritesheet.png', 225, 225, 4);
    this.load.image('purpleEnemy', 'assets/images/purpleEnemy.png');
    this.load.image('greenEnemy', 'assets/images/greenEnemy.png');
  },

  create: function() {
    this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');
    this.background.autoScroll(0, 30);

    // player
    this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 25, 'player');
    this.player.scale.setTo(0.1);
    this.player.anchor.setTo(0.5);
    this.game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    // bullets
    this._initBullets();

    // enemies
    this._initEnemies();
  },

  update: function() {
    this.game.physics.arcade.overlap(this.playerBullets, this.enemies, this._damageEnemy, null, this);
    this.player.body.velocity.x = 0;

    if(this.game.input.activePointer.isDown) {
      var targetX = this.game.input.activePointer.position.x;
      var direction = targetX > this.game.world.centerX ? 1 : -1;

      this.player.body.velocity.x = direction * this.PLAYER_SPEED;
    }
  },

  _initEnemies: function() {
    this.enemies = this.game.add.group();
    this.enemies.enableBody = true;

    var enemy = new SpaceHipster.Enemy(this.game, 100, 100, 'redEnemy', 10, []);
    this.enemies.add(enemy);

    enemy.body.velocity.x = 100;
    enemy.body.velocity.y = 50;
  },

  _initBullets: function() {
    this.playerBullets = this.game.add.group();
    this.playerBullets.enableBody = true;
    this.shootingTimer = this.game.time.events.loop(Phaser.Timer.SECOND / 5, this._createPlayerBullet, this);
  },

  _createPlayerBullet: function() {
    var bullet = this.playerBullets.getFirstExists(false);

    if(!bullet) {
      bullet = new SpaceHipster.PlayerBullet(this.game, this.player.x, this.player.top);
      this.playerBullets.add(bullet);
    } else {
      // reset position
      bullet.reset(this.player.x, this.player.top)
    }

    // set velocity
    bullet.body.velocity.y = this.BULLET_SPEED;
  },

  _damageEnemy: function(bullet, enemy) {
    enemy.damage(1);
    bullet.kill();
  }
}

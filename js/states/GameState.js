var SpaceHipster = SpaceHipster || {};

SpaceHipster.GameState = {
  init: function (currentLevel) {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.PLAYER_SPEED = 200;
    this.BULLET_SPEED = - 500;

    this.currentLevel = currentLevel ? currentLevel : 1;
    console.log('Current Level: ', this.currentLevel);
  },

  preload: function () {
    this.load.image('space', 'assets/images/space.png');
    this.load.image('player', 'assets/images/player.png');
    this.load.image('bullet', 'assets/images/bullet.png');
    this.load.image('enemyParticle', 'assets/images/enemyParticle.png');

    this.load.spritesheet('redEnemy', 'assets/images/redEnemySpritesheet.png', 45, 45, 4);
    this.load.spritesheet('greenEnemy', 'assets/images/greenEnemySpritesheet.png', 45, 45, 4);
    this.load.spritesheet('purpleEnemy', 'assets/images/purpleEnemySpritesheet.png', 45, 45, 4);

    this.load.text('levels', 'assets/data/levels.json');

    this.load.audio('blaster', ['assets/audio/blaster.mp3', 'assets/audio/blaster.ogg']);
    this.load.audio('crash', ['assets/audio/crash.mp3', 'assets/audio/crash.ogg'])
  },

  create: function () {
    this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');
    this.background.autoScroll(0, 30);

    // player
    this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - 25, 'player');
    this.player.anchor.setTo(0.5);
    this.game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    // bullets
    this._initBullets();

    // enemies
    this._initEnemies();

    this._loadLevel();
  },

  update: function () {
    this.game.physics.arcade.overlap(this.playerBullets, this.enemies, this._damageEnemy, null, this);
    this.game.physics.arcade.collide(this.enemyBullets, this.player, this._killPlayer, null, this);
    this.player.body.velocity.x = 0;

    if (this.game.input.activePointer.isDown) {
      var targetX = this.game.input.activePointer.position.x;
      var direction = targetX > this.game.world.centerX ? 1 : -1;

      this.player.body.velocity.x = direction * this.PLAYER_SPEED;
    }
  },

  _initEnemies: function () {
    this.enemies = this.game.add.group();
    this.enemies.enableBody = true;
    this.enemyCrashSound = this.game.add.audio('crash');

    this.enemyBullets = this.game.add.group();
    this.enemyBullets.enableBody = true;
  },

  _initBullets: function () {
    this.playerBullets = this.game.add.group();
    this.playerBullets.enableBody = true;
    this.playerBulletSound = this.game.add.audio('blaster');
    this.shootingTimer = this.game.time.events.loop(Phaser.Timer.SECOND / 3, this._createPlayerBullet, this);
  },

  _createPlayerBullet: function() {
    var bullet = this.playerBullets.getFirstExists(false);

    if (!bullet) {
      bullet = new SpaceHipster.PlayerBullet(this.game, this.player.x, this.player.top);
      this.playerBullets.add(bullet);
    } else {
      // reset position
      bullet.reset(this.player.x, this.player.top)
    }

    // set velocity
    bullet.body.velocity.y = this.BULLET_SPEED;
    this.playerBulletSound.play();
    this.playerBulletSound.volume = 0.15;
  },

  _createEnemy: function (x, y, health, key, scale, speedX, speedY) {
    var enemy = this.enemies.getFirstExists(false);

    if (!enemy) {
      enemy = new SpaceHipster.Enemy(this.game, x, y, key, health, this.enemyBullets);
    }

    this.enemies.add(enemy);
    enemy.reset(x, y, health, key, scale, speedX, speedY);
  },

  _damageEnemy: function (bullet, enemy) {
    enemy.damage(1);
    bullet.kill();
    this.enemyCrashSound.play();
  },

  _killPlayer: function () {
    this.player.kill();
    this.game.state.start('GameState');
  },

  _loadLevel: function () {
    this.currentEnemyIndex = 0;
    this.levelsData = JSON.parse(this.game.cache.getText('levels'));

    this.endOfLevelTimer = this.game.time.events.add(this.levelsData[this.currentLevel].duration * 1000, function(){
      console.log('Level Ended!');
      if(this.currentLevel < this.levelsData.length - 1){
        this.currentLevel++;
      } else {
        this.currentLevel = 1;
      }

      this.game.state.start('GameState', true, false, this.currentLevel);
    }, this);

    this._scheduleNextEnemy();
  },

  _scheduleNextEnemy: function () {
    var nextEnemy = this.levelsData[this.currentLevel].enemies[this.currentEnemyIndex];

    if(nextEnemy) {
      var nextTime = nextEnemy.time - (this.currentEnemyIndex === 0 ? 0 : this.levelsData[this.currentLevel].enemies[this.currentEnemyIndex - 1].time);
      nextTime *= 1000;

      var x = nextEnemy.x * this.game.world.width;
      var y = -100;
      var health = nextEnemy.health;
      var key = nextEnemy.key;
      var scale = nextEnemy.scale;
      var speedX = nextEnemy.speedX;
      var speedY = nextEnemy.speedY;

      this.nextEnemyTimer = this.game.time.events.add(nextTime, function() {
        this._createEnemy(x, y, health, key, scale, speedX, speedY);
        this.currentEnemyIndex++;
        this._scheduleNextEnemy();
      }, this);
    }
  }
}

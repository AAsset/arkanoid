const KEYS = {
    LEFT: 37,
    RIGHT: 39,
    SPACE: 32
};

let game = {
    ctx: null,
    ball: null,
    platform: null,
    blocks: [],
    score: 0,
    cols: 8,
    rows: 4,
    width: 640,
    height: 360,
    running: true,
    sprites: {
        background: null,
        ball: null,
        platform: null,
        block: null
    },
    sounds: {
        bump: null
    },
    init() {
        this.ctx = document.getElementById('mycanvas').getContext('2d');
        this.setTextFont();
        this.setEvents();
    },
    setTextFont() {
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ffffff';
    },
    setEvents() {
        window.addEventListener('keydown', e => {
            if (e.keyCode === KEYS.SPACE) {
                this.platform.fire();
            } else if (e.keyCode === KEYS.LEFT || e.keyCode === KEYS.RIGHT) {
                this.platform.start(e.keyCode);
            }
        });
        window.addEventListener('keyup', e => {
            this.platform.stop();
        });
    },
    preload(callback) {
        let loaded = 0,
            required = Object.keys(this.sprites).length;

        required += Object.keys(this.sounds).length;

        let onResourceLoad = () => {
            ++loaded;
            if (loaded >= required) {
                callback();
            }
        }
        this.preloadSprites(onResourceLoad);
        this.preloadSounds(onResourceLoad);
    },
    preloadSprites(onResourceLoad) {
        for (const key in this.sprites) {
            this.sprites[key] = new Image();
            this.sprites[key].src = `images/${key}.png`;
            this.sprites[key].addEventListener('load', onResourceLoad);
        }
    },
    preloadSounds(onResourceLoad) {
        for (const key in this.sounds) {
            this.sounds[key] = new Audio(`sounds/${key}.mp3`);
            this.sounds[key].addEventListener('canplaythrough', onResourceLoad, {once: true});
        }
    },
    create() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.blocks.push({
                    active: true,
                    width: 60,
                    height: 20,
                    x: 64 * col + 65,
                    y: 24 * row + 35,
                });
            }
        }
    },
    update() {
        this.collideBlocks();
        this.collidePlatform();
        this.ball.collideWorldBounds();
        this.platform.collideWorldBounds();
        this.ball.move();
        this.platform.move();
    },
    addScore() {
        ++this.score;

        if (this.score >= this.blocks.length) {
            this.end('You win!');
        }
    },
    collideBlocks() {
        for (const block of this.blocks) {
            if (block.active && this.ball.collide(block)) {
                this.ball.bumpBlock(block);
                this.addScore();
                this.sounds.bump.play();
            }
        }
    },
    collidePlatform() {
        if (this.ball.collide(this.platform)) {
            this.ball.bumpPlatform(this.platform);
            this.sounds.bump.play();
        }
    },
    run() {
        if (this.running) {
            window.requestAnimationFrame(() => {
                this.update();
                this.render();
                this.run();
            });
        }
    },
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.sprites.background, 0, 0);
        this.ctx.drawImage(this.sprites.ball, this.ball.frame * this.ball.width, 0, this.ball.width, this.ball.height, this.ball.x, this.ball.y, this.ball.width, this.ball.height);
        this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
        this.renderBlocks();
        this.ctx.fillText(`Score: ${this.score}/${this.blocks.length}`, 15, 20);
    },
    renderBlocks() {
        for (let block of this.blocks) {
            if (block.active) {
                this.ctx.drawImage(this.sprites.block, block.x, block.y);
            }
        }
    },
    start() {
        this.init();
        this.preload(() => {
            this.create();
            this.run();
        });
    },
    end(message) {
        this.running = false;
        alert(message);
        window.location.reload();
    },
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
};

game.ball = {
    velocity: 3,
    dx: 0,
    dy: 0,
    frame: 0,
    width: 20,
    height: 20,
    x: game.width / 2,
    y: game.height - 80,
    start() {
        this.dy = -this.velocity;
        this.dx = game.random(-this.velocity, this.velocity);
        this.animateBall();
    },
    animateBall() {
        setInterval(() => {
            ++this.frame;
            this.frame = this.frame > 3 ? 0 : this.frame;
        }, 100);
    },
    move() {
        if (this.dy) {
            this.y += this.dy;
        }
        if (this.dx) {
            this.x += this.dx;
        }
    },
    collide(element) {
        let x = this.x + this.dx,
            y = this.y + this.dy;

        return x + this.width > element.x
            && x < element.x + element.width
            && y + this.height > element.y
            && y < element.y + element.height;
    },
    collideWorldBounds() {
        let x = this.x + this.dx,
            y = this.y + this.dy;

        let ballLeft = x,
            ballRight = ballLeft + this.width,
            ballTop = y,
            ballBottom = ballTop + this.height;

        let worldLeft = 0,
            worldRight = game.width,
            worldTop = 0,
            worldBottom = game.height;

        if (ballLeft < worldLeft) {
            this.x = 0;
            this.dx = this.velocity;
            game.sounds.bump.play();
        } else if (ballRight > worldRight) {
            this.x = worldRight - this.width;
            this.dx = -this.velocity;
            game.sounds.bump.play();
        } else if (ballTop < worldTop) {
            this.y = 0;
            this.dy = this.velocity;
            game.sounds.bump.play();
        } else if (ballBottom > worldBottom) {
            game.end(`You lose! You scored ${game.score} points.`);
        }
    },
    bumpBlock(block) {
        this.dy *= -1;
        block.active = false;

    },
    bumpPlatform(platform) {
        if (platform.dx) {
            this.x += platform.dx;
        }

        if (this.dy > 0) {
            this.dy = -this.velocity;
            let touchX = this.x + this.width / 2;
            this.dx = this.velocity * platform.getTouchOffset(touchX);
        }
    }
};

game.platform = {
    velocity: 6,
    dx: 0,
    width: 100,
    height: 14,
    x: game.width / 2 - 2 * game.ball.width,
    y: game.height - 60,
    ball: game.ball,
    fire() {
        if (this.ball) {
            this.ball.start();
            this.ball = null;
        }
    },
    start(direction) {
        this.dx = direction === KEYS.LEFT ? -this.velocity : this.velocity;
    },
    stop() {
        this.dx = 0;
    },
    move() {
        if (this.dx) {
            this.x += this.dx;
            if (this.ball) {
                this.ball.x += this.dx;
            }
        }
    },
    getTouchOffset(x) {
        let diff = (this.x + this.width) - x,
            offset = this.width - diff,
            result = 2 * offset / this.width;
        return result - 1;
    },
    collideWorldBounds() {
        let x = this.x + this.dx;

        let platformLeft = x,
            platformRight = platformLeft + this.width;

        let worldLeft = 0,
            worldRight = game.width;

        if (platformLeft < worldLeft || platformRight > worldRight) {
            this.dx = 0;
        }
    },
};

window.addEventListener('load', () => {
    game.start();
});

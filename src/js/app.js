/**
 * Created by Ardobras on 02.07.2015.
 */

$(document).ready(loadQ);

var queue,spriteSheet;

function loadQ() {
    queue = new createjs.LoadQueue(true);
    queue.loadFile({id:"coin", src:"images/coin.png"});
    queue.loadFile({id:"coin_invulnerable", src:"images/coin_invulnerable.png"});
    queue.loadFile({id:"coin_bad", src:"images/coin_bad.png"});
    queue.loadFile({id:"bg", src:"images/background2.jpg"});
    createjs.Sound.registerSound("sounds/jump.mp3", "jump");
    createjs.Sound.registerSound("sounds/coin.wav", "coin");
    createjs.Sound.registerSound("sounds/death.mp3", "death");
    var data = {
        images: ["images/sprite.png"],
        frames: {width:48, height:48},
        animations: {
            dead:[0],
            jump:[1],
            run: {
                frames: [5, 6, 7 , 6],
                speed:0.1
            }
        }
    };

    spriteSheet = new createjs.SpriteSheet(data);
    queue.on("complete", mainMenu, this);
}

function init() {
    console.log("Hello WORLD");

    var stage = new createjs.Stage("canvas");
    createjs.Touch.enable(stage);

    stage.canvas.width = $(window).width();
    stage.canvas.height = $(window).height();

    var skyhigh = stage.canvas.height - 600 - 150;

    if(skyhigh > 0) {
        var sky = new createjs.Shape();
        sky.graphics.beginFill('rgb(16,43,206)').drawRect(0, 0, stage.canvas.width, skyhigh);
        sky.x = 0;
        sky.y = 0;
        stage.addChild(sky);
    }


    var bg1 = new createjs.Bitmap(queue.getResult("bg"));
    var bg2 = new createjs.Bitmap(queue.getResult("bg"));

    bg1.y = stage.canvas.height - 150 - 600;
    bg2.y = stage.canvas.height - 150 - 600;

    bg1.x = 0;
    bg2.x = 2500;

    stage.addChild(bg1);
    stage.addChild(bg2);

    animate(bg1);
    animate2();

    var bg_speed = 8000;

    function animate(bg) {
        createjs.Tween.get(bg)
            .to({x: -2500}, bg_speed, createjs.Ease.linear).call(
            function() {
                bg.x = 2500;
                createjs.Tween.get(bg).to({ x: 0 }, bg_speed, createjs.Ease.linear).call(function () {
                    animate(bg);
                });
            }
        )
    }

    function animate2() {
        createjs.Tween.get(bg2)
            .to({x: 0}, bg_speed, createjs.Ease.linear).call(
            function() {
                animate(bg2);
            }
        )
    }




    var floor = new createjs.Shape();
    floor.height = 150;
    floor.graphics.beginFill('rgb(55,56,69)').drawRect(0, 0, stage.canvas.width, floor.height);
    floor.x = 0;
    floor.y = stage.canvas.height - floor.height;
    stage.addChild(floor);

    var player = new Player();
    player.create();

    $(document).off("keydown");
    $(document).on('keydown',function(event) {
        if(event.keyCode == 32) {
            if(player.isAlive) {
                player.jump();
            } else {
                if(!player.tween) reset();
            }
        }
    });

    $(document).off("touchstart");
    $(document).on('touchstart',function() {
        if(player.isAlive) {
            player.jump();
        } else {
            if(!player.tween) reset();
        }
    });


    function Player(sprite) {
        this.isAlive = true;
        this.sprite = sprite;
        this.width = 40;
        this.height = 48;
        this.jumpheight = 100;
        this.collides = {
            points:0,
            on:true
        };
        this.create = function() {
            var pSprite = new createjs.Sprite(spriteSheet, "run");
            pSprite.x = this.x = (stage.canvas.width / 2 ) - this.width / 2 ;
            pSprite.y = this.y =  stage.canvas.height - floor.height - this.height;
            this.sprite = stage.addChild(pSprite);
        };
        this.die = function() {
            this.isAlive = false;
            createjs.Tween.removeTweens(this.sprite);
            createjs.Sound.play("death");
            stage.removeChild(this.sprite);
            var pSprite = new createjs.Sprite(spriteSheet, "dead");
            pSprite.x = this.x = (stage.canvas.width / 2 ) - this.width / 2 ;
            pSprite.y = this.y =  stage.canvas.height - floor.height - this.height;
            this.sprite = stage.addChild(pSprite);
            var context = this;
            this.tween = createjs.Tween.get(this.sprite)
                .to({ y: this.y - this.jumpheight }, 500, createjs.Ease.circOut)
                .to({ y: stage.canvas.height }, 500, createjs.Ease.circIn).call(function() {context.tween = null})
        };
        this.jump = function() {
            if(!this.tween) {
                stage.removeChild(this.sprite);
                var pSprite = new createjs.Sprite(spriteSheet, "jump");
                pSprite.x = this.x = (stage.canvas.width / 2 ) - this.width / 2 ;
                pSprite.y = this.y =  stage.canvas.height - floor.height - this.height;
                this.sprite = stage.addChild(pSprite);
                var context = this;
                createjs.Sound.play("jump");
                this.tween = createjs.Tween.get(this.sprite)
                    .to({ y: this.y - this.jumpheight }, 500, createjs.Ease.circOut)
                    .to({ y: this.y }, 500, createjs.Ease.circIn).call(function() {
                        context.tween = null;
                        stage.removeChild(context.sprite);
                        var pSprite = new createjs.Sprite(spriteSheet, "run");
                        pSprite.x = context.x = (stage.canvas.width / 2 ) - context.width / 2 ;
                        pSprite.y = context.y =  stage.canvas.height - floor.height - context.height;
                        context.sprite = stage.addChild(pSprite);

                    })
            }
        };
        this.collect = function() {
            createjs.Sound.play("coin");
        };
    }


    var scoreText = new createjs.Text("Coins: 0", "20px Arial", "#fff");
    scoreText.x = (stage.canvas.width * 0.9);
    scoreText.y = Math.round(stage.canvas.height * 0.05);
    scoreText.textAlign = "center";
    scoreText.score = 0;

    stage.addChild(scoreText);

    //Obstacles

    var obstacles = [], speed = 4, coins = [], specialtext_good, specialtext_bad, obstacle_factor = 0.001;

    function obstacleCourse() {

        if(obstacles.length < 1 || Math.random() < (0.001 * scoreText.score / 5) + obstacle_factor) {
            createObstacle();
        }

        if(Math.random() < 0.005) {
            createCoin();
        }

        coins.forEach(function(coin) {
            if(checkCollision(coin)) {
                if(!coin.scored) {
                    coin.scored = true;
                    createjs.Tween.removeTweens(coin);
                    stage.removeChild(coin);
                    coins = coins.filter(function(element,i){
                        return element.id !== coin.id;
                    });
                    if(coin.hasOwnProperty("special")) {

                        switch (coin.special) {
                            case "invulnerable":
                                if(player.collides.points == 0) {
                                    specialtext_good = new createjs.Text("Invulernable!", stage.canvas.width / 35 + "px Arial", "#0F0");
                                    specialtext_good.x = (stage.canvas.width / 2);
                                    specialtext_good.y = Math.round(stage.canvas.height * 0.1);
                                    specialtext_good.textAlign = "center";
                                    stage.addChild(specialtext_good);
                                    player.collides.on = false;
                                }

                                player.collides.points++;

                                setTimeout(function(){
                                    player.collides.points--;
                                    if(player.collides.points == 0) {
                                        player.collides.on = true;
                                        stage.removeChild(specialtext_good);
                                        specialtext_good = null;
                                    }
                                },5000);

                                break;
                            case "bad":

                                if(specialtext_bad == null) {
                                    specialtext_bad = new createjs.Text("More obstacles :(", stage.canvas.width / 35 + "px Arial", "#F00");
                                    specialtext_bad.x = (stage.canvas.width / 2);
                                    specialtext_bad.y = Math.round(stage.canvas.height * 0.15);
                                    specialtext_bad.textAlign = "center";
                                    stage.addChild(specialtext_bad);
                                }
                                obstacle_factor = obstacle_factor + 0.001;

                                setTimeout(function(){

                                    stage.removeChild(specialtext_bad);
                                    specialtext_bad = null;

                                },1000);

                                break;
                        }

                    } else {
                        scorePoint();
                    }
                    player.collect();

                }

            }
        });


        obstacles.forEach(function(obstacle) {
            if(player.collides.on && checkCollision(obstacle)) {
                player.die();
            }
        });

        function checkCollision(obstacle) {
            if(player.x + player.width > obstacle.x && player.x < obstacle.x + obstacle.width) {
                if(player.sprite.y + player.height < obstacle.y) {
                    return false;
                }
                return player.sprite.y <= obstacle.y + obstacle.height;
            }
            return false;
        }

    }

    function createObstacle() {
        var width = Math.round(Math.random() * 70 + 10);
        var height = Math.round(Math.random() * 50 + 30);

        var obstacle = new createjs.Shape();
        obstacle.graphics.beginFill('red').drawRect(0, 0, width, height);
        obstacle.x = stage.canvas.width - width;
        obstacle.y = stage.canvas.height - 150 - height;
        obstacle.width = width;
        obstacle.height = height;
        stage.addChild(obstacle);

        createjs.Tween.get(obstacle)
            .to({ x: 0 - obstacle.width }, stage.canvas.width * speed, createjs.Ease.linear)
            .call(function() {
                stage.removeChild(obstacle);
                obstacles.shift();
            });
        obstacles.push(obstacle);
    }

    function createCoin() {

        var width = 30;
        var height = 30;

        var coin;


        var random = Math.random();

        if(random < 0.05) {
            coin = new createjs.Bitmap(queue.getResult("coin_invulnerable"));
            coin.special = "invulnerable";
        } else if(random > 0.9) {
            coin = new createjs.Bitmap(queue.getResult("coin_bad"));
            coin.special = "bad";
        } else {
            //Normaler Coin
            coin = new createjs.Bitmap(queue.getResult("coin"));
        }

        coin.x = stage.canvas.width;
        coin.y = stage.canvas.height - 150 - (Math.random() * 100) - height;
        coin.width = width;
        coin.height = height;
        stage.addChild(coin);

        coin.id = Math.round(random * 100);
        coin.scored = false;

        createjs.Tween.get(coin)
            .to({ x: 0 - coin.width }, stage.canvas.width * speed, createjs.Ease.linear)
            .call(function() {
                stage.removeChild(coin);
                delete coins[coin.id];
            });
        if(typeof coins[coin.id] === "undefined") {
            coins[coin.id] = coin;
        } else {
            var repeat = true;
            do {
                var id = Math.round(Math.random() * 100);
                if(typeof coins[id] === "undefined") {
                    coin.id = id;
                    coins[id] = coin;
                    repeat = false;
                }
            } while(repeat);
        }
        coins.push(coin);
    }

    //GameLoop
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);

    var text,restart,once;

    function tick() {
        if(player.isAlive) {
            stage.update();
            obstacleCourse();
        } else {
            if(!once) {
                if(specialtext_bad) stage.removeChild(specialtext_bad);
                if(specialtext_good) stage.removeChild(specialtext_good);

                console.log("Collision! :(");
                text = new createjs.Text("GAME OVER", "25px Arial", "#fff");
                text.x = (stage.canvas.width / 2);
                text.y = Math.round(stage.canvas.height * 0.1);
                text.textAlign = "center";

                text.textBaseline = "alphabetic";
                stage.addChild(text);
                restart = new createjs.Text("RESTART? (Press Space / Touch)", "25px Arial", "#FFF");
                restart.x = (stage.canvas.width / 2);
                restart.y = Math.round(stage.canvas.height * 0.15);
                restart.textBaseline = "alphabetic";
                restart.textAlign = "center";
                stage.addChild(restart);
                restart.addEventListener("click",reset);
                obstacles.forEach(function(obstacle) {
                    createjs.Tween.removeTweens(obstacle);
                });
                coins.forEach(function(coin) {
                    createjs.Tween.removeTweens(coin);
                });
                createjs.Tween.removeTweens(bg1);
                createjs.Tween.removeTweens(bg2);
                once = "done";
            }
            stage.update();
        }
    }

    function reset() {
        createjs.Ticker.off("tick");
        stage.autoClear = true; // This must be true to clear the stage.
        stage.removeAllChildren();
        init();
        stage.update();
    }

    function scorePoint(reset) {
        if(reset) {
            scoreText.text = "Coins: 0";
            scoreText.score = 0;
        } else {
            scoreText.text = "Coins: " + ++scoreText.score;
        }
    }
}

function mainMenu() {
    var stage = new createjs.Stage("canvas");

    stage.canvas.width = $(window).width();
    stage.canvas.height = $(window).height();

    $(document).off("keydown");
    $(document).on('keydown',function(event) {
        if(event.keyCode == 32) {
            init();
        }
    });

    $(document).off("touchstart");
    $(document).on('touchstart',function() {
        init();
    });

    var sky = new createjs.Shape();
    sky.graphics.beginFill('rgb(0,0,128)').drawRect(0, 0, stage.canvas.width, stage.canvas.height);
    sky.x = 0;
    sky.y = 0;
    stage.addChild(sky);

    var pSprite = new createjs.Sprite(spriteSheet, "run");
    pSprite.x = (stage.canvas.width / 2 );
    pSprite.y =  stage.canvas.height * 0.5;
    stage.addChild(pSprite);

    var text = new createjs.Text("Mario on the moon", stage.canvas.width / 15 + "px Arial", "#ffffff");
    text.x = (stage.canvas.width / 2);
    text.y = Math.round(stage.canvas.height * 0.2);
    text.textAlign = "center";
    stage.addChild(text);

    var start = new createjs.Text("Press Space / Touch to start", stage.canvas.width / 22 + "px Arial", "#ffffff");
    start.x = (stage.canvas.width / 2);
    start.y = Math.round(stage.canvas.height * 0.8);
    start.textAlign = "center";
    stage.addChild(start);

    stage.update();
}
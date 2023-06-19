// import {
//     Application,
//     Container,
//     Graphics,
//     Loader,
//     Rectangle,
//     Sprite,
//     SpritesheetLoader,
//     TextStyle,
//     utils,
//     Text
// } from "pixi.js";

const loader = PIXI.Loader.shared;
const resource = PIXI.Loader.shared.resources;
const onProgress = PIXI.Loader.shared.onProgress;
const TextureCache = PIXI.utils.TextureCache;

const app = new PIXI.Application({
    width: 512,
    height: 512,
    antialias: true,
});
app.renderer.backgroundColor = 0x061639;

app.renderer.view.style.position = "absolute";
app.renderer.view.style.top = "50%";
app.renderer.view.style.left = "50%";
app.renderer.view.style.transform = "translate(-50%,-50%)";
app.renderer.view.style.border = "1px solid #d8d8d8";

document.body.appendChild(app.view);

window.addEventListener("keydown", function (e) {
    keyState[e.keyCode || e.which] = true;
}, true);
window.addEventListener('keyup', function (e) {
    keyState[e.keyCode || e.which] = false;
}, true);

onProgress.add(loadProgessHandler);
loader
    .add("images/treasureHunter.json")
    .load(setup);

function loadProgessHandler(loader, resource) {
    console.log("loading: " + resource.url);
    console.log("progess: " + loader.progess)
}

let door, dungeon, treasure, explorer, blobs = [];
let vy = 2;
let move = 5;
let isCollisionTreasure = false;
var secondFrame = 0;
var keyState = {};
let gameScene, gameOverScene, healthBar;
let winMess, lossMess;
function setup() {
    gameScene = new PIXI.Container();
    app.stage.addChild(gameScene);

    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    app.stage.addChild(gameOverScene);

    dungeon = new PIXI.Sprite(TextureCache["dungeon.png"]);
    gameScene.addChild(dungeon);


    door = new PIXI.Sprite(TextureCache["door.png"]);
    door.x = 32;
    gameScene.addChild(door);

    treasure = new PIXI.Sprite(TextureCache["treasure.png"]);
    treasure.y = app.stage.height / 2 - treasure.height;
    treasure.x = app.stage.width - treasure.width;
    gameScene.addChild(treasure);

    explorer = new PIXI.Sprite(TextureCache["explorer.png"]);
    gameScene.addChild(explorer);
    explorer.x = 50;
    explorer.y = app.stage.height / 2 - explorer.height;

    let spacing = 48;
    let numBlob = 6;
    let xOffset = 150;
    for (let i = 0; i < numBlob; i++) {
        const blob = new PIXI.Sprite(TextureCache["blob.png"]);
        const blobX = i * spacing + xOffset;
        const blobY = randomLocationBlob(door.height, app.stage.height - door.height - blob.height);
        blob.x = blobX;
        blob.y = blobY;
        i % 2 == 0 ? blob.vy = vy : blob.vy = -vy;
        gameScene.addChild(blob);
        blobs.push(blob);
    }

    //Health bar
    healthBar = new PIXI.Container();
    healthBar.position.set(512 - 150, 0);
    gameScene.addChild(healthBar);

    const innerBar = new PIXI.Graphics();
    innerBar.beginFill(0x000000);
    innerBar.drawRoundedRect(0, 0, 128, 8);
    innerBar.endFill();
    healthBar.addChild(innerBar);

    const outerBar = new PIXI.Graphics();
    outerBar.beginFill(0xFF0000);
    outerBar.drawRoundedRect(0, 0, 128, 8);
    outerBar.endFill();
    healthBar.addChild(outerBar);
    healthBar.outer = outerBar;
    healthBar.width = 128;

    //Text message
    const style = new PIXI.TextStyle({
        fontFamily: "Futura",
        fontSize: 64,
        fill: "white"
    });

    winMess = new PIXI.Text("YOU WIN", style);
    winMess.position.set(100, 220);
    winMess.visible = false;
    gameOverScene.addChild(winMess);

    lossMess = new PIXI.Text("YOU LOSE", style);
    lossMess.position.set(100, 220);
    lossMess.visible = false;
    gameOverScene.addChild(lossMess);

    app.ticker.add((delta) => {
        gameLoop(delta);
    });

}

function gameLoop(delta) {
    secondFrame = delta;
    explorer.alpha = 1;
    if (keyState[37]) {
        explorer.x -= 3;
    }
    if (keyState[38]) {
        explorer.y -= 3;
    }
    if (keyState[39]) {
        explorer.x += 3;
    }
    if (keyState[40]) {
        explorer.y += 3;
    }
    //check collision explorer
    let collisionExplorer = checkCollisionCanvas(explorer);
    switch (collisionExplorer) {
        case "bottom":
            explorer.y = app.stage.height - door.height - explorer.height;
            break;
        case "top":
            explorer.y = 0;
            break;
        case "right":
            explorer.x = app.stage.height - door.width;
            break;
        case "left":
            explorer.x = door.width;
            break;

        default:
            break;
    }
    //check collision blobs
    for (let i = 0; i < blobs.length; i++) {
        blobs[i].y += blobs[i].vy;
        //let collision = checkCollision(blobs[i]);
        if (checkCollisionBlobs(blobs[i])) {
            healthBar.outer.width -= 2;
            explorer.alpha = 0.5;
        }
        if (checkCollisionCanvas(blobs[i]) === "bottom") {
            blobs[i].y = app.stage.height - door.height - blobs[i].height;
            blobs[i].vy *= -1;
        } else if (checkCollisionCanvas(blobs[i]) === "top") {
            blobs[i].y = 0;
            blobs[i].vy *= -1;
        }
    }
    //check collision with treasure
    if (explorer.x >= app.stage.width - treasure.width - explorer.width &&
        explorer.y < app.stage.height / 2 &&
        explorer.y > app.stage.height / 2 - explorer.height - treasure.height) {
        isCollisionTreasure = true;
    }
    if (isCollisionTreasure) {
        treasure.x = explorer.x;
        treasure.y = explorer.y;
    }

    //check game over
    if (healthBar.outer.width <= 0) {
        gameScene.visible = false;
        gameOverScene.visible = true;
        lossMess.visible = true;
        return;
    }

    //check game win
    if (explorer.y < door.y + 10 && explorer.x > door.x &&
        explorer.x < door.x + door.width - explorer.width &&
        treasure.x == explorer.x && treasure.y == explorer.y) {
        gameScene.visible = false;
        gameOverScene.visible = true;
        winMess.visible = true;
        return;
    }
}

function checkCollisionCanvas(sprite) {
    let collision = undefined;
    if (sprite.y > app.stage.height - door.height - sprite.height) {
        collision = "bottom";
    } else if (sprite.y < 0) {
        collision = "top";
    } else if (sprite.x < door.width) {
        collision = "left";
    } else if (sprite.x > app.stage.height - door.width) {
        collision = "right";
    }
    return collision;
}

function checkCollisionBlobs(blob) {
    if (explorer.x + explorer.width > blob.x + 10 && explorer.x < blob.x + blob.width - 10 &&
        explorer.y < blob.y + blob.height && explorer.y > blob.y - explorer.height) {
        return true;
    }
}

function randomLocationBlob(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// function onKeyDown(event) {
//     switch (event.keyCode) {
//         case 37:
//             explorer.x -= move;
//             break;
//         case 38:
//             explorer.y -= move;
//             break;
//         case 39:
//             explorer.x += move;
//             break;
//         case 40:
//             explorer.y += move;
//             break;
//         default:
//             break;
//     }
// }


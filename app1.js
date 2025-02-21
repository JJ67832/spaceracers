const app = new PIXI.Application({ width: 800, height: 600 });
document.body.appendChild(app.view);

const ufoList = [];
const cometList = [];
let startTime = Date.now();
let isGameRunning = true;
let attempts = 0;
let destroyedUFOs = 0;
let spawnInterval = 1000; // Anfangsintervall für UFO- und Kometenspawn (langsamer Start)
let spawnRateIncreaseTime = 2000; // Erhöhen alle 2 Sekunden
let lastIncreaseTime = Date.now();

// Text für den Startbildschirm
const startText = new PIXI.Text('The space race begins...', {
    fontFamily: 'Arial',
    fontSize: 30,
    fill: 'white',
    align: 'center'
});
startText.anchor.set(0.5);
startText.x = app.view.width / 2;
startText.y = app.view.height / 2;
app.stage.addChild(startText);

// Nach 5 Sekunden den Starttext ausblenden
setTimeout(() => {
    app.stage.removeChild(startText);
}, 5000);

// Create Rocket
const rocket = PIXI.Sprite.from('bilder/spaceshuttle.png');
rocket.x = 250;
rocket.y = 450;
rocket.scale.set(0.05);
app.stage.addChild(rocket);

// HUD (Top Right, Lowered)
const hudText = new PIXI.Text('Time: 0.00s\nAttempts: 0\nDestroyed UFOs: 0', {
    fontFamily: 'Arial',
    fontSize: 20,
    fill: 'white',
    align: 'right'
});
hudText.anchor.set(1, 0);
hudText.x = app.view.width - 10;
hudText.y = 80;
app.stage.addChild(hudText);

// Exit Button (Image + Text)
const exitContainer = new PIXI.Container();
exitContainer.x = 10;
exitContainer.y = 80;
exitContainer.interactive = true;
exitContainer.buttonMode = true;
exitContainer.on('pointerdown', showExitMenu);

// Exit Image
const exitIcon = PIXI.Sprite.from('bilder/exit.png');
exitIcon.scale.set(0.1);
exitContainer.addChild(exitIcon);
app.stage.addChild(exitContainer);

// Game Over Text
const gameOverText = new PIXI.Text('GAME OVER', {
    fontFamily: 'Arial',
    fontSize: 50,
    fill: 'red',
    fontWeight: 'bold'
});
gameOverText.x = app.view.width / 2 - 150;
gameOverText.y = app.view.height / 2 - 100;
gameOverText.visible = false;
app.stage.addChild(gameOverText);

// Restart Button
const restartButton = new PIXI.Container();
restartButton.x = app.view.width / 2 - 75;
restartButton.y = app.view.height / 2 + 50;
restartButton.visible = false;

// Button Background
const buttonBg = new PIXI.Graphics();
buttonBg.beginFill(0xffffff);
buttonBg.drawRoundedRect(0, 0, 150, 50, 10);
buttonBg.endFill();
restartButton.addChild(buttonBg);

// Button Text
const restartText = new PIXI.Text('Restart', {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 'black'
});
restartText.anchor.set(0.5);
restartText.x = 75;
restartText.y = 25;
restartButton.addChild(restartText);

// Restart Button Interactivity
restartButton.interactive = true;
restartButton.buttonMode = true;
restartButton.on('pointerdown', restartGame);
restartButton.on('pointerover', () => buttonBg.tint = 0xdddddd);
restartButton.on('pointerout', () => buttonBg.tint = 0xffffff);
app.stage.addChild(restartButton);

// Exit Menu
const exitMenu = new PIXI.Container();
exitMenu.visible = false;

// Menu Background
const menuBg = new PIXI.Graphics();
menuBg.beginFill(0xffffff);
menuBg.drawRect(0, 0, 300, 200);
menuBg.endFill();
exitMenu.addChild(menuBg);
exitMenu.x = app.view.width / 2 - 150;
exitMenu.y = app.view.height / 2 - 100;

// Menu Text
const menuText = new PIXI.Text('Game Paused', {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: 'black',
    align: 'center'
});
menuText.anchor.set(0.5);
menuText.x = 150;
menuText.y = 30;
exitMenu.addChild(menuText);

// Continue Button
const continueButton = new PIXI.Text('Continue', {
    fontFamily: 'Arial',
    fontSize: 20,
    fill: 'black'
});
continueButton.anchor.set(0.5);
continueButton.x = 150;
continueButton.y = 90;
continueButton.interactive = true;
continueButton.buttonMode = true;
continueButton.on('pointerdown', hideExitMenu);
exitMenu.addChild(continueButton);

// Exit Button
const exitGameButton = new PIXI.Text('Exit Game', {
    fontFamily: 'Arial',
    fontSize: 20,
    fill: 'black'
});
exitGameButton.anchor.set(0.5);
exitGameButton.x = 150;
exitGameButton.y = 140;
exitGameButton.interactive = true;
exitGameButton.buttonMode = true;
exitGameButton.on('pointerdown', () => window.location.href = 'index.html');
exitMenu.addChild(exitGameButton);

app.stage.addChild(exitMenu);

// UFO Spawning
gameInterval(function () {
    if (!isGameRunning) return;

    const ufo = PIXI.Sprite.from('bilder/ufo' + random(1, 2) + '.png');
    ufo.x = random(0, 700);
    ufo.y = 10;
    ufo.scale.set(0.1);
    app.stage.addChild(ufo);
    ufoList.push(ufo);
    flyDown(ufo, 5);

    waitForCollision(ufo, rocket).then(function () {
        app.stage.removeChild(rocket);
        stopGame();
    });

    // Kometen-Spawning (mit zufälliger Häufigkeit)
    if (Math.random() < 0.05) {  // 10% Chance
        const comet = PIXI.Sprite.from('bilder/komet' + random(1, 2) + '.png');
        comet.x = random(0, 700);
        comet.y = -50; // Startposition über dem Bildschirm
        comet.scale.set(0.1);
        app.stage.addChild(comet);
        cometList.push(comet);
        flyDown(comet, 2); // Langsame Bewegung nach unten

        // Kollision mit Komet prüfen
        waitForCollision(comet, rocket).then(function () {
            app.stage.removeChild(rocket);
            app.stage.removeChild(comet);
            stopGame();
        });
    }

}, spawnInterval);

// Timer & HUD Update
app.ticker.add(() => {
    if (isGameRunning) {
        let elapsedTime = (Date.now() - startTime) / 1000;
        hudText.text = `Time: ${elapsedTime.toFixed(2)}s\nAttempts: ${attempts}\nDestroyed UFOs: ${destroyedUFOs}`;
        
        // Alle 2 Sekunden Spawnrate erhöhen (schneller Anstieg)
        if (Date.now() - lastIncreaseTime >= spawnRateIncreaseTime) {
            lastIncreaseTime = Date.now();
            spawnInterval = Math.max(100, spawnInterval - 100); // Spawn-Intervall verkürzen (bis mindestens 100ms)
        }
    }
});

// Controls
function leftKeyPressed() {
    rocket.x = Math.max(0, rocket.x - 5);
}

function rightKeyPressed() {
    rocket.x = Math.min(app.view.width - rocket.width, rocket.x + 5);
}

function spaceKeyPressed() {
    const bullet = PIXI.Sprite.from('bilder/bullet.png');
    bullet.x = rocket.x + 20;
    bullet.y = 440;
    bullet.scale.set(0.02);
    flyUp(bullet);
    app.stage.addChild(bullet);

    waitForCollision(bullet, ufoList).then(function ([bullet, ufo]) {
        app.stage.removeChild(ufo);
        app.stage.removeChild(bullet);
        destroyedUFOs++;
    });
}

// Stop Game & Show Game Over Screen
function stopGame() {
    isGameRunning = false;
    gameOverText.text = `GAME OVER\nSurvived: ${(Date.now() - startTime) / 1000}s`;
    gameOverText.visible = true;
    restartButton.visible = true;
}

// Restart Game
function restartGame() {
    isGameRunning = true;
    startTime = Date.now();
    attempts++;
    rocket.x = 250;
    rocket.y = 450;
    app.stage.addChild(rocket);

    ufoList.forEach(ufo => app.stage.removeChild(ufo));
    ufoList.length = 0;

    cometList.forEach(comet => app.stage.removeChild(comet));  // Alle Kometen entfernen
    cometList.length = 0;

    gameOverText.visible = false;
    restartButton.visible = false;
}

// Show Exit Menu
function showExitMenu() {
    isGameRunning = false;
    exitMenu.visible = true;
}

// Hide Exit Menu (Continue Game)
function hideExitMenu() {
    isGameRunning = true;
    exitMenu.visible = false;
}






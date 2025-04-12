// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const LANE_COUNT = 3;
const LANE_WIDTH = GAME_WIDTH / LANE_COUNT;
const CAR_WIDTH = 60;
const CAR_HEIGHT = 100;
const ENEMY_SPAWN_RATE = 1500; // milliseconds
const INITIAL_SPEED = 5;
const MAX_SPEED = 15;
const ACCELERATION = 0.1;
const DECELERATION = 0.05;

// Game variables
let canvas, ctx;
let gameLoop;
let score = 0;
let speed = INITIAL_SPEED;
let isGameRunning = false;
let isPaused = false;

// Player car
const playerCar = {
    x: GAME_WIDTH / 2 - CAR_WIDTH / 2,
    y: GAME_HEIGHT - CAR_HEIGHT - 20,
    lane: 1,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    color: '#FFD700', // Gold color for player car
    speed: 0
};

// Enemy cars array
let enemyCars = [];

// Game controls state
const controls = {
    left: false,
    right: false,
    up: false,
    down: false
};

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Event listeners for controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Button event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);

    // Hide pause and restart buttons initially
    document.getElementById('pauseBtn').classList.add('hidden');
    document.getElementById('restartBtn').classList.add('hidden');
    document.getElementById('gameOverOverlay').style.display = 'none';

    // Reset game state
    isGameRunning = false;
    isPaused = false;
    score = 0;
    speed = INITIAL_SPEED;
    enemyCars = [];

    // Draw initial screen
    drawStartScreen();
    
    // Update score display
    document.getElementById('scoreDisplay').textContent = '0';
    document.getElementById('speedDisplay').textContent = '0';
}

// Handle keyboard input
function handleKeyDown(event) {
    switch(event.key) {
        case 'ArrowLeft':
            controls.left = true;
            break;
        case 'ArrowRight':
            controls.right = true;
            break;
        case 'ArrowUp':
            controls.up = true;
            break;
        case 'ArrowDown':
            controls.down = true;
            break;
        case ' ':
            if (!isGameRunning) startGame();
            else togglePause();
            break;
        case 'r':
        case 'R':
            if (!isGameRunning) restartGame();
            break;
    }
}

function handleKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
            controls.left = false;
            break;
        case 'ArrowRight':
            controls.right = false;
            break;
        case 'ArrowUp':
            controls.up = false;
            break;
        case 'ArrowDown':
            controls.down = false;
            break;
    }
}

// Game state management
function startGame() {
    if (!isGameRunning) {
        // Reset game state
        isGameRunning = true;
        isPaused = false;
        score = 0;
        speed = INITIAL_SPEED;
        enemyCars = [];
        
        // Reset player car position
        playerCar.x = GAME_WIDTH / 2 - CAR_WIDTH / 2;
        playerCar.y = GAME_HEIGHT - CAR_HEIGHT - 20;
        
        // Update UI
        updateUI('start');
        hideGameOver();
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('pauseBtn').classList.remove('hidden');
        document.getElementById('restartBtn').classList.remove('hidden');
        
        // Start game loops
        gameLoop = setInterval(update, 1000 / 60);
        spawnEnemies();
        
        // Reset displays
        document.getElementById('scoreDisplay').textContent = '0';
        document.getElementById('speedDisplay').textContent = Math.round(speed * 10);
    }
}

function togglePause() {
    if (isGameRunning) {
        isPaused = !isPaused;
        updateUI(isPaused ? 'pause' : 'resume');
        if (isPaused) {
            clearInterval(gameLoop);
        } else {
            gameLoop = setInterval(update, 1000 / 60);
        }
    }
}

function restartGame() {
    clearInterval(gameLoop);
    hideGameOver();
    startGame();
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    updateUI('gameover');
    saveScore();
    showGameOver();
}

// Game update logic
function update() {
    if (!isPaused) {
        updatePlayerCar();
        updateEnemyCars();
        checkCollisions();
        updateScore();
        draw();
    }
}

function updatePlayerCar() {
    // Horizontal movement
    if (controls.left && playerCar.x > 0) {
        playerCar.x -= 5;
    }
    if (controls.right && playerCar.x < GAME_WIDTH - CAR_WIDTH) {
        playerCar.x += 5;
    }

    // Speed control
    if (controls.up && speed < MAX_SPEED) {
        speed += ACCELERATION;
    } else if (controls.down && speed > INITIAL_SPEED) {
        speed -= DECELERATION;
    } else if (!controls.up && speed > INITIAL_SPEED) {
        speed -= DECELERATION / 2;
    }

    // Update speed display
    document.getElementById('speedDisplay').textContent = Math.round(speed * 10);
}

function updateEnemyCars() {
    // Move enemy cars
    enemyCars.forEach((car, index) => {
        car.y += speed;
        // Remove cars that are off screen
        if (car.y > GAME_HEIGHT) {
            enemyCars.splice(index, 1);
            score += 100; // Score for successfully passing a car
        }
    });
}

function spawnEnemies() {
    setInterval(() => {
        if (isGameRunning && !isPaused) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const enemyCar = {
                x: lane * LANE_WIDTH + (LANE_WIDTH - CAR_WIDTH) / 2,
                y: -CAR_HEIGHT,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
                color: getRandomColor()
            };
            enemyCars.push(enemyCar);
        }
    }, ENEMY_SPAWN_RATE);
}

// Collision detection
function checkCollisions() {
    enemyCars.forEach(car => {
        if (isColliding(playerCar, car)) {
            gameOver();
        }
    });
}

function isColliding(car1, car2) {
    return car1.x < car2.x + car2.width &&
           car1.x + car1.width > car2.x &&
           car1.y < car2.y + car2.height &&
           car1.y + car1.height > car2.y;
}

// Drawing functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw road lanes
    drawRoad();

    // Draw player car
    drawCar(playerCar);

    // Draw enemy cars
    enemyCars.forEach(car => drawCar(car));
}

function drawRoad() {
    // Draw lane markers
    ctx.strokeStyle = '#ffffff';
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < LANE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, GAME_HEIGHT);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawCar(car) {
    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
    
    // Windows
    ctx.fillStyle = '#333';
    ctx.fillRect(car.x + 5, car.y + 5, car.width - 10, car.height/3);
    ctx.fillRect(car.x + 5, car.y + car.height - car.height/3 - 5, car.width - 10, car.height/3);
}

function drawStartScreen() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw road lanes
    drawRoad();
    
    // Draw player car in initial position
    drawCar(playerCar);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('Speed Racer', GAME_WIDTH/2, GAME_HEIGHT/2 - 50);
    
    ctx.font = '24px Orbitron';
    ctx.fillText('Press SPACE or click Start Game to begin', GAME_WIDTH/2, GAME_HEIGHT/2 + 50);
}

// UI updates
function updateUI(state) {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');

    switch(state) {
        case 'start':
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            restartBtn.classList.remove('hidden');
            break;
        case 'pause':
            pauseBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Resume';
            break;
        case 'resume':
            pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Pause';
            break;
        case 'gameover':
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            restartBtn.classList.add('hidden');
            break;
    }
}

function showGameOver() {
    const overlay = document.getElementById('gameOverOverlay');
    const finalScoreElement = document.getElementById('finalScore');
    overlay.style.display = 'flex';
    finalScoreElement.textContent = score;
}

function hideGameOver() {
    const overlay = document.getElementById('gameOverOverlay');
    overlay.style.display = 'none';
}

// Score management
function updateScore() {
    score += Math.round(speed);
    document.getElementById('scoreDisplay').textContent = score;
}

function saveScore() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    const playerName = prompt('Enter your name for the leaderboard:', 'Player');
    
    if (playerName) {
        leaderboard.push({
            name: playerName,
            score: score,
            date: new Date().toISOString()
        });
        
        // Sort and keep only top 10 scores
        leaderboard.sort((a, b) => b.score - a.score);
        if (leaderboard.length > 10) {
            leaderboard.length = 10;
        }
        
        localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    }
}

// Utility functions
function getRandomColor() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Initialize game when page loads
window.addEventListener('load', init);

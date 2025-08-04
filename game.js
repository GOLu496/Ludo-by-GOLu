// game.js  

/**  
 * Official Ludo Game (India rules)  
 *   
 * Implementation details:  
 * - 4 players: red, blue, green, yellow  
 * - Token moves along predefined path arrays (one array for each color)  
 * - Each token's position is an index in that path or -1 if at base  
 * - Tokens move forward by dice roll  
 * - Safe zones and kill zones are implemented  
 * - Full rules as requested  
 *   
 * Board uses absolute positioning over a static board image.  
 *   
 * Notes:  
 * - Coordinates are pixel positions on 600x600 board image for token centers.  
 * - The path arrays represent token steps around the board.  
 * - Each token moves one step per position index.  
 */  

const BOARD_SIZE = 600;  
const STEP_SIZE = 25; // grid step on board (approx)  
const TOKEN_SIZE = 30;  

const PLAYER_COLORS = ["red", "blue", "green", "yellow"];  
const TOKEN_COUNT = 4;  

// Safe squares indexes on the global path that are safe for occupies (cannot be killed there):  
// Usually these are the starting squares and some special squares  
// We will mark these for all 52 main squares + home columns  
const SAFE_SPOTS_GLOBAL_IDX = new Set([  
    0, 8, 13, 21, 26, 34, 39, 47  
]);  
// We will assign globally these safe spots on the main path (full lap positions)  

// The home columns each have 6 positions (1-6 to home)  
// Tokens can only enter the home path after completing the lap  

// ---------------------------- Path Coordinates -----------------------------  

// The 52 main positions of the board path in clockwise order.  
// Coordinates are center position on the 600x600 board image.  
// The path starts at Red's starting square, goes clockwise through Blue, Green, Yellow  

// This is the global path: 52 positions (0 to 51)  
// The starting square for each color is:  
// Red: index 0  
// Blue: index 13  
// Green: index 26  
// Yellow: index 39  

// We build the 52 stepping points for the tokens on the board:  

// Format: {x, y} pixel center on board  

// The board image has a classic Ludo layout with square grid.  
// The path goes around the edges and then inward on each side.  

// We define the 52 positions based on a 15x15 grid (typical Ludo board grid), each grid cell ~40px, but to fit 600px board we use 15 columns/rows grid:  

// We need a precise standard mapping of the 52 squares with positions.  
// The standard Indian Ludo board consists of colored tracks: each side 6 squares, and common path squares interspersed.  

// We'll define the path following this sequence for the global 52 positions (clockwise):  
// START RED (0) at bottom middle of red home area  
// moves right, up, left, down along edges and then to opponents  

// We'll use an established approach:   
// Each square is 40px, board 15x15 grid cells, 40*15=600px  

const GRID_UNIT = 40; // size for each cell (path square size)  
const OFFSET = 20; // offset to center tokens on squares (half of 40px square)  

// The 15x15 grid coordinates for path squares in order:  

// We'll map the 52 main squares in clockwise order:  

// Index reference from a standard Ludo board path order (source: Indian Ludo rules, standard layout):  
// Red start square is at grid (1, 6) [From top-left 0-based]  
// Path moves:  

// To define the path, first define cell coordinates:  

/*  

Grid layout (0-based indices):  

(Columns from left to right 0..14, Rows 0..14 from top to bottom)  

Positions for the global path indices:  

Red path start: pos 0: cell(1, 6)  
Next squares:  

Pos 0: (1,6)  
Pos 1: (2,6)  
Pos 2: (3,6)  
Pos 3: (4,6)  
Pos 4: (5,6)  
Pos 5: (6,6)  
Pos 6: (7,5)  
Pos 7: (7,4)  
Pos 8: (7,3)  
Pos 9: (7,2)  
Pos 10: (7,1)  
Pos 11: (7,0)  
Pos 12: (8,0)  
Pos 13: (9,0) - Blue start pos  
Pos 14: (9,1)  
Pos 15: (9,2)  
Pos 16: (9,3)  
Pos 17: (9,4)  
Pos 18: (9,5)  
Pos 19: (10,6)  
Pos 20: (11,6)  
Pos 21: (12,6)  
Pos 22: (13,6)  
Pos 23: (14,6)  
Pos 24: (14,7)  
Pos 25: (14,8)  
Pos 26: (13,8) - Green start pos  
Pos 27: (12,8)  
Pos 28: (11,8)  
Pos 29: (10,8)  
Pos 30: (9,8)  
Pos 31: (9,9)  
Pos 32: (9,10)  
Pos 33: (9,11)  
Pos 34: (9,12)  
Pos 35: (9,13)  
Pos 36: (9,14)  
Pos 37: (8,14)  
Pos 38: (7,14)  
Pos 39: (6,13) - Yellow start pos  
Pos 40: (6,12)  
Pos 41: (6,11)  
Pos 42: (6,10)  
Pos 43: (6,9)  
Pos 44: (5,8)  
Pos 45: (4,8)  
Pos 46: (3,8)  
Pos 47: (2,8)  
Pos 48: (1,8)  
Pos 49: (0,8)  
Pos 50: (0,7)  
Pos 51: (0,6)  

*/  

// Calculate pixel positions for center of each cell: x = col * 40 + 20, y = row * 40 + 20  

const PATH_COORDS_GRID = [  
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,5],[7,4],[7,3],[7,2],[7,1],[7,0],[8,0],  
    [9,0],[9,1],[9,2],[9,3],[9,4],[9,5],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],  
    [14,8],[13,8],[12,8],[11,8],[10,8],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],  
    [9,14],[8,14],[7,14],[6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6]  
];  

// Compute pixel coords array for the 52 path steps:  

const PATH_COORDS = PATH_COORDS_GRID.map(([c,r]) => ({  
    x: c * GRID_UNIT + OFFSET,  
    y: r * GRID_UNIT + OFFSET  
}));  

// Home columns: 6 steps each, each player has own home track off their start square  

// Home columns grids (6 squares each):  

// Red home column: vertical from (7,7) to (7,12), upwards from start square (7,6)  
// Yellow home column: vertical from (6,7) to (6,12), upwards from start square (6,6)  
// Blue home column: horizontal from (8,7) to (13,7), rightwards from start square (7,7)  
// Green home column: horizontal from (1,7) to (6,7), right to left from start square (7,7)  

// According to Indian Ludo layout:  
// Red home: cells (7,7) to (7,12) (row 7 down to 12, col 7)  
// Yellow home: cells (6,7) to (6,12) (row 7 down to 12, col 6)  
// Blue home: cells (8,7) to (13,7) (col 8 to 13, row 7)  
// Green home: cells (1,7) to (6,7) (col 1 to 6, row 7)  

// Tokens move into home column after completing full lap and reaching the target entry square  

// We'll define home path coords for each color as below:  

const HOME_PATH_COORDS = {  
    red: [  
        {x: 7 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 7 * GRID_UNIT + OFFSET, y: 8 * GRID_UNIT + OFFSET},  
        {x: 7 * GRID_UNIT + OFFSET, y: 9 * GRID_UNIT + OFFSET},  
        {x: 7 * GRID_UNIT + OFFSET, y: 10 * GRID_UNIT + OFFSET},  
        {x: 7 * GRID_UNIT + OFFSET, y: 11 * GRID_UNIT + OFFSET},  
        {x: 7 * GRID_UNIT + OFFSET, y: 12 * GRID_UNIT + OFFSET}  
    ],  
    yellow: [  
        {x: 6 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 6 * GRID_UNIT + OFFSET, y: 8 * GRID_UNIT + OFFSET},  
        {x: 6 * GRID_UNIT + OFFSET, y: 9 * GRID_UNIT + OFFSET},  
        {x: 6 * GRID_UNIT + OFFSET, y: 10 * GRID_UNIT + OFFSET},  
        {x: 6 * GRID_UNIT + OFFSET, y: 11 * GRID_UNIT + OFFSET},  
        {x: 6 * GRID_UNIT + OFFSET, y: 12 * GRID_UNIT + OFFSET}  
    ],  
    blue: [  
        {x: 8 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 9 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 10 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 11 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 12 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 13 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET}  
    ],  
    green: [  
        {x: 1 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 2 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 3 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 4 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 5 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET},  
        {x: 6 * GRID_UNIT + OFFSET, y: 7 * GRID_UNIT + OFFSET}  
    ]  
};  

// Starting squares index in global path (for spawning tokens from base):  

const START_INDICES = {  
    red: 0,  
    blue: 13,  
    green: 26,  
    yellow: 39  
};  

// Entry to home column for each player on global path index:  
// The square just before home column entry where tokens turn into home path.  

const HOME_ENTRY_INDICES = {  
    red: 50,    // pos 50 is entry to red home actually (just before 51 then home)  
    blue: 11,  
    green: 24,  
    yellow: 37  
};  

// Tokens start at position -1 (in base)  

// ---------- Safe zones global indexes (main path) ---------  
// Safe zones are the 8 special squares where tokens are safe and can't be killed  

// Officially safe spots (starting squares of each color plus 4 "star" safe squares)  
// We took these from standard Ludo board indexes.  

const SAFE_SPOTS = [  
    0, 8, 13, 21, 26, 34, 39, 47  
];  

// The home columns are also safe zones  

// -------- Game state --------  

let gameState = {  
    players: ["red", "blue", "green", "yellow"],  
    currentPlayerIndex: 0,  
    diceRoll: null,  
    rollCount: 0, // number of rolls in current turn (to check extra roll on 6)  
    tokens: {}, // structure: {red: [{pos: -1}, ...], blue: [...], ...}  
    // pos:  
    //  - -1 means in base (start)  
    //  - 0..51 means global path index  
    //  - 100+ means home path index (100 + 0..5)  
    isRolling: false,  
    selectedToken: null,  
    moveAnimationQueue: [],  
    winner: null  
};  

// Initialize tokens positions  
function initTokens() {  
    for (const color of PLAYER_COLORS) {  
        gameState.tokens[color] = [];  
        for (let i = 0; i < TOKEN_COUNT; i++) {  
            gameState.tokens[color].push({ pos: -1, id: `${color}-${i}` });  
        }  
    }  
}  

// Helper: get next player index  
function getNextPlayerIndex() {  
    return (gameState.currentPlayerIndex + 1) % PLAYER_COLORS.length;  
}  

// Helper: check if position index is safe spot on global path  
function isSafeSpot(pos) {  
    return SAFE_SPOTS.includes(pos);  
}  

// Helper: check if pos is home path index  
function isHomePosition(pos) {  
    return pos >= 100;  
}  

// Helper: token position to coordinates on board for rendering  
function getTokenCoords(color, pos) {  
    if (pos === -1) {  
        // In base  

        // Base coordinates are fixed for 4 tokens per player  

        // Bases grid positions (relative to each player's base area)  

        // Bases for red bottom-left quadrant: roughly around (1-3,10-12)  
        // blue top-left quadrant: (1-3,1-3)  
        // green top-right quadrant: (10-12,1-3)  
        // yellow bottom-right quadrant: (10-12,10-12)  

        // We'll place 4 tokens in 2x2 grid inside base square  

        let basePositions = {  
            red: [  
                [1, 11], [2, 11], [1, 12], [2, 12]  
            ],  
            blue: [  
                [1, 1], [2, 1], [1, 2], [2, 2]  
            ],  
            green: [  
                [11, 1], [12, 1], [11, 2], [12, 2]  
            ],  
            yellow: [  
                [11, 11], [12, 11], [11, 12], [12, 12]  
            ]  
        };  

        // Determine token index i for token id extraction  
        // We'll decode token id from parameter  
        if (!color) return {x:0,y:0};  
        // Find token index for this token - pass token in call?  
        // We rely on caller to provide token index (we'll store it in token object)  

        // Here we have only color and position, we will fetch from gameState matching token id  
        // We'll find the token in tokens array with the correct id to get index  
        // But this is inefficient, better pass token object itself.  

        return null; // fallback to caller to pass token reference to determine base coords  
    } else if (pos >= 0 && pos < 52) {  
        // On global path  
        return PATH_COORDS[pos];  
    } else if (pos >= 100 && pos < 106) {  
        // Home column  
        let homeIndex = pos - 100;  
        return HOME_PATH_COORDS[color][homeIndex];  
    } else {  
        console.warn("Invalid token position:", pos);  
        return {x:0,y:0};  
    }  
}  

// We need a function overload to get base token coords by token index  
function getBaseCoords(color, tokenIndex) {  
    let basePositions = {  
        red: [  
            [1, 11], [2, 11], [1, 12], [2, 12]  
        ],  
        blue: [  
            [1, 1], [2, 1], [1, 2], [2, 2]  
        ],  
        green: [  
            [11, 1], [12, 1], [11, 2], [12, 2]  
        ],  
        yellow: [  
            [11, 11], [12, 11], [11, 12], [12, 12]  
        ]  
    };  

    let [c,r] = basePositions[color][tokenIndex];  
    return {  
        x: c * GRID_UNIT + OFFSET,  
        y: r * GRID_UNIT + OFFSET  
    };  
}  

// Helper: Find if a token can move given a dice number  
// Returns true if any token of current player can move  
// Called before allowing roll or token select  

function canAnyTokenMove(playerColor, diceValue) {  
    const tokens = gameState.tokens[playerColor];  
    if (diceValue === 6) {  
        // Can bring a token from base or move any on path  
        // Check if any in base to start  
        for (let i=0; i<TOKEN_COUNT; i++) {  
            if (tokens[i].pos === -1) {  
                // Can bring this token out  
                if (!isOccupiedByPlayer(playerColor, START_INDICES[playerColor])) {  
                    // The start square must be free for placing token from base  
                    return true;  
                }  
            }  
        }  
    }  
    // Check if any token on path can move diceValue steps  
    for (let i=0; i<TOKEN_COUNT; i++) {  
        let tokenPos = tokens[i].pos;  
        if (tokenPos === -1) continue; // in base, cannot move except if dice 6 (already tested)  
        // Check if move possible without overflowing home path  
        if (canMoveToken(playerColor, tokenPos, diceValue)) {  
            return true;  
        }  
    }  
    return false;  
}  

// Check if a token can move dice steps from current position (pos)  
// Used in canAnyTokenMove and to highlight possible moves  

function canMoveToken(playerColor, pos, dice) {  
    if (pos === -1) {  
        // Token in base can only move out if dice 6 and start square free  
        if (dice === 6 && !isOccupiedByPlayer(playerColor, START_INDICES[playerColor])) return true;  
        return false;  
    } else if (pos >= 0 && pos < 52) {  
        // On global path  
        // Calculate next position after dice steps  
        let startIndex = pos;  
        let homeEntryIndex = HOME_ENTRY_INDICES[playerColor];  

        // Calculate distance to home entry on path:  
        // path length is 52, consider looping  

        // Positions go circularly until homeEntryIndex  

        // Number of steps to home entry:  
        let distToHomeEntry = (homeEntryIndex - startIndex + 52) % 52;  

        if (dice <= distToHomeEntry) {  
            // move is on main path, check if token can move into occupied square by own token  
            let nextPos = (startIndex + dice) % 52;  
            // Check if squares occupied by own tokens at nextPos  
            if (isOccupiedByPlayer(playerColor, nextPos)) return false;  
            return true;  
        } else {  
            // Move leads into home path  
            let stepsIntoHome = dice - distToHomeEntry - 1; // 0-based index for home path (0...5)  
            if (stepsIntoHome >= 6) {  
                // Overshoot beyond home path last square - invalid move  
                return false;  
            }  
            // Check if home path position free  
            let homePos = 100 + stepsIntoHome;  
            if (isOccupiedByPlayer(playerColor, homePos)) return false;  
            return true;  
        }  
    } else if (pos >= 100) {  
        // Token already in home path  
        let homeIndex = pos - 100;  
        let targetHomeIndex = homeIndex + dice;  
        if (targetHomeIndex >= 6) {  
            // Cannot move beyond home last position  
            return false;  
        }  
        // Check if target home tile occupied  
        let homePos = 100 + targetHomeIndex;  
        if (isOccupiedByPlayer(playerColor, homePos)) return false;  
        return true;  
    }  

    return false;  
}  

// Checks if a position is occupied by any of the player's own tokens  

function isOccupiedByPlayer(playerColor, pos) {  
    const tokens = gameState.tokens[playerColor];  
    for (let i=0; i < TOKEN_COUNT; i++) {  
        if (tokens[i].pos === pos) return true;  
    }  
    return false;  
}  

// Checks if position is occupied by any token (return array with all tokens info there)  

function getTokensAtPosition(pos, exceptPlayer = null) {  
    let occupiedTokens = [];  
    for (const playerColor of PLAYER_COLORS) {  
        if (playerColor === exceptPlayer) continue;  
        const tokens = gameState.tokens[playerColor];  
        for (let i=0; i < TOKEN_COUNT; i++) {  
            if (tokens[i].pos === pos) {  
                occupiedTokens.push({player: playerColor, tokenIndex: i});  
            }  
        }  
    }  
    return occupiedTokens;  
}  

// Kill opponent token if possible (if not safe zone)  
function killTokensAt(pos, exceptPlayer) {  
    if (isSafeSpot(pos) || isHomePosition(pos)) {  
        // No kills in safe zones or home columns  
        return;  
    }  
    let tokensAtPos = getTokensAtPosition(pos, exceptPlayer);  
    for (const tk of tokensAtPos) {  
        // Send token back to base  
        gameState.tokens[tk.player][tk.tokenIndex].pos = -1;  
    }  
}  

// Select player token movement highlights  
function highlightMovableTokens() {  
    clearHighlights();  
    const color = gameState.players[gameState.currentPlayerIndex];  
    const dice = gameState.diceRoll;  
    if (dice === null) return;  
    let tokens = gameState.tokens[color];  
    let anyHighLight = false;  
    for (let i = 0; i < TOKEN_COUNT; i++) {  
        if (canMoveToken(color, tokens[i].pos, dice)) {  
            const tokenElem = document.getElementById(`token-${color}-${i}`);  
            tokenElem.classList.add("highlight");  
            anyHighLight = true;  
        }  
    }  
    if (!anyHighLight) {  
        // No valid moves for this roll, disable roll button to pass turn automatically  
        document.getElementById("roll-dice-btn").disabled = false;  
    }  
}  

// Clear all highlights on tokens  
function clearHighlights() {  
    const highlighted = document.querySelectorAll(".token.highlight");  
    highlighted.forEach(el => el.classList.remove("highlight"));  
}  

// Animate token movement step by step between positions in path  
// Steps is array of positions to move: [pos1, pos2, ..., posN]  
// Animate one step every 150ms approx.  

function animateTokenMovement(color, tokenIndex, steps, callback) {  
    if (steps.length === 0) {  
        if (callback) callback();  
        return;  
    }  
    const tokenElem = document.getElementById(`token-${color}-${tokenIndex}`);  
    let stepPos = steps.shift();  

    // Move the token element to coordinates for stepPos  
    const coords = getTokenScreenCoords(color, tokenIndex, stepPos);  
    tokenElem.style.transition = "all 0.15s linear";  
    tokenElem.style.left = coords.x + "px";  
    tokenElem.style.top = coords.y + "px";  

    // After transition complete, update state and continue animation  
    setTimeout(() => {  
        // Update token position state  
        gameState.tokens[color][tokenIndex].pos = stepPos;  
        animateTokenMovement(color, tokenIndex, steps, callback);  
    }, 160);  
}  

// Helper: get token screen coordinates for a position pos for actual rendering  
// We need tokenIndex only for base position  

function getTokenScreenCoords(color, tokenIndex, pos) {  
    if (pos === -1) {  
        // Base position for token index  
        let c = getBaseCoords(color, tokenIndex);  
        return {x: c.x - TOKEN_SIZE/2, y: c.y - TOKEN_SIZE/2};  
    } else if (pos >= 0 && pos < 52) {  
        let p = PATH_COORDS[pos];  
        return {x: p.x - TOKEN_SIZE/2, y: p.y - TOKEN_SIZE/2};  
    } else if (pos >= 100 && pos < 106) {  
        let homeIndex = pos - 100;  
        let p = HOME_PATH_COORDS[color][homeIndex];  
        return {x: p.x - TOKEN_SIZE/2, y: p.y - TOKEN_SIZE/2};  
    } else {  
        console.warn("Invalid token position for rendering:", pos);  
        return {x:0,y:0};  
    }  
}  

// Move token function, calculate step positions path for animation and update state  

function moveToken(color, tokenIndex, diceValue, callback=null) {  
    let token = gameState.tokens[color][tokenIndex];  
    let startPos = token.pos;  

    if (startPos === -1) {  
        // Bring token out from base to start square if dice == 6  
        if (diceValue !== 6) {  
            throw new Error("Cannot move token out of base without a 6");  
        }  
        if (isOccupiedByPlayer(color, START_INDICES[color])) {  
            throw new Error("Start square occupied by own token");  
        }  
        let path = [START_INDICES[color]];  
        gameState.isRolling = true;  
        animateTokenMovement(color, tokenIndex, path, () => {  
            killTokensAt(path[path.length -1], color);  
            finalizeMove(color, tokenIndex, diceValue, callback);  
        });  
    } else if (startPos >= 0 && startPos < 52) {  
        // On global path  
        let homeEntry = HOME_ENTRY_INDICES[color];  
        let distToHomeEntry = (homeEntry - startPos + 52) % 52;  

        if (diceValue <= distToHomeEntry) {  
            // Move on main path  
            let path = [];  
            for (let i = 1; i <= diceValue; i++) {  
                path.push((startPos + i) % 52);  
            }  
            gameState.isRolling = true;  

            animateTokenMovement(color, tokenIndex, path, () => {  
                killTokensAt(path[path.length - 1], color);  
                finalizeMove(color, tokenIndex, diceValue, callback);  
            });  
        } else {  
            // Move into home path  
            let stepsOnMain = distToHomeEntry;  
            // Continued from moveToken function in game.js

            let path = [];
            // Steps on global path to home entry
            for (let i = 1; i <= stepsOnMain; i++) {
                path.push((startPos + i) % 52);
            }
            // Now move into home path
            let stepsIntoHome = diceValue - stepsOnMain - 1;
            for (let i = 0; i <= stepsIntoHome; i++) {
                path.push(100 + i);
            }
            gameState.isRolling = true;
            animateTokenMovement(color, tokenIndex, path, () => {
                finalizeMove(color, tokenIndex, diceValue, callback);
            });
        }
    } else if (startPos >= 100) {
        // Already in home path
        let homeIndex = startPos - 100;
        let targetIndex = homeIndex + diceValue;
        let path = [];
        for (let i = 1; i <= diceValue; i++) {
            path.push(100 + homeIndex + i);
        }
        gameState.isRolling = true;
        animateTokenMovement(color, tokenIndex, path, () => {
            finalizeMove(color, tokenIndex, diceValue, callback);
        });
    }
}

function finalizeMove(color, tokenIndex, diceValue, callback) {
    clearHighlights();
    gameState.selectedToken = null;
    if (diceValue === 6) {
        gameState.rollCount = 0; // allow extra turn
        gameState.diceRoll = null;
        document.getElementById("roll-dice-btn").disabled = false;
    } else {
        gameState.currentPlayerIndex = getNextPlayerIndex();
        gameState.diceRoll = null;
        gameState.rollCount = 0;
        document.getElementById("roll-dice-btn").disabled = false;
    }
    gameState.isRolling = false;
    if (callback) callback();
    checkWin(color);
}

function checkWin(color) {
    let tokens = gameState.tokens[color];
    if (tokens.every(t => t.pos === 105)) {
        gameState.winner = color;
        alert(color.toUpperCase() + " wins the game!");
        document.getElementById("roll-dice-btn").disabled = true;
    }
}

function onRollDice() {
    if (gameState.isRolling || gameState.diceRoll !== null) return;
    let roll = Math.floor(Math.random() * 6) + 1;
    gameState.diceRoll = roll;
    gameState.rollCount++;
    document.getElementById("dice-value").innerText = roll;
    if (!canAnyTokenMove(gameState.players[gameState.currentPlayerIndex], roll)) {
        // No valid move, pass turn
        setTimeout(() => finalizeMove(gameState.players[gameState.currentPlayerIndex], null, roll), 1000);
    } else {
        highlightMovableTokens();
    }
    document.getElementById("roll-dice-btn").disabled = true;
}

function onTokenClick(color, index) {
    if (gameState.players[gameState.currentPlayerIndex] !== color) return;
    if (gameState.isRolling || gameState.diceRoll === null) return;
    if (!canMoveToken(color, gameState.tokens[color][index].pos, gameState.diceRoll)) return;

    moveToken(color, index, gameState.diceRoll);
}

// Initialize game
initTokens();
document.getElementById("roll-dice-btn").addEventListener("click", onRollDice);
PLAYER_COLORS.forEach(color => {
    for (let i = 0; i < TOKEN_COUNT; i++) {
        document.getElementById(`token-${color}-${i}`).addEventListener("click", () => onTokenClick(color, i));
    }
});

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function get(what) {
    return document.getElementById(what);
}
var Main = (function () {
    function Main() {
    }
    Main.prototype.init = function () {
        Main.canvas = get('gameCanvas');
        Main.context = Main.canvas.getContext('2d');
        Resource.loadAll();
        Main.sm = new StateManager();
        Main.lastDate = Date.now();
        Main.loop();
    };
    Main.loop = function () {
        requestAnimationFrame(Main.loop);
        var now = Date.now();
        Main.elapsed += (now - Main.lastDate);
        Main.lastDate = now;
        Main.context.fillStyle = "#284B32";
        Main.context.fillRect(0, 0, Main.canvas.width, Main.canvas.height);
        Main.sm.update();
        Main.sm.render();
    };
    Main.elapsed = 0.0;
    Main.lastDate = 0.0;
    return Main;
})();
var StateManager = (function () {
    function StateManager() {
        this.states = new Array(1);
        this.states[0] = new MainMenuState(this);
    }
    StateManager.prototype.update = function () {
        this.currentState().update();
    };
    StateManager.prototype.render = function () {
        this.currentState().render();
    };
    StateManager.prototype.enterState = function (state) {
        this.currentState().hide();
        this.states.push(state);
    };
    StateManager.prototype.enterPreviousState = function () {
        if (this.states.length > 1) {
            this.currentState().destroy();
            this.states.pop();
            this.currentState().restore();
        }
    };
    StateManager.prototype.currentState = function () {
        return this.states[this.states.length - 1];
    };
    StateManager.prototype.getState = function (state) {
        switch (state) {
            case "mainmenu":
                return new MainMenuState(this);
            case "game":
                return new GameState(this);
            case "about":
                return new AboutState(this);
            default:
                console.error("Uncaught state type in StateManager.getState(): ", state);
                return null;
        }
    };
    return StateManager;
})();
var STATE_TYPE;
(function (STATE_TYPE) {
    STATE_TYPE[STATE_TYPE["MAINMENU"] = 0] = "MAINMENU";
    STATE_TYPE[STATE_TYPE["ABOUT"] = 1] = "ABOUT";
    STATE_TYPE[STATE_TYPE["GAME"] = 2] = "GAME";
})(STATE_TYPE || (STATE_TYPE = {}));
;
var BasicState = (function () {
    function BasicState(type, sm) {
        this.type = type;
        this.sm = sm;
    }
    BasicState.prototype.update = function () { };
    BasicState.prototype.render = function () { };
    BasicState.prototype.hide = function () { };
    BasicState.prototype.restore = function () { };
    BasicState.prototype.destroy = function () { };
    return BasicState;
})();
var MainMenuState = (function (_super) {
    __extends(MainMenuState, _super);
    function MainMenuState(sm) {
        _super.call(this, STATE_TYPE.MAINMENU, sm);
        get('mainMenuState').style.display = "initial";
    }
    MainMenuState.prototype.hide = function () {
        get('mainMenuState').style.display = "none";
    };
    MainMenuState.prototype.restore = function () {
        get('mainMenuState').style.display = "initial";
    };
    MainMenuState.prototype.destroy = function () {
        get('mainMenuState').style.display = "none";
    };
    return MainMenuState;
})(BasicState);
var AboutState = (function (_super) {
    __extends(AboutState, _super);
    function AboutState(sm) {
        _super.call(this, STATE_TYPE.ABOUT, sm);
        get('aboutState').style.display = "initial";
    }
    AboutState.prototype.hide = function () {
        get('aboutState').style.display = "none";
    };
    AboutState.prototype.restore = function () {
        get('aboutState').style.display = "initial";
    };
    AboutState.prototype.destroy = function () {
        get('aboutState').style.display = "none";
    };
    return AboutState;
})(BasicState);
var GameState = (function (_super) {
    __extends(GameState, _super);
    function GameState(sm) {
        _super.call(this, STATE_TYPE.GAME, sm);
        this.x = 0;
        this.y = 0;
        get('gameState').style.display = "initial";
        this.player = new Player();
        this.level = new Level();
    }
    GameState.prototype.hide = function () {
        get('gameState').style.display = "none";
    };
    GameState.prototype.restore = function () {
        get('gameState').style.display = "initial";
    };
    GameState.prototype.destroy = function () {
        get('gameState').style.display = "none";
    };
    GameState.prototype.update = function () {
        this.player.update();
    };
    GameState.prototype.render = function () {
        this.level.render();
        this.player.render();
    };
    return GameState;
})(BasicState);
var Player = (function () {
    function Player() {
        this.maxXv = 18;
        this.maxYv = 18;
        this.ax = 0.5;
        this.ay = 0.5;
        this.friction = 0.80;
        this.width = 32;
        this.height = 64;
        this.x = Main.canvas.width / 2;
        this.y = Main.canvas.height - this.height - 36;
        this.xv = 0;
        this.yv = 0;
    }
    Player.prototype.update = function () {
        if (Keyboard.keysDown.length > 0) {
            if (Keyboard.contains(Keyboard.KEYS.W)) {
                this.yv -= this.ay;
            }
            if (Keyboard.contains(Keyboard.KEYS.A)) {
                this.xv -= this.ax;
            }
            if (Keyboard.contains(Keyboard.KEYS.S)) {
                this.yv += this.ay;
            }
            if (Keyboard.contains(Keyboard.KEYS.D)) {
                this.xv += this.ax;
            }
        }
        this.xv *= this.friction;
        this.yv *= this.friction;
        if (this.xv > this.maxXv) {
            this.xv = this.maxXv;
        }
        else if (this.xv < -this.maxXv) {
            this.xv = -this.maxXv;
        }
        if (this.yv > this.maxYv) {
            this.yv = this.maxYv;
        }
        else if (this.xv < -this.maxYv) {
            this.yv = -this.maxYv;
        }
        this.x += this.xv;
        this.y += this.yv;
        if (this.x < 0) {
            this.x = 0;
        }
        else if (this.x + this.width > Main.canvas.width) {
            this.x = Main.canvas.width - this.width;
        }
        if (this.y < 0) {
            this.y = 0;
        }
        else if (this.y + this.height > Main.canvas.height) {
            this.y = Main.canvas.height - this.height;
        }
    };
    Player.prototype.render = function () {
        Resource.player.render(this.x, this.y, this.yv < -Math.abs(this.xv) ? 2 : this.xv > 0 ? 0 : 1, 32 - (Main.canvas.height - this.y) / (Main.canvas.height) * 14, 64 - (Main.canvas.height - this.y) / (Main.canvas.height) * 28);
    };
    return Player;
})();
var Level = (function () {
    function Level() {
        this.trunks = new Array(50);
        for (var i = 0; i < this.trunks.length; ++i) {
            var pos;
            do {
                pos = new Vec2(Math.random() * (Main.canvas.width - 32), Math.random() * (Main.canvas.height - 142));
            } while (Level.overlaps(pos, this.trunks));
            this.trunks[i] = pos;
        }
    }
    Level.overlaps = function (pos, trunks) {
        for (var i = 0; i < trunks.length; ++i) {
            if (!trunks[i])
                continue;
            if (pos.x + 32 >= trunks[i].x &&
                pos.x <= trunks[i].x + 32 &&
                pos.y + 32 >= trunks[i].y &&
                pos.y <= trunks[i].y + 32) {
                return true;
            }
        }
        return false;
    };
    Level.prototype.render = function () {
        Main.context.fillStyle = "#CCB595";
        Main.context.fillRect(0, Main.canvas.height - 110, Main.canvas.width, Main.canvas.height);
        for (var i in this.trunks) {
            Main.context.drawImage(Resource.deciduous_sapling, 0, 0, 32, 32, this.trunks[i].x, this.trunks[i].y, 32 - ((Main.canvas.height - this.trunks[i].y) / Main.canvas.height * 15), 32 - ((Main.canvas.height - this.trunks[i].y) / Main.canvas.height * 15));
        }
    };
    return Level;
})();
var Vec2 = (function () {
    function Vec2(x, y) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        this.x = x;
        this.y = y;
    }
    return Vec2;
})();
var Resource = (function () {
    function Resource() {
    }
    Resource.loadAll = function () {
        Resource.player = new SpriteSheet("res/player.png", 32, 64);
        Resource.trunk = new Image();
        Resource.trunk.src = "res/trunk.png";
        Resource.deciduous_sapling = new Image();
        Resource.deciduous_sapling.src = "res/deciduous_sapling.png";
        Resource.coninferous_sapling = new Image();
        Resource.coninferous_sapling.src = "res/coniferous_sapling.png";
    };
    return Resource;
})();
var SpriteSheet = (function () {
    function SpriteSheet(src, frameWidth, frameHeight) {
        this.image = new Image();
        this.image.src = src;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }
    SpriteSheet.prototype.render = function (x, y, frameNumber, width, height) {
        var sx = (frameNumber % this.image.width) * this.frameWidth;
        var sy = Math.floor(frameNumber / this.image.width) * this.frameHeight;
        Main.context.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x, y, width, height);
    };
    return SpriteSheet;
})();
var Camera = (function () {
    function Camera() {
    }
    return Camera;
})();
var ClickType;
(function (ClickType) {
    ClickType[ClickType["LMB"] = 0] = "LMB";
    ClickType[ClickType["MMB"] = 1] = "MMB";
    ClickType[ClickType["RMB"] = 2] = "RMB";
})(ClickType || (ClickType = {}));
var Mouse = (function () {
    function Mouse() {
    }
    Mouse.move = function (event) {
        Mouse.x = event.offsetX;
        Mouse.y = event.offsetY;
    };
    Mouse.click = function (event, down) {
        var type = clickType(event);
        switch (type) {
            case ClickType.LMB:
                Mouse.ldown = down;
                break;
            case ClickType.RMB:
                Mouse.rdown = down;
                break;
            case ClickType.MMB:
                Mouse.mdown = down;
                break;
        }
    };
    Mouse.x = -1;
    Mouse.y = -1;
    Mouse.ldown = false;
    Mouse.mdown = false;
    Mouse.rdown = false;
    return Mouse;
})();
var Keyboard = (function () {
    function Keyboard() {
    }
    Keyboard.onKeyDown = function (event) {
        if (!Keyboard.contains(event.keyCode)) {
            Keyboard.keysDown.push(event.keyCode);
        }
    };
    Keyboard.contains = function (keyCode) {
        for (var i in Keyboard.keysDown) {
            if (keyCode === Keyboard.keysDown[i]) {
                return true;
            }
        }
        return false;
    };
    Keyboard.onKeyUp = function (event) {
        var pos = -1;
        for (var i in Keyboard.keysDown) {
            if (Keyboard.keysDown[i] === event.keyCode) {
                pos = i;
            }
        }
        if (pos != -1) {
            Keyboard.keysDown.splice(pos, 1);
        }
    };
    Keyboard.KEYS = {
        BACKSPACE: 8, TAB: 9, RETURN: 13, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36,
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51,
        FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
        G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85,
        V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192, SHIFT: 999
    };
    Keyboard.keysDown = new Array(0);
    return Keyboard;
})();
function clickType(event) {
    if (event.which === 3 || event.button === 2)
        return ClickType.RMB;
    else if (event.which === 1 || event.button === 0)
        return ClickType.LMB;
    else if (event.which === 2 || event.button === 1)
        return ClickType.MMB;
}
function enterState(state) {
    Main.sm.enterState(Main.sm.getState(state));
}
window.onkeydown = Keyboard.onKeyDown;
window.onkeyup = Keyboard.onKeyUp;
window.onload = function () {
    get('gameCanvas').oncontextmenu = function () { return false; };
    get('gameCanvas').onmousedown = function (event) { Mouse.click(event, true); };
    get('gameCanvas').onmouseup = function (event) { Mouse.click(event, false); };
    get('gameCanvas').onmousemove = Mouse.move;
    new Main().init();
};

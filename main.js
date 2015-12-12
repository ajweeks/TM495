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
        var deltaTime = (now - Main.lastDate);
        Main.elapsed += deltaTime;
        Main.lastDate = now;
        Main.f += deltaTime;
        ++Main.frames;
        if (Main.f > 1000) {
            Main.f -= 1000;
            Main.fps = Main.frames;
            Main.frames = 0;
        }
        Main.context.fillStyle = "#284B32";
        Main.context.fillRect(0, 0, Main.canvas.width, Main.canvas.height);
        Main.sm.update(deltaTime);
        Main.sm.render();
        Main.context.fillStyle = "#000";
        Main.context.fillText("FPS: " + Main.fps, 10, 18);
    };
    Main.elapsed = 0.0;
    Main.lastDate = 0.0;
    Main.frames = 0;
    Main.fps = 0;
    Main.f = 0;
    return Main;
})();
var StateManager = (function () {
    function StateManager() {
        this.states = new Array(1);
        this.states[0] = new MainMenuState(this);
    }
    StateManager.prototype.update = function (deltaTime) {
        this.currentState().update(deltaTime);
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
    BasicState.prototype.update = function (deltaTime) { };
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
        this.level = new Level(Main.canvas.width, Main.canvas.height * 2);
        this.player = new Player(this.level);
        this.camera = new Camera(this.player);
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
    GameState.prototype.update = function (deltaTime) {
        this.player.update(deltaTime);
        this.camera.update();
    };
    GameState.prototype.render = function () {
        this.level.render();
        this.player.render();
    };
    return GameState;
})(BasicState);
var Player = (function () {
    function Player(level) {
        this.a = 4;
        this.friction = 0.66;
        this.level = level;
        this.width = 64;
        this.height = 128;
        this.pos = new Vec2();
        this.pos.x = Main.canvas.width / 2;
        this.pos.y = 100;
        this.vel = new Vec2(0, 0);
        this.maxVel = Player.MAX_V_WALK;
    }
    Player.prototype.update = function (deltaTime) {
        if (Keyboard.keysDown.length > 0) {
            if (Keyboard.contains(Keyboard.KEYS.W)) {
                this.vel.y += this.a;
            }
            if (Keyboard.contains(Keyboard.KEYS.A)) {
                this.vel.x -= this.a;
            }
            if (Keyboard.contains(Keyboard.KEYS.S)) {
                this.vel.y -= this.a;
            }
            if (Keyboard.contains(Keyboard.KEYS.D)) {
                this.vel.x += this.a;
            }
            if (Keyboard.contains(Keyboard.KEYS.SHIFT)) {
                this.maxVel = Player.MAX_V_RUN;
            }
            else {
                this.maxVel = Player.MAX_V_WALK;
            }
        }
        this.vel.x *= this.friction;
        this.vel.y *= this.friction;
        if (this.vel.x > this.maxVel) {
            this.vel.x = this.maxVel;
        }
        else if (this.vel.x < -this.maxVel) {
            this.vel.x = -this.maxVel;
        }
        if (this.vel.y > this.maxVel) {
            this.vel.y = this.maxVel;
        }
        else if (this.vel.y < -this.maxVel) {
            this.vel.y = -this.maxVel;
        }
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        if (this.pos.x < 0) {
            this.pos.x = 0;
        }
        else if (this.pos.x + this.width > this.level.pixelWidth) {
            this.pos.x = this.level.pixelWidth - this.width;
        }
        if (this.pos.y < this.height) {
            this.pos.y = this.height;
        }
        else if (this.pos.y > this.level.pixelHeight) {
            this.pos.y = this.level.pixelHeight;
        }
    };
    Player.prototype.render = function () {
        Resource.player.render(this.pos.x, this.pos.y, this.vel.y < -Math.abs(this.vel.x) ? 2 : this.vel.x > 0 ? 0 : 1, this.width, this.height);
    };
    Player.MAX_V_WALK = 6;
    Player.MAX_V_RUN = 16;
    return Player;
})();
var Level = (function () {
    function Level(width, height) {
        this.pixelWidth = width;
        this.pixelHeight = height;
        this.trunks = new Array(50);
        for (var i = 0; i < this.trunks.length; ++i) {
            var pos;
            do {
                pos = new Vec2(Math.random() * (Main.canvas.width - 32), Math.random() * (this.pixelHeight - 140) + 140);
            } while (Level.overlaps(pos, this.trunks, new Vec2(32, 32)));
            this.trunks[i] = pos;
        }
    }
    Level.overlaps = function (pos, trunks, size) {
        for (var i = 0; i < trunks.length; ++i) {
            if (!trunks[i])
                continue;
            if (pos.x + size.x >= trunks[i].x &&
                pos.x <= trunks[i].x + size.x &&
                pos.y + size.y >= trunks[i].y &&
                pos.y <= trunks[i].y + size.y) {
                return true;
            }
        }
        return false;
    };
    Level.prototype.render = function () {
        Main.context.fillStyle = "#CCB595";
        Camera.fillRect(0, 110, Main.canvas.width, 100);
        for (var i in this.trunks) {
            Camera.drawImage(Resource.trunk, this.trunks[i].x, this.trunks[i].y, 32, 32);
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
        Resource.player = new SpriteSheet("res/player.png", 64, 128);
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
        Main.context.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x, Main.canvas.height - y + Camera.yo, width, height);
    };
    return SpriteSheet;
})();
var Camera = (function () {
    function Camera(player) {
        this.player = player;
    }
    Camera.prototype.update = function () {
        Camera.yo = this.player.pos.y - this.player.height / 2 - Main.canvas.height / 2;
        if (Camera.yo < 0) {
            Camera.yo = 0;
        }
        else if (Camera.yo > this.player.level.pixelHeight - Main.canvas.height) {
            Camera.yo = this.player.level.pixelHeight - Main.canvas.height;
        }
    };
    Camera.fillRect = function (x, y, width, height) {
        Main.context.fillRect(x, Main.canvas.height - y + Camera.yo, width, height);
    };
    Camera.drawImage = function (image, x, y, width, height) {
        Main.context.drawImage(image, x, Main.canvas.height - y + Camera.yo, width, height);
    };
    Camera.yo = 0;
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
        if (event.altKey)
            return false;
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
        if (event.altKey)
            return;
        for (var i in Keyboard.keysDown) {
            if (Keyboard.keysDown[i] === event.keyCode) {
                Keyboard.keysDown.splice(i, 1);
            }
        }
    };
    Keyboard.KEYS = {
        BACKSPACE: 8, TAB: 9, RETURN: 13, SHIFT: 16, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36,
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51,
        FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
        G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85,
        V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192
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

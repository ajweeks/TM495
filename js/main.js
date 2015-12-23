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
        console.log("TM495 v" + Main.VERSION + " by AJ Weeks");
        Resource.loadAll();
        Sound.init();
        Main.sm = new StateManager();
        Main.renderer = new Renderer();
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
        Main.sm.update(deltaTime);
        Main.sm.render();
    };
    Main.VERSION = "0.016";
    Main.elapsed = 0.0;
    Main.lastDate = 0.0;
    Main.frames = 0;
    Main.fps = 0;
    Main.f = 0;
    return Main;
})();
var Renderer = (function () {
    function Renderer() {
        this.previousTime = 0.0;
        this.elapsed = 0.0;
        this.width = 780;
        this.height = 480;
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x07141b, 1);
        this.renderer.domElement.textContent = "Your browser doesn't appear to support the <code>&lt;canvas&gt;</code> element.";
        this.renderer.domElement.id = "gameCanvas";
        get('gameContent').appendChild(this.renderer.domElement);
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
        this.camera.position = new THREE.Vector3(0, -6, 20);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.previousTime = new Date().getTime();
    }
    Renderer.prototype.render = function (scene) {
        var now = new Date().getTime();
        this.elapsed += (this.previousTime - now);
        this.renderer.render(scene, this.camera);
        this.previousTime = now;
    };
    Renderer.prototype.update = function () {
    };
    return Renderer;
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
        get('gameState').style.display = "initial";
        this.scene = new THREE.Scene();
        this.scene.add(new THREE.AmbientLight(new THREE.Color(0.8, 0.8, 0.9).getHex()));
        this.level = new Level(45, 100, this.scene);
        this.player = new Player(this.level, this.scene);
    }
    GameState.prototype.hide = function () {
        get('gameState').style.display = "none";
    };
    GameState.prototype.restore = function () {
        get('gameState').style.display = "initial";
    };
    GameState.prototype.destroy = function () {
        for (var i = this.scene.children.length - 1; i >= 0; --i) {
            this.scene.remove(this.scene.children[i]);
        }
        get('gameState').style.display = "none";
    };
    GameState.prototype.update = function (deltaTime) {
        this.player.update(deltaTime);
        this.updateCamera();
    };
    GameState.prototype.updateCamera = function () {
        var playerX = this.player.pivot.position.x;
        var playerY = this.player.pivot.position.y;
        var deltaY = playerY - Main.renderer.camera.position.y;
        if (deltaY > 8) {
            Main.renderer.camera.position.y = playerY - 8;
        }
        else if (deltaY < 3) {
            Main.renderer.camera.position.y = playerY - 3;
        }
    };
    GameState.prototype.render = function () {
        Main.renderer.render(this.scene);
    };
    return GameState;
})(BasicState);
var Player = (function () {
    function Player(level, scene) {
        this.level = level;
        this.width = 2.5;
        this.height = 5;
        this.wood = 0;
        get('woodInfoTab').innerHTML = "Wood: " + this.wood;
        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(0, this.height, 0);
        this.pivot.rotateX(Math.PI / 6.0);
        var textureAnimators = new Array(2);
        textureAnimators[0] = (new TextureAnimator(Resource.playerTexture, 3, 1, 3, 500));
        textureAnimators[1] = (new TextureAnimator(Resource.playerTexture, 3, 1, 3, 75));
        this.material = new THREE.MeshBasicMaterial({ map: textureAnimators[0].texture, transparent: true });
        this.animator = new SpriteAnimator(textureAnimators, this.material);
        var playerGeometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        var mesh = new THREE.Mesh(playerGeometry, this.material);
        mesh.position = new THREE.Vector3(0, 0, 2.5);
        this.pivot.add(mesh);
        scene.add(this.pivot);
        this.maxVel = Player.MAX_V_WALK;
    }
    Player.prototype.update = function (deltaTime) {
        this.animator.update(deltaTime);
        if (Keyboard.keysDown.length > 0) {
            if (Keyboard.contains(Keyboard.KEYS.SHIFT)) {
                this.maxVel = Player.MAX_V_RUN;
                this.animator.switchAnimation(1);
            }
            else {
                this.maxVel = Player.MAX_V_WALK;
                this.animator.switchAnimation(0);
            }
            var px = this.pivot.position.x;
            var py = this.pivot.position.y;
            if (Keyboard.contains(Keyboard.KEYS.W) || Keyboard.contains(Keyboard.KEYS.UP)) {
                this.pivot.position.y += this.maxVel * deltaTime;
            }
            else if (Keyboard.contains(Keyboard.KEYS.S) || Keyboard.contains(Keyboard.KEYS.DOWN)) {
                this.pivot.position.y -= this.maxVel * deltaTime;
            }
            if (Keyboard.contains(Keyboard.KEYS.A) || Keyboard.contains(Keyboard.KEYS.LEFT)) {
                this.pivot.position.x -= this.maxVel * deltaTime;
            }
            else if (Keyboard.contains(Keyboard.KEYS.D) || Keyboard.contains(Keyboard.KEYS.RIGHT)) {
                this.pivot.position.x += this.maxVel * deltaTime;
            }
            if (px == this.pivot.position.x && py == this.pivot.position.y) {
                this.animator.switchAnimation(0);
            }
            var nudgeMultiplyer = this.maxVel * 2;
            var tree = this.level.collides(this.pivot.position.x, this.pivot.position.y, this.width, this.height);
            if (tree !== null) {
                if (this.level.collides(this.pivot.position.x, py, this.width, this.height) === null) {
                    if (this.pivot.position.x < tree.pivot.position.x) {
                        this.pivot.position.x -= this.maxVel * deltaTime;
                    }
                    else {
                        this.pivot.position.x += this.maxVel * deltaTime;
                    }
                    this.pivot.position.y = py;
                }
                else if (this.level.collides(px, this.pivot.position.y, this.width, this.height) === null) {
                    if (this.pivot.position.y < tree.pivot.position.y) {
                        this.pivot.position.y -= this.maxVel * deltaTime;
                    }
                    else {
                        if (this.pivot.position.y > tree.pivot.position.y) {
                            this.pivot.position.y += this.maxVel * deltaTime;
                        }
                    }
                    this.pivot.position.x = px;
                }
            }
            if (this.pivot.position.x - this.width / 2 < -this.level.width / 2) {
                this.pivot.position.x = -this.level.width / 2 + this.width / 2;
            }
            if (this.pivot.position.x + this.width / 2 > this.level.width / 2) {
                this.pivot.position.x = this.level.width / 2 - this.width / 2;
            }
            if (this.pivot.position.y - this.height / 2 > this.level.height) {
                this.pivot.position.y = this.level.height + this.height / 2;
            }
            if (this.pivot.position.y - this.height < 0) {
                this.pivot.position.y = this.height;
            }
            if (Keyboard.contains(Keyboard.KEYS.C)) {
                var closest = -1;
                var closestDist = 5;
                for (var t in this.level.trees) {
                    var diff = new THREE.Vector3();
                    diff.subVectors(this.level.trees[t].pivot.position, this.pivot.position);
                    var dist = diff.length();
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = t;
                    }
                }
                if (closest != -1 && this.level.trees[closest].chopped == false) {
                    var rand = Math.floor(Math.random() * 3);
                    Sound.play(rand == 0 ? Sound.hit2 : (rand == 1 ? Sound.hit3 : Sound.hit4));
                    this.wood += this.level.trees[closest].woodValue;
                    get('woodInfoTab').innerHTML = "Wood: " + this.wood;
                    this.level.trees[closest].chopped = true;
                    this.level.trees[closest].pivot.children[0].material = new THREE.MeshPhongMaterial({
                        map: THREE.ImageUtils.loadTexture("res/trunk.png"),
                        transparent: true
                    });
                }
            }
        }
    };
    Player.MAX_V_WALK = 0.015;
    Player.MAX_V_RUN = 0.025;
    return Player;
})();
var Level = (function () {
    function Level(width, height, scene) {
        this.width = width;
        this.height = height;
        var planeGeometry = new THREE.PlaneGeometry(width, height);
        var planeMaterial = new THREE.MeshPhongMaterial({
            map: Resource.grassTexture
        });
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.position = new THREE.Vector3(0, this.height / 2, 0);
        scene.add(this.mesh);
        this.trees = new Array(50);
        for (var i = 0; i < this.trees.length; ++i) {
            var pos;
            do {
            } while (false);
            pos = new THREE.Vector2(Math.random() * width - width / 2, Math.random() * height + 5);
            this.trees[i] = new Tree(pos.x, pos.y, new THREE.Vector2(48, 48), scene);
        }
    }
    Level.prototype.collides = function (x, y, width, height) {
        var trunkRadius = 1.0;
        for (var t in this.trees) {
            var tree = this.trees[t];
            if (x - width / 2 > tree.pivot.position.x - trunkRadius - tree.width / 2 &&
                x + width / 2 < tree.pivot.position.x + trunkRadius + tree.width / 2 &&
                y > tree.pivot.position.y - trunkRadius &&
                y < tree.pivot.position.y + trunkRadius) {
                return tree;
            }
        }
        return null;
    };
    Level.overlaps = function (pos, trees, width, height) {
        for (var i = 0; i < trees.length; ++i) {
            if (!trees[i])
                continue;
            if (pos.x + width >= trees[i].pivot.position.x &&
                pos.x <= trees[i].pivot.position.x + width &&
                pos.y + height >= trees[i].pivot.position.y &&
                pos.y <= trees[i].pivot.position.y + height) {
                return true;
            }
        }
        return false;
    };
    return Level;
})();
var Tree = (function () {
    function Tree(x, y, size, scene) {
        this.chopped = false;
        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(x, y, 0);
        this.pivot.rotateX(Math.PI / 6.0);
        this.width = 5;
        this.height = 7 + Math.floor(Math.random() * 3);
        this.woodValue = this.height;
        var planeGeometry = new THREE.PlaneGeometry(this.width, this.height);
        var planeMaterial = new THREE.MeshPhongMaterial({
            map: Resource.treeTexture,
            transparent: true,
            shininess: 0.0
        });
        var mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        mesh.position.z = 2.35;
        this.pivot.add(mesh);
        scene.add(this.pivot);
        this.size = size;
        this.chopped = false;
    }
    Tree.prototype.chop = function () {
        this.chopped = true;
    };
    return Tree;
})();
var SpriteAnimator = (function () {
    function SpriteAnimator(textureAnimators, material, currentAnimationIndex) {
        if (currentAnimationIndex === void 0) { currentAnimationIndex = 0; }
        this.textureAnimators = textureAnimators;
        this.material = material;
        this.currentAnimationIndex = currentAnimationIndex;
    }
    SpriteAnimator.prototype.update = function (deltaTime) {
        this.textureAnimators[this.currentAnimationIndex].update(deltaTime);
    };
    SpriteAnimator.prototype.switchAnimation = function (newAnimationIndex) {
        this.currentAnimationIndex = newAnimationIndex;
        this.material.map = this.textureAnimators[this.currentAnimationIndex].texture;
    };
    return SpriteAnimator;
})();
var TextureAnimator = (function () {
    function TextureAnimator(texture, tileCountX, tileCountY, numberOfTiles, msPerFrame) {
        this.texture = texture;
        this.tileCountX = tileCountX;
        this.tileCountY = tileCountY;
        this.numberOfTiles = numberOfTiles;
        this.texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        this.texture.repeat.set(1 / this.tileCountX, 1 / this.tileCountY);
        this.msPerFrame = msPerFrame;
        this.msElapsedThisFrame = 0;
        this.currentTileIndex = 0;
    }
    TextureAnimator.prototype.update = function (deltaTime) {
        this.msElapsedThisFrame += deltaTime;
        while (this.msElapsedThisFrame > this.msPerFrame) {
            this.msElapsedThisFrame -= this.msPerFrame;
            this.currentTileIndex++;
            this.currentTileIndex %= this.numberOfTiles;
            var currentColumn = this.currentTileIndex % this.tileCountX;
            this.texture.offset.x = currentColumn / this.tileCountX;
            var currentRow = Math.floor(this.currentTileIndex / this.tileCountX);
            this.texture.offset.y = currentRow / this.tileCountY;
        }
    };
    return TextureAnimator;
})();
var Resource = (function () {
    function Resource() {
    }
    Resource.loadAll = function () {
        Resource.textureLoader = new THREE.TextureLoader();
        Resource.textureLoader.load("res/player.png", function (tex) {
            Resource.playerTexture = tex;
        });
        Resource.textureLoader.load("res/grass_diffuse.jpg", function (tex) {
            Resource.grassTexture = tex;
            Resource.grassTexture.wrapS = Resource.grassTexture.wrapT = THREE.RepeatWrapping;
            Resource.grassTexture.repeat.set(3, 6);
        });
        Resource.textureLoader.load("res/tree.png", function (tex) {
            Resource.treeTexture = tex;
        });
        Resource.textureLoader.load("res/trunk.png", function (tex) {
            Resource.trunkTexture = tex;
        });
        console.log("All textures loaded!");
    };
    return Resource;
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
        Controller.onKeyDown(event.keyCode);
        if (!Keyboard.contains(event.keyCode)) {
            Keyboard.keysDown.push(event.keyCode);
        }
        for (var k in Keyboard.KEYS) {
            if (event.keyCode == Keyboard.KEYS[k]) {
                return false;
            }
        }
        return true;
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
        Controller.onKeyDown(event.keyCode);
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
var INPUT;
(function (INPUT) {
    INPUT[INPUT["UP"] = 0] = "UP";
    INPUT[INPUT["DOWN"] = 1] = "DOWN";
    INPUT[INPUT["LEFT"] = 2] = "LEFT";
    INPUT[INPUT["RIGHT"] = 3] = "RIGHT";
    INPUT[INPUT["JUMP"] = 4] = "JUMP";
})(INPUT || (INPUT = {}));
var KeyboardInput = (function () {
    function KeyboardInput(keyCode) {
        this.down = false;
        this.pressed = false;
        this.ticksDown = -1;
        this.keyCode = keyCode;
    }
    KeyboardInput.prototype.onKeyDown = function () {
        if (this.down == false) {
            this.pressed = true;
            this.ticksDown = 1;
        }
        else {
            this.pressed = false;
            this.ticksDown++;
        }
    };
    KeyboardInput.prototype.onKeyUp = function () {
        this.down = false;
        this.pressed = false;
        this.ticksDown = -1;
    };
    return KeyboardInput;
})();
var Controller = (function () {
    function Controller() {
        Controller.inputs = new Array();
        Controller.inputs.push(new KeyboardInput(Keyboard.KEYS.W));
    }
    Controller.onKeyDown = function (keyCode) {
        for (var i in Controller.inputs) {
            if (Controller.inputs[i].keyCode == keyCode) {
                Controller.inputs[i].onKeyDown();
            }
        }
    };
    Controller.onKeyUp = function (keyCode) {
        for (var i in Controller.inputs) {
            if (Controller.inputs[i].keyCode == keyCode) {
                Controller.inputs[i].onKeyUp();
            }
        }
    };
    return Controller;
})();
var Sound = (function () {
    function Sound() {
    }
    Sound.init = function () {
        Sound.hit2 = get('hit2');
        Sound.hit3 = get('hit3');
        Sound.hit4 = get('hit4');
        Sound.volumeSlider = get('volumeSlider');
    };
    Sound.changeVolume = function () {
        Sound.volume = Number(Sound.volumeSlider.value) / 100;
    };
    Sound.toggleMute = function () {
        Sound.muted = !Sound.muted;
    };
    Sound.play = function (sound) {
        if (Sound.muted)
            return;
        sound.volume = Sound.volume;
        sound.currentTime = 0;
        sound.play();
    };
    Sound.muted = false;
    Sound.volume = 0.5;
    return Sound;
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
    get('gameContent').oncontextmenu = function () { return false; };
    get('gameContent').onmousedown = function (event) { Mouse.click(event, true); };
    get('gameContent').onmouseup = function (event) { Mouse.click(event, false); };
    get('gameContent').onmousemove = Mouse.move;
    new Main().init();
};

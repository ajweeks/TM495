
function get(what: string): HTMLElement {
    return document.getElementById(what);
}

class Main {

    static canvas: HTMLCanvasElement;
    static context: CanvasRenderingContext2D;
    static sm: StateManager;

    // TODO OPTIMIZE(AJ): Look into the effect of having a variable constantly incrementing like this
    static elapsed: number = 0.0;
    static lastDate: number = 0.0;

    init(): void {
        Main.canvas = <HTMLCanvasElement>get('gameCanvas');
        Main.context = Main.canvas.getContext('2d');

        Resource.loadAll();

        Main.sm = new StateManager();

        Main.lastDate = Date.now();

        Main.loop();
    }

    static frames = 0;
    static fps = 0;
    static f = 0;

    static loop(): void {
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
    }
}

/** A class used to keep track of what state we're in currently
    Uses a "stack" of states, with the last state added being the
    currentState. Starts with an instance of a MainMenuState which
    can not be removed.
     */
class StateManager {

    states: Array<BasicState>; // a stack of states

    constructor() {
        this.states = new Array<BasicState>(1);
        this.states[0] = new MainMenuState(this);
    }

    update(deltaTime: number): void {
        this.currentState().update(deltaTime);
    }

    render(): void {
        this.currentState().render();
    }

    /** Pushes supplied state object onto the state stack */
    enterState(state: BasicState): void {
        this.currentState().hide();
        this.states.push(state);
    }

    /** Pops current state off the state stack if there is more than one */
    enterPreviousState(): void {
        if (this.states.length > 1) {
            this.currentState().destroy();
            this.states.pop();
            this.currentState().restore();
        }
    }

    /** Returns the state at the top of the stack */
    currentState(): BasicState {
        return this.states[this.states.length - 1];
    }

    /** Returns a new state object represented by a string */
    getState(state: string): BasicState {
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
    }
}

enum STATE_TYPE { MAINMENU, ABOUT, GAME };

class BasicState {

    // OPTIMIZE(AJ): implement a class string member var used to automatically hide/restore/destroy
    type: STATE_TYPE;
    sm: StateManager;

    constructor(type: STATE_TYPE, sm: StateManager) {
        this.type = type;
        this.sm = sm;
    }

    update(deltaTime: number): void { }
    render(): void { }

    /** Is called when a new state is added "on top" of this one */
    hide(): void { }

    /** Is called after the state directly on top of this one in the state stack is destroyed */
    restore(): void { }

    /** Is called when the state is being popped off the state stack */
    destroy(): void { }
}

class MainMenuState extends BasicState {

    constructor(sm: StateManager) {
        super(STATE_TYPE.MAINMENU, sm);
        get('mainMenuState').style.display = "initial";
    }

    hide(): void {
        get('mainMenuState').style.display = "none";
    }

    restore(): void {
        get('mainMenuState').style.display = "initial";
    }

    destroy(): void {
        get('mainMenuState').style.display = "none";
    }
}

class AboutState extends BasicState {

    constructor(sm: StateManager) {
        super(STATE_TYPE.ABOUT, sm);
        get('aboutState').style.display = "initial";
    }

    hide(): void {
        get('aboutState').style.display = "none";
    }

    restore(): void {
        get('aboutState').style.display = "initial";
    }

    destroy(): void {
        get('aboutState').style.display = "none";
    }
}

class GameState extends BasicState {

    x: number = 0;
    y: number = 0;
    player: Player;
    level: Level;
    camera: Camera;

    constructor(sm: StateManager) {
        super(STATE_TYPE.GAME, sm);
        get('gameState').style.display = "initial";

        this.level = new Level(Main.canvas.width, Main.canvas.height * 2);
        this.player = new Player(this.level);
        this.camera = new Camera(this.player);
    }

    hide(): void {
        get('gameState').style.display = "none";
    }
    restore(): void {
        get('gameState').style.display = "initial";
    }
    destroy(): void {
        get('gameState').style.display = "none";
    }

    update(deltaTime: number): void {
        this.player.update(deltaTime);
        this.camera.update();
    }

    render(): void {
        this.level.render();
        this.player.render();
    }
}

class Player {
    static MAX_V_WALK: number = 6;
    static MAX_V_RUN: number = 16;

    width: number;
    height: number;

    pos: Vec2;
    vel: Vec2;
    maxVel;

    a: number = 4;

    friction: number = 0.66;

    level: Level;

    constructor(level: Level) {
        this.level = level;
        this.width = 64;
        this.height = 128;
        this.pos = new Vec2();
        this.pos.x = Main.canvas.width / 2;
        this.pos.y = 100;
        this.vel = new Vec2(0, 0);
        this.maxVel = Player.MAX_V_WALK;
    }

    update(deltaTime: number): void {
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
            } else {
                this.maxVel = Player.MAX_V_WALK;
            }
        }

        this.vel.x *= this.friction;
        this.vel.y *= this.friction;

        if (this.vel.x > this.maxVel) {
            this.vel.x = this.maxVel;
        } else if (this.vel.x < -this.maxVel) {
            this.vel.x = -this.maxVel;
        }
        // NOTE(AJ): This makes the player turn to the left when standing still after walking
        //           So just leave it as a small nubmer
        //else if (this.vel.x > -0.01 && this.vel.x < 0.01) {
        //    this.vel.x = 0;
        //}

        if (this.vel.y > this.maxVel) {
            this.vel.y = this.maxVel;
        } else if (this.vel.y < -this.maxVel) {
            this.vel.y = -this.maxVel;
        }
        // else if (this.vel.y > -0.01 && this.vel.y < 0.01) {
        //     this.vel.y = 0;
        // }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        if (this.pos.x < 0) {
            this.pos.x = 0;
        } else if (this.pos.x + this.width > this.level.pixelWidth) {
            this.pos.x = this.level.pixelWidth - this.width;
        }
        if (this.pos.y < this.height) { // NOTE(AJ): Y=0 is bottom of screen
            this.pos.y = this.height;
        } else if (this.pos.y > this.level.pixelHeight) {
            this.pos.y = this.level.pixelHeight;
        }
    }

    render(): void {
        Resource.player.render(
            this.pos.x,
            this.pos.y,
            this.vel.y < -Math.abs(this.vel.x) ? 2 : this.vel.x > 0 ? 0 : 1,
            this.width,
            this.height);
    }
}

class Level {

    trunks: Vec2[];
    pixelWidth: number;
    pixelHeight: number;

    constructor(width: number, height: number) {
        this.pixelWidth = width;
        this.pixelHeight = height;

        this.trunks = new Array<Vec2>(50);
        for (var i = 0; i < this.trunks.length; ++i) {
            var pos: Vec2;
            do {
                pos = new Vec2(Math.random() * (Main.canvas.width - 32), Math.random() * (this.pixelHeight - 140) + 140);
            } while (Level.overlaps(pos, this.trunks, new Vec2(32, 32)));

            this.trunks[i] = pos;
        }
    }

    static overlaps(pos: Vec2, trunks: Vec2[], size: Vec2): boolean {
        for (var i = 0; i < trunks.length; ++i) {
            if (!trunks[i]) continue; // skip the undefined trunks

            if (pos.x + size.x >= trunks[i].x &&
                pos.x <= trunks[i].x + size.x &&
                pos.y + size.y >= trunks[i].y &&
                pos.y <= trunks[i].y + size.y) {
                return true;
            }
        }
        return false;
    }

    render(): void {
        Main.context.fillStyle = "#CCB595"
        Camera.fillRect(0, 110, Main.canvas.width, 100);

        // LATER(AJ): add some randomness to how trunks are drawn
        for (var i in this.trunks) {
            Camera.drawImage(Resource.trunk, this.trunks[i].x, this.trunks[i].y, 32, 32);
        }
    }

}

class Vec2 {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // TODO(AJ): implement dot, cross, mult, etc. (if necessary)
}

// Note(AJ): A class to store any resources the game uses
// I've never tried this method before, we'll see if it's any good
class Resource {

    // Images
    static player: SpriteSheet; // player sprite sheet
    static trunk: HTMLImageElement;
    static deciduous_sapling: HTMLImageElement;
    static coninferous_sapling: HTMLImageElement;

    static loadAll() {
        Resource.player = new SpriteSheet("res/player.png", 64, 128);

        Resource.trunk = new Image();
        Resource.trunk.src = "res/trunk.png";

        Resource.deciduous_sapling = new Image();
        Resource.deciduous_sapling.src = "res/deciduous_sapling.png";

        Resource.coninferous_sapling = new Image();
        Resource.coninferous_sapling.src = "res/coniferous_sapling.png";
    }
}

class SpriteSheet {

    // Number of frames per axis
    // width: number;
    // height: number;

    // Size of each frame
    frameWidth: number;
    frameHeight: number;

    image: HTMLImageElement;
    // totalFrameCount: number;

    constructor(src: string, frameWidth: number, frameHeight: number) {
        this.image = new Image();
        this.image.src = src;

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    /** @param x, y: the position of the object in *level* space (knows nothing about the camera) */
    render(x: number, y: number, frameNumber: number, width: number, height: number): void {
        var sx = (frameNumber % this.image.width) * this.frameWidth;
        var sy = Math.floor(frameNumber / this.image.width) * this.frameHeight;
        Main.context.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x, Main.canvas.height - y + Camera.yo, width, height);
    }

}

// LATER(AJ): Figure out how to render to a camera, so we can use cool effects and stuff
// For now, just use this as a place to hold an offset to render things with
class Camera {

    //static xo = 0;
    static yo = 0;

    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    update() {
        Camera.yo = this.player.pos.y - this.player.height / 2 - Main.canvas.height / 2;
        if (Camera.yo < 0) {
            Camera.yo = 0;
        } else if (Camera.yo > this.player.level.pixelHeight - Main.canvas.height) {
            Camera.yo = this.player.level.pixelHeight - Main.canvas.height;
        }
    }

    /* Renders a rectangle at (x, y) WORLD SPACE correctly using camera's yo */
    static fillRect(x: number, y: number, width: number, height: number): void {
        Main.context.fillRect(x, Main.canvas.height - y + Camera.yo, width, height);
    }

    /* Renders an image at (x, y) WORLD SPACE correctly using camera's yo */
    static drawImage(image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
        Main.context.drawImage(image, x, Main.canvas.height - y + Camera.yo, width, height);
    }
}

enum ClickType {
    LMB, MMB, RMB
}

class Mouse {

    static x: number = -1;
    static y: number = -1;
    static ldown: boolean = false;
    static mdown: boolean = false;
    static rdown: boolean = false;

    static move(event: MouseEvent): void {
        // TODO(AJ): Browserproof this
        Mouse.x = event.offsetX;
        Mouse.y = event.offsetY;
    }

    static click(event: MouseEvent, down: boolean): void {
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
    }
}

class Keyboard {

    static KEYS = {
        BACKSPACE: 8, TAB: 9, RETURN: 13, SHIFT: 16, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36,
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51,
        FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
        G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85,
        V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192
    };

    // TODO(AJ): Browserproof this
    static keysDown: Array<number> = new Array<number>(0);

    static onKeyDown(event: KeyboardEvent) {
        if (event.altKey) return false; // let's not deal with this for now

        if (!Keyboard.contains(event.keyCode)) {
            Keyboard.keysDown.push(event.keyCode);
        }
    }

    static contains(keyCode: number): boolean {
        for (var i in Keyboard.keysDown) {
            if (keyCode === Keyboard.keysDown[i]) {
                return true; // this key is already in the array
            }
        }
        return false;
    }

    static onKeyUp(event: KeyboardEvent) {
        if (event.altKey) return; // let's not deal with this for now

        for (var i in Keyboard.keysDown) {
            if (Keyboard.keysDown[i] === event.keyCode) {
                Keyboard.keysDown.splice(i, 1);
            }
        }
    }
}

function clickType(event: MouseEvent): ClickType {
    if (event.which === 3 || event.button === 2)
        return ClickType.RMB;
    else if (event.which === 1 || event.button === 0)
        return ClickType.LMB;
    else if (event.which === 2 || event.button === 1)
        return ClickType.MMB;
}

function enterState(state: string): void {
    Main.sm.enterState(Main.sm.getState(state));
}

window.onkeydown = Keyboard.onKeyDown;
window.onkeyup = Keyboard.onKeyUp;

window.onload = function() {
    get('gameCanvas').oncontextmenu = function() { return false; }
    get('gameCanvas').onmousedown = function(event: MouseEvent) { Mouse.click(event, true) };
    get('gameCanvas').onmouseup = function(event: MouseEvent) { Mouse.click(event, false) };
    get('gameCanvas').onmousemove = Mouse.move;

    new Main().init();
}

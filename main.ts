
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

    static loop(): void {
        requestAnimationFrame(Main.loop);

        var now = Date.now();
        Main.elapsed += (now - Main.lastDate);
        Main.lastDate = now;

        Main.context.fillStyle = "#284B32";
        Main.context.fillRect(0, 0, Main.canvas.width, Main.canvas.height);


        Main.sm.update();
        Main.sm.render();
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

    update(): void {
        this.currentState().update();
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

    update(): void {}
    render(): void {}

    /** Is called when a new state is added "on top" of this one */
    hide(): void {}

    /** Is called after the state directly on top of this one in the state stack is destroyed */
    restore(): void {}

    /** Is called when the state is being popped off the state stack */
    destroy(): void {}
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

class GameState extends BasicState{

    x: number = 0;
    y: number = 0;
    player: Player;
    level: Level;

    constructor(sm: StateManager) {
        super(STATE_TYPE.GAME, sm);
        get('gameState').style.display = "initial";

        this.player = new Player();
        this.level = new Level();
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

    update(): void {
        this.player.update();
    }

    render(): void {
        this.level.render();
        this.player.render();
    }
}

class Player {

    width: number;
    height: number;

    x: number;
    y: number;
    xv: number;
    yv: number;
    maxXv: number = 18;
    maxYv: number = 18;

    ax: number = 0.5;
    ay: number = 0.5;

    friction: number = 0.80;

    constructor() {
        this.width = 32;
        this.height = 64;
        this.x = Main.canvas.width / 2;
        this.y = Main.canvas.height - this.height - 36;
        this.xv = 0;
        this.yv = 0;
    }

    update(): void {
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
        } else if (this.xv < -this.maxXv) {
            this.xv = -this.maxXv;
        }
        if (this.yv > this.maxYv) {
            this.yv = this.maxYv;
        } else if (this.xv < -this.maxYv) {
            this.yv = -this.maxYv;
        }

        this.x += this.xv;
        this.y += this.yv;

        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > Main.canvas.width) {
            this.x = Main.canvas.width - this.width;
        }
        if (this.y < 0) {
            this.y = 0;
        } else if (this.y + this.height> Main.canvas.height) {
            this.y = Main.canvas.height - this.height;
        }
    }

    render(): void {
        // Resource.player.render(this.player.x, this.player.y, Main.elapsed % 1000 > 500 ? 1 : 0);
        Resource.player.render(
            this.x,
            this.y,
            this.yv < -Math.abs(this.xv) ? 2 : this.xv > 0 ? 0 : 1,
            32 - (Main.canvas.height - this.y) / (Main.canvas.height) * 14,
            64 - (Main.canvas.height - this.y) / (Main.canvas.height) * 28);
            // if the player is going up faster than they are going to the side, show frame 3, else show side frame

    }

}

class Level {

    trunks: Vec2[];

    constructor() {
        this.trunks = new Array<Vec2>(50);
        for (var i = 0; i < this.trunks.length; ++i) {
            var pos: Vec2;
            do {
                pos = new Vec2(Math.random() * (Main.canvas.width - 32), Math.random() * (Main.canvas.height - 142));
            } while (Level.overlaps(pos, this.trunks));

            this.trunks[i] = pos;
        }
    }

    static overlaps(pos: Vec2, trunks: Vec2[]): boolean {
        for (var i = 0; i < trunks.length; ++i) {
            if (!trunks[i]) continue; // skip the undefined trunks

            if (pos.x + 32 >= trunks[i].x &&
                pos.x <= trunks[i].x + 32 &&
                pos.y + 32 >= trunks[i].y &&
                pos.y <= trunks[i].y + 32) {
                return true;
            }
        }
        return false;
    }

    render(): void {
        Main.context.fillStyle = "#CCB595"
        Main.context.fillRect(0, Main.canvas.height - 110, Main.canvas.width, Main.canvas.height);

        // LATER(AJ): add some randomness to how trunks are drawn
        for (var i in this.trunks) {
            Main.context.drawImage(
                Resource.deciduous_sapling,
                0, 0, 32, 32,
                this.trunks[i].x, this.trunks[i].y,
                32 - ((Main.canvas.height - this.trunks[i].y) / Main.canvas.height * 15),
                32 - ((Main.canvas.height - this.trunks[i].y) / Main.canvas.height * 15));
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
        Resource.player = new SpriteSheet("res/player.png", 32, 64);

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

        // NOTE(AJ): If we don't use an onload function, the width and height are set to 0
        // this.image.onload = this.setSize.bind(this);

        // this.totalFrameCount = ((this.width / this.frameWidth) * (this.height / this.frameHeight));
    }

    // setSize(event): any {
    //     this.width = (this.width / this.frameWidth);
    //     this.height = (this.height / this.frameHeight);
    // }

    render(x: number, y: number, frameNumber: number, width: number, height: number): void {
        var sx = (frameNumber % this.image.width) * this.frameWidth;
        var sy = Math.floor(frameNumber / this.image.width) * this.frameHeight;
        // Main.context.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x, y, this.frameWidth, this.frameHeight);
        Main.context.drawImage(this.image, sx, sy, this.frameWidth, this.frameHeight, x, y, width, height);
    }

}


// LATER(AJ): Figure out how to render to a camera, so we can use cool effects and stuff
class Camera {
    //render(): void {}
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
        switch(type) {
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
        BACKSPACE: 8, TAB: 9, RETURN: 13, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36,
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51,
        FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
        G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85,
        V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192, SHIFT: 999
    };

    // TODO(AJ): Browserproof this
    static keysDown: Array<number> = new Array<number>(0);

    static onKeyDown(event: KeyboardEvent) {
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
        var pos = -1;

        for (var i in Keyboard.keysDown) {
            if (Keyboard.keysDown[i] === event.keyCode) {
                pos = i;
            }
        }

        if (pos != -1) {
            Keyboard.keysDown.splice(pos, 1);
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

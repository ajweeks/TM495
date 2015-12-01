
function get(what: string): HTMLElement {
    return document.getElementById(what);
}

class Main {

    static canvas: HTMLCanvasElement;
    static context: CanvasRenderingContext2D;
    static sm: StateManager;

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

        Main.context.fillStyle = "#123";
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
    ldown: boolean = false;

    constructor(sm: StateManager) {
        super(STATE_TYPE.GAME, sm);
        get('gameState').style.display = "initial";
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

    update(): void {}

    render(): void {
        Main.context.drawImage(Resource.player, Mouse.x + Main.elapsed % (Main.canvas.width) - Mouse.x, Mouse.y);
    }
}

// Note(AJ): A class to store any resources the game uses
// I've never tried this method before, we'll se if it's any good
class Resource {

    // Images
    static player: HTMLImageElement;

    static loadAll() {
        Resource.player = new Image();
        Resource.player.src = "res/player.png";
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

window.onload = function() {
    get('gameCanvas').oncontextmenu = function() { return false; }
    get('gameCanvas').onmousedown = function(event: MouseEvent) { Mouse.click(event, true) };
    get('gameCanvas').onmouseup = function(event: MouseEvent) { Mouse.click(event, false) };
    get('gameCanvas').onmousemove = Mouse.move;

    new Main().init();
}

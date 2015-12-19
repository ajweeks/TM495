// Copyright AJ Weeks 2015

function get(what: string): HTMLElement {
    return document.getElementById(what);
}

// TODO(AJ): see if we can make Main not so static, that's probably a bad thing, right?
class Main {

    static VERSION = "0.015";

    static renderer: Renderer;
    static sm: StateManager;

    // TODO OPTIMIZE(AJ): Look into the effect of having a variable constantly incrementing like this
    // Is it ever even used?
    static elapsed: number = 0.0;
    static lastDate: number = 0.0;

    init(): void {
        console.log("TM495 v" + Main.VERSION + " by AJ Weeks");

        Resource.loadAll();


        Main.sm = new StateManager();
        Main.renderer = new Renderer();

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

        Main.sm.update(deltaTime);
        Main.sm.render();
    }
}

class Renderer {
    previousTime: number = 0.0;
    elapsed: number = 0.0;

    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;

    width = 780;
    height = 480;

    constructor() {
        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x07141b, 1);

        this.renderer.domElement.textContent = "Your browser doesn't appear to support the <code>&lt;canvas&gt;</code> element.";
        get('gameContent').appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 0.1, 1000);
        this.camera.position = new THREE.Vector3(0, -6,20);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.previousTime = new Date().getTime();
    }

    render(scene: THREE.Scene) {
        var now = new Date().getTime();
        this.elapsed += (this.previousTime - now);

        this.renderer.render(scene, this.camera);
        this.previousTime = now;
    }

    update() {

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
    scene: THREE.Scene;

    constructor(sm: StateManager) {
        super(STATE_TYPE.GAME, sm);
        get('gameState').style.display = "initial";

        this.scene = new THREE.Scene();

        this.scene.add(new THREE.AmbientLight(new THREE.Color(0.8, 0.8, 0.9).getHex()));

        this.level = new Level(45, 100, this.scene);
        this.player = new Player(this.level, this.scene);
    }

    hide(): void {
        get('gameState').style.display = "none";
    }
    restore(): void {
        get('gameState').style.display = "initial";
    }
    destroy(): void {
        for (var i = this.scene.children.length - 1; i >= 0; --i) {
            this.scene.remove(this.scene.children[i]);
        }
        get('gameState').style.display = "none";
    }

    update(deltaTime: number): void {
        this.player.update(deltaTime);

        Main.renderer.camera.position.x = this.player.pivot.position.x;
        Main.renderer.camera.position.y = this.player.pivot.position.y - 5;
    }

    render(): void {
        Main.renderer.render(this.scene);
    }
}

class Player {
    static MAX_V_WALK: number = 0.015;
    static MAX_V_RUN: number = 0.025;

    width: number;
    height: number;

    pivot: THREE.Object3D;
    //mesh: THREE.Mesh;
    maxVel: number;

    level: Level;

    constructor(level: Level, scene: THREE.Scene) {
        this.level = level;
        this.width = 2.5;
        this.height = 5;

        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(0, this.height, 0);
        this.pivot.rotateX(Math.PI / 6.0);

        var planeGeometry = new THREE.PlaneGeometry(this.width, this.height);
        var planeMaterial = new THREE.MeshPhongMaterial(
            {
                map: THREE.ImageUtils.loadTexture("res/player1.png"),
                transparent: true,
                shininess: 0.0
            }
        );
        var mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        mesh.position = new THREE.Vector3(0, 0, 2.5);

        this.pivot.add(mesh);
        scene.add(this.pivot);

        this.maxVel = Player.MAX_V_WALK;
    }

    update(deltaTime: number): void {
        if (Keyboard.keysDown.length > 0) {
            if (Keyboard.contains(Keyboard.KEYS.SHIFT)) {
                this.maxVel = Player.MAX_V_RUN;
            } else {
                this.maxVel = Player.MAX_V_WALK;
            }

            var px = this.pivot.position.x;
            var py = this.pivot.position.y;

            if (Keyboard.contains(Keyboard.KEYS.W) || Keyboard.contains(Keyboard.KEYS.UP)) {
                this.pivot.position.y += this.maxVel * deltaTime;
            } else if (Keyboard.contains(Keyboard.KEYS.S) || Keyboard.contains(Keyboard.KEYS.DOWN)) {
                this.pivot.position.y -= this.maxVel * deltaTime;
            }
            if (Keyboard.contains(Keyboard.KEYS.A) || Keyboard.contains(Keyboard.KEYS.LEFT)) {
                this.pivot.position.x -= this.maxVel * deltaTime;
            } else if (Keyboard.contains(Keyboard.KEYS.D) || Keyboard.contains(Keyboard.KEYS.RIGHT)) {
                this.pivot.position.x += this.maxVel * deltaTime;
            }

            for (var i = 0; i < this.level.trees.length; ++i) {
                var tree = this.level.trees[i];
                var heightRadiusSizeThing = 3;
                // FIXME(AJ): This collision detection is comple garbage, pls fix it soon
                if (this.pivot.position.x - this.width / 2 > tree.pivot.position.x - 0.5 - tree.width / 2 &&
                    this.pivot.position.x + this.width / 2 < tree.pivot.position.x + 0.5 + tree.width / 2 &&
                    this.pivot.position.y > tree.pivot.position.y - heightRadiusSizeThing &&
                    this.pivot.position.y < tree.pivot.position.y + heightRadiusSizeThing) {
                        this.pivot.position.x = px;
                        this.pivot.position.y = py;
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
            if (this.pivot.position.y - this.height < 0) { // TODO(AJ): This isn't quite perfect yet, but it'll work for now
                this.pivot.position.y = this.height;
            }

            // Now that our position has been worked out, check for other input

            if (Keyboard.contains(Keyboard.KEYS.C)) { // It's a choppin time!
                // Get the closest tree
                var closest = -1; // index of the closest tree
                var closestDist = 5; // How close a tree has to be to us to be in choppin range
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
                    this.level.trees[closest].chopped = true;

                    //this.level.trees[closest].pivot.remove(this.level.trees[closest].pivot.children[0]);

                    // var mat = new THREE.MeshPhongMaterial({
                    //     map: THREE.ImageUtils.loadTexture("res/trunk.png"),
                    //     transparent: true
                    // });
                    // var geometry = new THREE.PlaneGeometry(3, 3);
                    //this.level.trees[closest].pivot.add(new THREE.Mesh(geometry, mat));

                    //this.level.trees[closest].pivot.children[0] = new THREE.Mesh(geometry, mat);

                    (<THREE.Mesh>this.level.trees[closest].pivot.children[0]).material = new THREE.MeshPhongMaterial({
                        map: THREE.ImageUtils.loadTexture("res/trunk.png"),
                        transparent: true
                    });

                }
            }
        }
    }
}

class Level {

    trees: Tree[];
    width: number;
    height: number;
    mesh: THREE.Mesh;

    constructor(width: number, height: number, scene: THREE.Scene) {
        this.width = width;
        this.height = height;

        var planeGeometry = new THREE.PlaneGeometry(width, height);
        // var planeMaterial = new THREE.MeshBasicMaterial({ color: 0x332230, wireframe: false });
        var grassTexture = THREE.ImageUtils.loadTexture("res/grass_diffuse.jpg");
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(3, 6);
        var planeMaterial = new THREE.MeshPhongMaterial({
            map: grassTexture
        });
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.position = new THREE.Vector3(0, this.height / 2, 0);
        scene.add(this.mesh);

        this.trees = new Array<Tree>(50);
        for (var i = 0; i < this.trees.length; ++i) {
            var pos: Vec2;
            do {
            } while (false);
            pos = new Vec2(Math.random() * width - width / 2, Math.random() * height + 5);

            this.trees[i] = new Tree(pos.x, pos.y, new Vec2(48, 48), scene);
        }
    }

    static overlaps(pos: Vec2, trees: Tree[], width: number, height: number): boolean {
        for (var i = 0; i < trees.length; ++i) {
            if (!trees[i]) continue; // skip the undefined trunks

            if (pos.x + width >= trees[i].pivot.position.x &&
                pos.x <= trees[i].pivot.position.x + width &&
                pos.y + height >= trees[i].pivot.position.y &&
                pos.y <= trees[i].pivot.position.y + height) {
                return true;
            }
        }
        return false;
    }
}

class Tree {

    pivot: THREE.Object3D;
    size: Vec2;
    chopped: boolean;
    width: number;
    height: number;

    constructor(x: number, y: number, size: Vec2, scene: THREE.Scene) {

        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(x, y, 0);
        this.pivot.rotateX(Math.PI / 6.0);

        this.width = 3;
        this.height = 6;
        var planeGeometry = new THREE.PlaneGeometry(this.width, this.height);
        var planeMaterial = new THREE.MeshPhongMaterial(
            {
                map: THREE.ImageUtils.loadTexture("res/tree.png"),
                transparent: true,
                shininess: 0.0
            }
        );
        var mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        mesh.position.z = 1.85;

        this.pivot.add(mesh);
        scene.add(this.pivot);

        this.size = size;
        this.chopped = false;
    }

    chop() { // not at all necessary - totally inlinable, but an awesome method name
        this.chopped = true;
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

    static player: SpriteSheet;
    static trunk: HTMLImageElement;
    static tree: HTMLImageElement;
    static deciduous_sapling: HTMLImageElement;
    static coninferous_sapling: HTMLImageElement;

    static loadAll() {
        Resource.player = new SpriteSheet("res/player.png", 64, 128);

        Resource.trunk = new Image();
        Resource.trunk.src = "res/trunk.png";

        Resource.tree = new Image();
        Resource.tree.src = "res/tree.png";

        Resource.deciduous_sapling = new Image();
        Resource.deciduous_sapling.src = "res/deciduous_sapling.png";

        Resource.coninferous_sapling = new Image();
        Resource.coninferous_sapling.src = "res/coniferous_sapling.png";
    }
}

class SpriteSheet {

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

        for (var k in Keyboard.KEYS) {
            if (event.keyCode == Keyboard.KEYS[k]) {
                return false; // we handled this keypress, don't pass it on to the browser
            }
        }

        return true; // We didn't handle this keypress,
                     // Let the browser decide what to do with this keypress
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
        for (var i in Keyboard.keysDown) {
            if (Keyboard.keysDown[i] === event.keyCode) {
                Keyboard.keysDown.splice(i, 1);
                // don't break after the item has been found, in case it's in there more than once
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
    get('gameContent').oncontextmenu = function() { return false; }
    get('gameContent').onmousedown = function(event: MouseEvent) { Mouse.click(event, true) };
    get('gameContent').onmouseup = function(event: MouseEvent) { Mouse.click(event, false) };
    get('gameContent').onmousemove = Mouse.move;

    new Main().init();
}

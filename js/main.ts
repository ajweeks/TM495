
/**
    TM495 (it might be a temporary name, we'll see)
    Read ideas.txt if you want to know more about the game!

    MOATL (mother of all todo lists):

    -[ ] Convert everything to 3D!!!!
    -[ ] Prevent back button from leaving the page?
      - Not entirely prevent perhaps, but *at least* warn the user
    -[ ] Add saves (localstorage? cookies?)
    -[ ] Reimpliment the way collisions are handled
      - Using a system which collects all collidables?
    -[ ] Check/fix cross browser support
    -[ ] Add store where the player can upgrade their things (and themselves!)
    -[x] Add more (better) chopping sound effects
    -[ ] Add a tree falling sound?
    -[ ] Fix right clicking outside the canvas?
    -[ ] Add controller support?

 */

function get(what: string): HTMLElement {
    return document.getElementById(what);
}

// TODO(AJ): see if we can make Main inot so static, that's probably a bad thing, right?
class Main {

    static VERSION = "0.018";

    static renderer: Renderer;
    static sm: StateManager;

    // TODO OPTIMIZE(AJ): Look into the effect of having a variable constantly incrementing like this
    // Is it ever even used?
    static elapsed: number = 0.0;
    static lastDate: number = 0.0;

    init(): void {
        console.log("TM495 v" + Main.VERSION + " by AJ Weeks");

        // NOTE(AJ): load all images
        Resource.loadAll();

        //NOTE(AJ): load all sounds
        Sound.init();

        Main.sm = new StateManager();
        Main.renderer = new Renderer();

        Main.lastDate = Date.now();

        Main.loop();
    }

    static frames = 0;
    static fps = 0;
    static elapsedThisFrame = 0;

    static loop(): void {
        requestAnimationFrame(Main.loop);

        var now = Date.now();
        var deltaTime = (now - Main.lastDate);
        Main.elapsed += deltaTime;
        Main.lastDate = now;

        Main.elapsedThisFrame += deltaTime;
        ++Main.frames;
        if (Main.elapsedThisFrame > 1000) {
            Main.elapsedThisFrame -= 1000;
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
        this.renderer.domElement.id = "gameCanvas";
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
            case "loading":
                return new LoadingState(this);
            default:
                console.error("Uncaught state type in StateManager.getState(): ", state);
                return null;
        }
    }
}

enum STATE_TYPE { MAINMENU, ABOUT, LOADING, GAME };

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

class LoadingState extends BasicState {

    constructor(sm: StateManager) {
        super(STATE_TYPE.LOADING, sm);
    }

    // @override
    update(deltaTime: number): void {
        if (Resource.ALL_LOADED) {
            this.sm.enterPreviousState();
            this.sm.enterState(new GameState(this.sm));
        }
    }

    hide(): void {
        get('loadingState').style.display = "none";
    }

    restore(): void {
        get('loadingState').style.display = "initial";
    }

    destroy(): void {
        get('loadingState').style.display = "none";
    }

}

class GameState extends BasicState {

    player: Player;
    level: Level;
    scene: THREE.Scene;
    entityManager: EntityManager;
    cameraAcceleration: THREE.Vector2; // How quickly the camera can change direction

    constructor(sm: StateManager) {
        super(STATE_TYPE.GAME, sm);
        get('gameState').style.display = "initial";

        this.scene = new THREE.Scene();

        this.scene.add(new THREE.AmbientLight(new THREE.Color(0.8, 0.8, 0.9).getHex()));

        this.entityManager = new EntityManager(this.scene);

        this.level = new Level(40, 2535, this.scene);
        this.player = new Player(this.level, this.scene, this);
        this.cameraAcceleration = new THREE.Vector2(0, 0.022);
        Main.renderer.camera.position.x = this.player.pivot.position.x;
        Main.renderer.camera.position.y = this.player.pivot.position.y - this.player.height;
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
        this.updateCamera(deltaTime);
        this.entityManager.update(deltaTime);
    }

    updateCamera(deltaTime: number): void {
        var playerX = this.player.pivot.position.x;
        var playerY = this.player.pivot.position.y;

        var deltaY = playerY - Main.renderer.camera.position.y - 7;
        var speedY = (deltaY/3 * this.cameraAcceleration.y) * deltaTime;
        Main.renderer.camera.position.y += speedY;
    }

    render(): void {
        Main.renderer.render(this.scene);
    }
}

class Axe {
    type: AXE;
    damage: number; // How much damage this axe does to trees
    swingTime: number; // How many frames you have to wait to swing again

    constructor(type: AXE) {
        this.type = type;

        switch (this.type) {
            case AXE.STEEL: {
                this.damage = 1;
                this.swingTime = 22;
            }
            break;
            case AXE.GOLD: {
                this.damage = 2;
                this.swingTime = 18;
            }
            break;
        }
    }

}

enum AXE {
    STEEL, GOLD
}

enum DIRECTION {
    NORTH = 0, NORTHEAST, EAST, SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST
}

class Direction {

    static anticlockwise(d: DIRECTION): DIRECTION {
        switch (d) {
        case DIRECTION.NORTH:
            return DIRECTION.NORTHWEST;
        case DIRECTION.NORTHEAST:
            return DIRECTION.NORTH;
        case DIRECTION.EAST:
            return DIRECTION.NORTHEAST;
        case DIRECTION.SOUTHEAST:
            return DIRECTION.EAST;
        case DIRECTION.SOUTH:
            return DIRECTION.SOUTHEAST;
        case DIRECTION.SOUTHWEST:
            return DIRECTION.SOUTH;
        case DIRECTION.WEST:
            return DIRECTION.SOUTHWEST;
        case DIRECTION.NORTHWEST:
            return DIRECTION.WEST;
        }
    }

    static clockwise(d: DIRECTION): DIRECTION {
        switch (d) {
        case DIRECTION.NORTH:
            return DIRECTION.NORTHEAST;
        case DIRECTION.NORTHEAST:
            return DIRECTION.EAST;
        case DIRECTION.EAST:
            return DIRECTION.SOUTHEAST;
        case DIRECTION.SOUTHEAST:
            return DIRECTION.SOUTH;
        case DIRECTION.SOUTH:
            return DIRECTION.SOUTHWEST;
        case DIRECTION.SOUTHWEST:
            return DIRECTION.WEST;
        case DIRECTION.WEST:
            return DIRECTION.NORTHWEST;
        case DIRECTION.NORTHWEST:
            return DIRECTION.NORTH;
        }
    }

    static opposite(d: DIRECTION): DIRECTION {
        switch (d) {
        case DIRECTION.NORTH:
            return DIRECTION.SOUTH;
        case DIRECTION.NORTHEAST:
            return DIRECTION.SOUTHWEST;
        case DIRECTION.EAST:
            return DIRECTION.WEST;
        case DIRECTION.SOUTHEAST:
            return DIRECTION.NORTHWEST;
        case DIRECTION.SOUTH:
            return DIRECTION.NORTH;
        case DIRECTION.SOUTHWEST:
            return DIRECTION.NORTHEAST;
        case DIRECTION.WEST:
            return DIRECTION.EAST;
        case DIRECTION.NORTHWEST:
            return DIRECTION.SOUTHEAST;
        }
    }

    /** Returns true if the given direction d is one or less eighth away from direction dir */
    static sameishDirection(d: DIRECTION, dir: DIRECTION): boolean {
        switch (dir) {
        case DIRECTION.NORTH:
            return d === DIRECTION.NORTHWEST || d === DIRECTION.NORTH || d === DIRECTION.NORTHEAST;
        case DIRECTION.NORTHEAST:
            return d === DIRECTION.NORTH || d === DIRECTION.NORTHEAST || d === DIRECTION.EAST;
        case DIRECTION.EAST:
            return d === DIRECTION.NORTHEAST || d === DIRECTION.EAST || d === DIRECTION.SOUTHEAST;
        case DIRECTION.SOUTHEAST:
            return d === DIRECTION.EAST || d === DIRECTION.SOUTHEAST || d === DIRECTION.SOUTH;
        case DIRECTION.SOUTH:
            return d === DIRECTION.SOUTHEAST || d === DIRECTION.SOUTH || d === DIRECTION.SOUTHWEST;
        case DIRECTION.SOUTHWEST:
            return d === DIRECTION.SOUTH || d === DIRECTION.SOUTHWEST || d === DIRECTION.WEST;
        case DIRECTION.WEST:
            return d === DIRECTION.SOUTHWEST || d === DIRECTION.WEST || d === DIRECTION.NORTHWEST;
        case DIRECTION.NORTHWEST:
            return d === DIRECTION.WEST || d === DIRECTION.NORTHWEST || d === DIRECTION.NORTH;
        }
    }
}

class Player {
    static MAX_V_WALK: number = 0.015;
    static MAX_V_RUN: number = 0.025;

    width: number;
    height: number;

    facing: DIRECTION = DIRECTION.EAST;

    pivot: THREE.Object3D;
    animator: SpriteAnimator;
    maxVel: number;

    axe: Axe;

    wood: number;
    choppingTime: number = 0; // how many ticks we have to wait to chop again!

    level: Level;
    gameState: GameState;

    playerMesh: THREE.Mesh;
    toolMesh: THREE.Mesh;

    playerMaterial: THREE.MeshBasicMaterial;
    toolMaterial: THREE.MeshBasicMaterial;

    static IDLE_ANIM = 0;
    static WALK_ANIM = 1;
    static RUN_ANIM = 2;

    static IDLE_UPWARDS_ANIM = 3;
    static WALK_UPWARDS_ANIM = 4;
    static RUN_UPWARDS_ANIM = 5;

    static IDLE_DOWNWARDS_ANIM = 6;
    static WALK_DOWNWARDS_ANIM = 7;
    static RUN_DOWNWARDS_ANIM = 8;

    constructor(level: Level, scene: THREE.Scene, gameState: GameState) {
        this.level = level;
        this.gameState = gameState;
        this.width = 2.5;
        this.height = 5;

        this.axe = new Axe(AXE.STEEL);

        this.wood = 0;
        get('woodInfoTab').innerHTML = "Wood: " + this.wood;

        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(0, this.height, 0);
        this.pivot.rotation.x = (Math.PI / 6.0);

    	var textureAnimators = new Array<TextureAnimator>();
        textureAnimators.push(new TextureAnimator(Resource.playerIdleTexture, 2, 1, 480));
        textureAnimators.push(new TextureAnimator(Resource.playerWalkingTexture, 4, 1, 160));
        textureAnimators.push(new TextureAnimator(Resource.playerRunningTexture, 4, 1, 130));

        textureAnimators.push(new TextureAnimator(Resource.playerUpwardsIdleTexture, 2, 1, 480));
        textureAnimators.push(new TextureAnimator(Resource.playerUpwardsWalkingTexture, 4, 1, 160));
        textureAnimators.push(new TextureAnimator(Resource.playerUpwardsRunningTexture, 4, 1, 130));

        textureAnimators.push(new TextureAnimator(Resource.playerDownwardsIdleTexture, 2, 1, 480));
        textureAnimators.push(new TextureAnimator(Resource.playerDownwardsWalkingTexture, 4, 1, 160));
        textureAnimators.push(new TextureAnimator(Resource.playerDownwardsRunningTexture, 4, 1, 130));


        this.playerMaterial = new THREE.MeshBasicMaterial( { map: textureAnimators[Player.IDLE_UPWARDS_ANIM].texture, transparent: true, side: THREE.DoubleSide } );
        this.animator = new SpriteAnimator(textureAnimators, this.playerMaterial);

        var playerGeometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        this.playerMesh = new THREE.Mesh(playerGeometry, this.playerMaterial);
        this.playerMesh.position = new THREE.Vector3(0, 0, 2.5);

        this.toolMaterial = new THREE.MeshBasicMaterial( { map: Resource.steelAxeTexture, transparent: true, side: THREE.DoubleSide });
        var toolGeometry = new THREE.PlaneGeometry(2.5, 2.5);
        this.toolMesh = new THREE.Mesh(toolGeometry, this.toolMaterial);
        this.toolMesh.position = new THREE.Vector3(1.0, 0.0, -0.1);

        this.playerMesh.add(this.toolMesh);
        this.pivot.add(this.playerMesh);
        scene.add(this.pivot);

        this.maxVel = Player.MAX_V_WALK;
    }

    update(deltaTime: number): void {
        this.animator.update(deltaTime);
        if (this.choppingTime > 0) {
            --this.choppingTime;
        }

        if (Keyboard.keysDown.length > 0) {
            this.updatePosition(deltaTime);

            if (Keyboard.contains(Keyboard.KEYS.SPACE)) { // It's a choppin time!
                this.swingAxe(deltaTime);
            }

            if (Keyboard.contains(Keyboard.KEYS.B)) { // Build an axe
                if (this.wood >= 15 && this.axe.type == AXE.STEEL) {
                    this.axe = new Axe(AXE.GOLD);
                    this.wood -= 15;

                    this.toolMaterial.map = Resource.goldAxeTexture;
                    this.toolMesh.rotateZ(-1);
                    setTimeout(function(w) { w.rotateZ(-1); }, 50, this.toolMesh);
                    setTimeout(function(w) { w.rotateZ(-1); }, 150, this.toolMesh);
                    setTimeout(function(w) { w.rotateZ(-1); }, 250, this.toolMesh);
                    setTimeout(function(w) { w.rotateZ(-1); }, 350, this.toolMesh);
                    setTimeout(function(w) { w.rotateZ(5); }, 450, this.toolMesh);

                    Sound.play(Sound.powerup);
                }
            }
        } else {
            // TODO(AJ): Try to avoid calling switchAnimation this every frame?
            switch (this.facing) {
                case DIRECTION.NORTH:
                case DIRECTION.NORTHEAST:
                case DIRECTION.NORTHWEST:
                    this.animator.switchAnimation(Player.IDLE_UPWARDS_ANIM);
                    break;
                case DIRECTION.SOUTH:
                case DIRECTION.SOUTHEAST:
                case DIRECTION.SOUTHWEST:
                    this.animator.switchAnimation(Player.IDLE_DOWNWARDS_ANIM);
                    break;
                default:
                    this.animator.switchAnimation(Player.IDLE_ANIM);
                    break;
            }
        }
    }

    /** Reads in user input and affects player's position accordingly */
    updatePosition(deltaTime: number): void {
        if (Keyboard.contains(Keyboard.KEYS.SHIFT)) {
            this.maxVel = Player.MAX_V_RUN;
        } else {
            this.maxVel = Player.MAX_V_WALK;
        }

        var px = this.pivot.position.x;
        var py = this.pivot.position.y;

        var xv = 0;
        var yv = 0;

        var input = false;

        if (Keyboard.contains(Keyboard.KEYS.W) || Keyboard.contains(Keyboard.KEYS.UP)) {
            yv = this.maxVel * deltaTime;
            input = true;
        } else if (Keyboard.contains(Keyboard.KEYS.S) || Keyboard.contains(Keyboard.KEYS.DOWN)) {
            yv = -this.maxVel * deltaTime;
            input = true;
        }
        if (Keyboard.contains(Keyboard.KEYS.A) || Keyboard.contains(Keyboard.KEYS.LEFT)) {
            xv = -this.maxVel * deltaTime;
            input = true;
        } else if (Keyboard.contains(Keyboard.KEYS.D) || Keyboard.contains(Keyboard.KEYS.RIGHT)) {
            xv = this.maxVel * deltaTime;
            input = true;
        }

        if (yv > 0) {
            if (xv < 0) {
                this.facing = DIRECTION.NORTHWEST;
                this.playerMesh.rotation.y = Math.PI;
            } else if (xv > 0) {
                this.facing = DIRECTION.NORTHEAST;
                this.playerMesh.rotation.y = 0;
            } else {
                this.facing = DIRECTION.NORTH;
            }

            if (this.maxVel === Player.MAX_V_RUN) {
                this.animator.switchAnimation(Player.RUN_UPWARDS_ANIM);
            } else if (this.maxVel === Player.MAX_V_WALK) {
                this.animator.switchAnimation(Player.WALK_UPWARDS_ANIM);
            }
        } else if (yv < 0) {
            if (xv < 0) {
                this.facing = DIRECTION.SOUTHWEST;
                this.playerMesh.rotation.y = Math.PI;
            } else if (xv > 0) {
                this.facing = DIRECTION.SOUTHEAST;
                this.playerMesh.rotation.y = 0;
            } else {
                this.facing = DIRECTION.SOUTH;
            }

            if (this.maxVel === Player.MAX_V_RUN) {
                this.animator.switchAnimation(Player.RUN_DOWNWARDS_ANIM);
            } else if (this.maxVel === Player.MAX_V_WALK) {
                this.animator.switchAnimation(Player.WALK_DOWNWARDS_ANIM);
            }
        } else if (xv < 0) {
            this.facing = DIRECTION.WEST;
            this.playerMesh.rotation.y = Math.PI;
            if (this.maxVel === Player.MAX_V_RUN) {
                this.animator.switchAnimation(Player.RUN_ANIM);
            } else if (this.maxVel === Player.MAX_V_WALK) {
                this.animator.switchAnimation(Player.WALK_ANIM);
            }
        } else if (xv > 0) {
            this.facing = DIRECTION.EAST;
            this.playerMesh.rotation.y = 0;
            if (this.maxVel === Player.MAX_V_RUN) {
                this.animator.switchAnimation(Player.RUN_ANIM);
            } else if (this.maxVel === Player.MAX_V_WALK) {
                this.animator.switchAnimation(Player.WALK_ANIM);
            }
        }

        if (xv !== 0 && yv !== 0) { // keep the player's velocity constant when they are running diagonally
            // TODO(AJ): ensure this is the physically correct thing to do
            xv /= Math.SQRT2;
            yv /= Math.SQRT2;
        }

        this.pivot.position.x += xv;
        this.pivot.position.y += yv;

        if (px === this.pivot.position.x && py === this.pivot.position.y) {
            switch (this.facing) {
                case DIRECTION.NORTH:
                case DIRECTION.NORTHEAST:
                case DIRECTION.NORTHWEST:
                    this.animator.switchAnimation(Player.IDLE_UPWARDS_ANIM);
                    break;
                case DIRECTION.SOUTH:
                case DIRECTION.SOUTHEAST:
                case DIRECTION.SOUTHWEST:
                    this.animator.switchAnimation(Player.IDLE_DOWNWARDS_ANIM);
                    break;
                default:
                    this.animator.switchAnimation(Player.IDLE_ANIM);
                    break;
            }
        }

        this.collideWithEntities();

        // TODO(AJ): The collision detection works well, but it could possibly be the cause of some bottlenecks,
        // check if there are any obvious ways to improve performace
        // also the code is a little messy, but maybe that's just an unavoidable thing...
        var nudgeMultiplyer = this.maxVel * 2;
        var nudgeThreshold = 3; // How close to the edge of the object does the player have to be to get nudged
        var tree = this.level.collides(this.pivot.position.x, this.pivot.position.y, this.width, this.height);
        if (tree !== null) { // Collision!
            if (this.level.collides(this.pivot.position.x, py, this.width, this.height) === null) { // the new y value is the problem
                if (this.pivot.position.x < tree.pivot.position.x) { // check what half of the object we're on
                    var dist = Math.abs((this.pivot.position.x + this.width / 2) - (tree.pivot.position.x - tree.width / 2));
                    if (dist < nudgeThreshold) { // only nudge the player if they're near the edge of the object
                        if (xv <= 0) { // prevent the player from being stationary when holding UP and LEFT at the corner of a tree
                            this.pivot.position.x -= this.maxVel * deltaTime;
                        }
                    }
                } else {
                    var dist = Math.abs((this.pivot.position.x - this.width / 2) - (tree.pivot.position.x + tree.width / 2));
                    if (dist < nudgeThreshold) { // only nudge the player if they're near the edge of the object
                        if (xv >= 0) {
                            this.pivot.position.x += this.maxVel * deltaTime;
                        }
                    }
                }

                this.pivot.position.y = py;
            } else if (this.level.collides(px, this.pivot.position.y, this.width, this.height) === null) { // the new x value is the problem
                if (this.pivot.position.y < tree.pivot.position.y) {
                    // NOTE(AJ): At the current time, dist will almost certainly be *always* smaller than nudeDistance,
                    // since tree trunks have small radiai, but we'll leave the checks in for now
                    var dist = Math.abs((this.pivot.position.y) - (tree.pivot.position.y + tree.trunkRadius));
                    if (dist < nudgeThreshold) { // only nudge the player if they're near the edge of the object
                        if (yv <= 0) { // ensure the player isn't walking the opposite direction
                            this.pivot.position.y -= this.maxVel * deltaTime;
                        }
                    }
                } else {
                    if (this.pivot.position.y > tree.pivot.position.y) {
                        var dist = Math.abs((this.pivot.position.y) - (tree.pivot.position.y - tree.trunkRadius));
                        if (dist < nudgeThreshold) { // only nudge the player if they're near the edge of the object
                            if (yv >= 0) {
                                this.pivot.position.y += this.maxVel * deltaTime;
                            }
                        }
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
        if (this.pivot.position.y - this.height < 0) { // TODO(AJ): This isn't quite perfect yet, but it'll work for now
            this.pivot.position.y = this.height;
        }
    }

    collideWithEntities(): void {
        for (var e in this.gameState.entityManager.entities) {
            var entity = this.gameState.entityManager.entities[e];
            var width = (<THREE.PlaneGeometry>entity.mesh.geometry).parameters.width;
            var height = (<THREE.PlaneGeometry>entity.mesh.geometry).parameters.height;
            if (this.pivot.position.x + this.width / 2 > entity.mesh.position.x - width / 2 &&
                this.pivot.position.x - this.width / 2 < entity.mesh.position.x + width / 2 &&
                this.pivot.position.y > entity.mesh.position.y &&
                this.pivot.position.y < entity.mesh.position.y + height) {


                // LATER(AJ): Add type field to entities to diferentiate them
                Sound.play(Sound.pickup);
                ++this.wood;
                get('woodInfoTab').innerHTML = "Wood: " + this.wood;

                this.gameState.entityManager.remove(entity);
            }
        }
    }

    /** Chops the nearest tree, and / or just plays the sound / animates the swing */
    swingAxe(deltaTime: number): void {
        if (this.choppingTime === 0) {
            this.animateAxeSwing();
            this.choppingTime = this.axe.swingTime;

            var closest = -1; // index of the closest tree
            var closestDist = 5; // How close a tree has to be to us to be in choppin range
            for (var t in this.level.trees) {
                var diff = new THREE.Vector3();
                diff.subVectors(this.level.trees[t].pivot.position, this.pivot.position);
                var dist = diff.length();
                if (dist < closestDist && this.level.trees[t].damage > 0) {
                    // NOTE(AJ): Ensure that the player is facing the correct direction
                    if ((this.pivot.position.x < this.level.trees[t].pivot.position.x && Direction.sameishDirection(this.facing, DIRECTION.EAST)) ||
                        (this.pivot.position.x > this.level.trees[t].pivot.position.x && Direction.sameishDirection(this.facing, DIRECTION.WEST)) ||
                        (this.pivot.position.y < this.level.trees[t].pivot.position.y && Direction.sameishDirection(this.facing, DIRECTION.NORTH)) ||
                        (this.pivot.position.y > this.level.trees[t].pivot.position.y && Direction.sameishDirection(this.facing, DIRECTION.SOUTH))) {
                            closestDist = dist;
                            closest = parseInt(t);
                    }
                }
            }
            if (closest != -1 && this.level.trees[closest].damage > 0) {
                var tree = this.level.trees[closest];
                setTimeout(function() { Sound.playRandom(Sound.chops); }, 100);
                tree.chop(this.axe);

                // TODO(AJ): Ensure that entities aren't generated outside the level's bounds

                if (tree.damage == 0) { // if we chopped the whole thing down
                    for (var i = 0; i < tree.height; ++i) {
                        var radius = (Math.random() * 3 + 1.5);
                        var angle = Math.random() * Math.PI * 2;
                        var x = tree.pivot.position.x + Math.cos(angle) * radius;
                        var y = tree.pivot.position.y + Math.sin(angle) * radius - 3; // -3 because of weird rotation of the tree planes
                        x = Math.max(-this.level.width + 2, Math.min(this.level.width - 2, x));
                        y = Math.max(3.5, Math.min(this.level.height - 2, y));
                        this.gameState.entityManager.add(new TreeSectionEntity(x, y, 1 + Math.random() * 2));
                    }

                    // TODO(AJ): Figure out how to change the size of tree planes once they have been
                    // chopped (probably requires the mesh to be removed and another one added)
                    // For now, just use a trunk texture that is the same size as the tree texture
                    // This does not work:
                    // (<THREE.Mesh>this.level.trees[closest].pivot.children[0]).geometry = new THREE.PlaneGeometry(2,2);

                    (<THREE.Mesh>this.level.trees[closest].pivot.children[0]).material = new THREE.MeshPhongMaterial({
                        map: THREE.ImageUtils.loadTexture("res/trunk.png"),
                        transparent: true
                    });

                }
            }
        }
    }

    animateAxeSwing(): void {
        this.toolMesh.rotateZ(-0.5);
        setTimeout(function(w) {w.rotateZ(-0.5)}, 50, this.toolMesh);
        setTimeout(function(w) {w.rotateZ(0.5)}, 100, this.toolMesh);
        setTimeout(function(w) {w.rotateZ(0.5)}, 250, this.toolMesh);
        // NOTE(AJ): Can we just take a mintue to appreciate what a beautiful thing
        // callbacks are? Like for real, shout out to setTimeout, you da real MVP
    }
}

class Level {

    trees: Tree[];
    width: number;
    height: number;
    mesh: THREE.Mesh;
    shop: Shop;

    constructor(width: number, height: number, scene: THREE.Scene) {
        this.width = width;
        this.height = height;

        var planeGeometry = new THREE.PlaneGeometry(width, height);
        Resource.grassTexture.repeat.set(width / 15, height / 15);
        var planeMaterial = new THREE.MeshPhongMaterial({
            map: Resource.grassTexture
        });
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.position = new THREE.Vector3(0, this.height / 2, 0);
        scene.add(this.mesh);

        this.trees = new Array<Tree>(650);
        for (var i = 0; i < this.trees.length; ++i) {
            var x, y;
            var width = 5;
            var height = 7 + Math.floor(Math.random() * 3);
            do {
                x = Math.random() * this.width - this.width / 2;
                y = Math.random() * (this.height-5) + 5;
                x = Math.max(-this.width/2 + 3.5, Math.min(this.width/2 - 3.5, x));
                y = Math.max(6, Math.min(this.height, y));
            } while (this.collides(x, y, 0.0, 0.0) != null);

            this.trees[i] = new Tree(x, y, width, height, scene);
        }

        this.shop = new Shop(scene);
    }

    collides(x: number, y: number, width: number, height: number): Tree {
        for (var t in this.trees) {
            var tree = this.trees[t];
            if (x - width / 2 > tree.pivot.position.x - tree.trunkRadius - tree.width/2 &&
                x + width / 2 < tree.pivot.position.x + tree.trunkRadius + tree.width/2 &&
                y > tree.pivot.position.y - tree.trunkRadius &&
                y < tree.pivot.position.y + tree.trunkRadius) {
                    return tree;
                }
        }
        return null;
    }

    static overlaps(pos: THREE.Vector2, trees: Tree[], width: number, height: number): boolean {
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
    damage: number; // how many hits it takes to knock down (when 0, tree is chopped down)
    width: number;
    height: number;
    trunkRadius: number;

    woodValue: number; // how many wood units this tree drops upon being cut down

    constructor(x: number, y: number, width: number, height: number, scene: THREE.Scene) {

        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(x, y, 0);
        this.pivot.rotateX(Math.PI / 6.0);

        this.width = width;
        this.height = height;
        this.trunkRadius = 1.0;
        this.woodValue = this.height;
        // NOTE(AJ): if we want both sides of the tree plane to render for some reason
        // we can set { side: THREE.DoubleSide } in the Material properties
        var planeGeometry = new THREE.PlaneGeometry(this.width, this.height);
        var planeMaterial = new THREE.MeshPhongMaterial(
            {
                map: Resource.treeTexture,
                transparent: true,
                shininess: 0.0
            }
        );
        var mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        mesh.position.z = 2.35; // TODO(AJ): Find out how to calculate this vaue, or even better - how
        // to not use it at all

        this.pivot.add(mesh);
        scene.add(this.pivot);

        this.damage = Math.floor(this.width / 2);
    }

    chop(axeType: Axe) {
        if (this.damage > 0) {
            this.damage -= axeType.damage;
        }
    }
}

class Shop {
    mesh: THREE.Mesh;
    width: number;
    height: number;

    constructor(scene: THREE.Scene) {
        this.width = 8;
        this.height = 6;

        var material = new THREE.MeshBasicMaterial( { map: Resource.shopTexture, transparent: false } );
        var geometry = new THREE.PlaneGeometry(this.width, this.height);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.x = -9;
        this.mesh.position.y = 14;
        this.mesh.position.z = 2; // TODO(AJ): find out how to place things at the right height
        this.mesh.rotateX(Math.PI / 6.0);
        scene.add(this.mesh);
    }
}

class Entity {
    mesh: THREE.Mesh;
    life: number;
    bobDistance: number;
    startingZ: number;

    constructor(x: number, y: number, startingZ: number, width: number, height: number,
        material: THREE.Material, life: number, bobDistance: number) {
        var geometry = new THREE.PlaneGeometry(width, height);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        this.startingZ = startingZ;
        this.mesh.position.z = this.startingZ;
        this.mesh.rotateX(Math.PI / 6.0);
        this.life = life;
        this.bobDistance = bobDistance;
    }

    update(deltaTime: number): void {
        this.mesh.position.z = this.startingZ + deltaTime * (Math.sin(this.life / 10.0) / 80.0 * this.bobDistance);
        --this.life;
    }
}

class TreeSectionEntity extends Entity {

    constructor(x: number, y: number, startingZ: number) {
        var material = new THREE.MeshBasicMaterial( { map: Resource.treeSectionTexture, transparent: true } );
        var life = 350 + Math.floor(Math.random() * 150);
        super(x, y, startingZ, 2, 2, material, life, Math.random() * 5 + 2);
    }
}

class EntityManager {
    entities: Entity[];
    scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.entities = new Array<Entity>(0);
    }

    add(entity: Entity) {
        this.scene.add(entity.mesh);
        this.entities.push(entity);
    }

    remove(entity: Entity) { // if you want to remove an entity before its life is up
        var index = this.entities.indexOf(entity);
        this.scene.remove(this.entities[index].mesh);
        this.entities.splice(index, 1);
    }

    update(deltaTime: number): void {
        for (var e in this.entities) {
            this.entities[e].update(deltaTime);
            if (this.entities[e].life <= 0) {
                this.scene.remove(this.entities[e].mesh);
                this.entities.splice(parseInt(e), 1);
            }
        }
    }
}

class SpriteAnimator {

    textureAnimators: TextureAnimator[]; // one texture animator for each animation
    // eg: walking, running, chopping
    currentAnimationIndex: number;
    material: THREE.MeshBasicMaterial; // a reference to the matrial the textures will be applied on
    // (Not future proof, as once we want more than one material to change, this will be to be an array, or
    // something like that anyway)

    constructor(textureAnimators: TextureAnimator[], material: THREE.MeshBasicMaterial, currentAnimationIndex = 0) {
        this.textureAnimators = textureAnimators;
        this.material = material;
        this.currentAnimationIndex = currentAnimationIndex;
    }

    update(deltaTime: number): void {
        this.textureAnimators[this.currentAnimationIndex].update(deltaTime);
    }

    switchAnimation(newAnimationIndex: number): void {
        //this.textureAnimators[newAnimationIndex].msElapsedThisFrame = this.textureAnimators[this.currentAnimationIndex].msElapsedThisFrame;
        this.currentAnimationIndex = newAnimationIndex;
        this.material.map = this.textureAnimators[this.currentAnimationIndex].texture;
    }

}

/* Slightly modified version of Lee Stemkoski's texture animator
   http://stemkoski.github.io/Three.js/Texture-Animation.html */
class TextureAnimator {

    texture: THREE.Texture;

    tileCountX: number; // number of tiles horizontally
    tileCountY: number; // number of tiles vertically

    /* numberOfTiles is usually equal to tileCountX * tileCountY, but not necessarily:
       if there at blank tiles at the bottom of the spritesheet. */
    numberOfTiles: number;

    msPerFrame: number;
    msElapsedThisFrame: number;
    currentTileIndex: number;

    constructor(texture: THREE.Texture, tileCountX: number, tileCountY: number,
        msPerFrame: number, numberOfTiles?: number) {
        // note: texture passed by reference, will be updated by the update function.
        this.texture = texture;

        this.tileCountX = tileCountX;
        this.tileCountY = tileCountY;
        if (numberOfTiles) {
            this.numberOfTiles = numberOfTiles;
        } else {
            this.numberOfTiles = tileCountX * tileCountY;
        }

        this.texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        this.texture.repeat.set( 1 / this.tileCountX, 1 / this.tileCountY );

        this.msPerFrame = msPerFrame;

        this.msElapsedThisFrame = 0;
        this.currentTileIndex = 0;
    }

    update(deltaTime: number): void {
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
    }
}

class Resource {

    static ALL_LOADED = false;

    static textureLoader: THREE.TextureLoader;

    static playerIdleTexture: THREE.Texture;
    static playerWalkingTexture: THREE.Texture;
    static playerRunningTexture: THREE.Texture;

    static playerUpwardsIdleTexture: THREE.Texture;
    static playerUpwardsWalkingTexture: THREE.Texture;
    static playerUpwardsRunningTexture: THREE.Texture;

    static playerDownwardsIdleTexture: THREE.Texture;
    static playerDownwardsWalkingTexture: THREE.Texture;
    static playerDownwardsRunningTexture: THREE.Texture;

    static shopTexture: THREE.Texture;

    static steelAxeTexture: THREE.Texture;
    static goldAxeTexture: THREE.Texture;

    static treeSectionTexture: THREE.Texture;

    static grassTexture: THREE.Texture;
    static trunkTexture: THREE.Texture;
    static treeTexture: THREE.Texture;
    // static deciduous_sapling: HTMLImageElement;
    // static coninferous_sapling: HTMLImageElement;

    static loadAll() {
        Resource.textureLoader = new THREE.TextureLoader();

        // TODO(AJ): Check if textureLoader is the preferred way of loading textures
        // Seems to work for now at least!

        // PLAYER LEFT/RIGHT
        Resource.textureLoader.load("res/player/player_idle.png", function(tex) {
            Resource.playerIdleTexture = tex;
        });

        Resource.textureLoader.load("res/player/player_walking.png", function(tex) {
            Resource.playerWalkingTexture = tex;
        });

        Resource.textureLoader.load("res/player/player_running.png", function(tex) {
            Resource.playerRunningTexture = tex;
        });

        // PLAYER UPWARDS
        Resource.textureLoader.load("res/player/player_upwards_idle.png", function(tex) {
            Resource.playerUpwardsIdleTexture = tex;
        });
        Resource.textureLoader.load("res/player/player_upwards_walking.png", function(tex) {
            Resource.playerUpwardsWalkingTexture = tex;
        });
        Resource.textureLoader.load("res/player/player_upwards_running.png", function(tex) {
            Resource.playerUpwardsRunningTexture = tex;
        });

        // PLAYER DOWNWARDS
        Resource.textureLoader.load("res/player/player_downwards_idle.png", function(tex) {
            Resource.playerDownwardsIdleTexture = tex;
        });
        Resource.textureLoader.load("res/player/player_downwards_walking.png", function(tex) {
            Resource.playerDownwardsWalkingTexture = tex;
        });
        Resource.textureLoader.load("res/player/player_downwards_running.png", function(tex) {
            Resource.playerDownwardsRunningTexture = tex;
        });

        // Shop
        Resource.textureLoader.load("res/shop.png", function(tex) {
            Resource.shopTexture = tex;
        });

        // Axes
        Resource.textureLoader.load("res/steel_axe.png", function(tex) {
            Resource.steelAxeTexture = tex;
        });

        Resource.textureLoader.load("res/gold_axe.png", function(tex) {
            Resource.goldAxeTexture = tex;
        });

        Resource.textureLoader.load("res/tree_section.png", function(tex) {
            Resource.treeSectionTexture = tex;
        });

        // Ground plane
        Resource.textureLoader.load("res/grass_diffuse.jpg", function(tex) {
            Resource.grassTexture = tex;
            Resource.grassTexture.wrapS = Resource.grassTexture.wrapT = THREE.RepeatWrapping;
        });

        Resource.textureLoader.load("res/tree.png", function(tex) {
            Resource.treeTexture = tex;
        });

        Resource.textureLoader.load("res/trunk.png", function(tex) {
            Resource.trunkTexture = tex;
        });

        Resource.ALL_LOADED = true;
    }
}

// class OBJLoader {
//     manager: THREE.LoadingManager;
//     path: String;
//
//     constructor() {
//         this.manager = THREE.DefaultLoadingManager;
//
//         this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
//
//         this.materials = null;
//     }
//
// 	load( url, onLoad, onProgress, onError ) {
//
// 		var scope = this;
//
// 		var loader = new THREE.XHRLoader( scope.manager );
// 		loader.setPath( this.path );
// 		loader.load( url, function ( text ) {
//
// 			onLoad( scope.parse( text ) );
//
// 		}, onProgress, onError );
//     }
//
// 	setPath( value ) {
//
// 		this.path = value;
//
// 	}
//
// 	setMaterials( materials ) {
//
// 		this.materials = materials;
//
// 	}
//
// 	parse( text ) {
//
// 		console.time( 'OBJLoader' );
//
// 		var objects = [];
// 		var object;
// 		var foundObjects = false;
// 		var vertices = [];
// 		var normals = [];
// 		var uvs = [];
//
// 		function addObject( name ) {
//
// 			var geometry = {
// 				vertices: [],
// 				normals: [],
// 				uvs: []
// 			};
//
// 			var material = {
// 				name: '',
// 				smooth: true
// 			};
//
// 			object = {
// 				name: name,
// 				geometry: geometry,
// 				material: material
// 			};
//
// 			objects.push( object );
//
// 		}
//
// 		function parseVertexIndex( value ) {
//
// 			var index = parseInt( value );
//
// 			return ( index >= 0 ? index - 1 : index + vertices.length / 3 ) * 3;
//
// 		}
//
// 		function parseNormalIndex( value ) {
//
// 			var index = parseInt( value );
//
// 			return ( index >= 0 ? index - 1 : index + normals.length / 3 ) * 3;
//
// 		}
//
// 		function parseUVIndex( value ) {
//
// 			var index = parseInt( value );
//
// 			return ( index >= 0 ? index - 1 : index + uvs.length / 2 ) * 2;
//
// 		}
//
// 		function addVertex( a, b, c ) {
//
// 			object.geometry.vertices.push(
// 				vertices[ a ], vertices[ a + 1 ], vertices[ a + 2 ],
// 				vertices[ b ], vertices[ b + 1 ], vertices[ b + 2 ],
// 				vertices[ c ], vertices[ c + 1 ], vertices[ c + 2 ]
// 			);
//
// 		}
//
// 		function addNormal( a, b, c ) {
//
// 			object.geometry.normals.push(
// 				normals[ a ], normals[ a + 1 ], normals[ a + 2 ],
// 				normals[ b ], normals[ b + 1 ], normals[ b + 2 ],
// 				normals[ c ], normals[ c + 1 ], normals[ c + 2 ]
// 			);
//
// 		}
//
// 		function addUV( a, b, c ) {
//
// 			object.geometry.uvs.push(
// 				uvs[ a ], uvs[ a + 1 ],
// 				uvs[ b ], uvs[ b + 1 ],
// 				uvs[ c ], uvs[ c + 1 ]
// 			);
//
// 		}
//
// 		function addFace( a, b, c, d,  ua, ub, uc, ud, na, nb, nc, nd ) {
//
// 			var ia = parseVertexIndex( a );
// 			var ib = parseVertexIndex( b );
// 			var ic = parseVertexIndex( c );
// 			var id;
//
// 			if ( d === undefined ) {
//
// 				addVertex( ia, ib, ic );
//
// 			} else {
//
// 				id = parseVertexIndex( d );
//
// 				addVertex( ia, ib, id );
// 				addVertex( ib, ic, id );
//
// 			}
//
// 			if ( ua !== undefined ) {
//
// 				ia = parseUVIndex( ua );
// 				ib = parseUVIndex( ub );
// 				ic = parseUVIndex( uc );
//
// 				if ( d === undefined ) {
//
// 					addUV( ia, ib, ic );
//
// 				} else {
//
// 					id = parseUVIndex( ud );
//
// 					addUV( ia, ib, id );
// 					addUV( ib, ic, id );
//
// 				}
//
// 			}
//
// 			if ( na !== undefined ) {
//
// 				ia = parseNormalIndex( na );
// 				ib = parseNormalIndex( nb );
// 				ic = parseNormalIndex( nc );
//
// 				if ( d === undefined ) {
//
// 					addNormal( ia, ib, ic );
//
// 				} else {
//
// 					id = parseNormalIndex( nd );
//
// 					addNormal( ia, ib, id );
// 					addNormal( ib, ic, id );
//
// 				}
//
// 			}
//
// 		}
//
// 		addObject( '' );
//
// 		// v float float float
// 		var vertex_pattern = /^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/;
//
// 		// vn float float float
// 		var normal_pattern = /^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/;
//
// 		// vt float float
// 		var uv_pattern = /^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/;
//
// 		// f vertex vertex vertex ...
// 		var face_pattern1 = /^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/;
//
// 		// f vertex/uv vertex/uv vertex/uv ...
// 		var face_pattern2 = /^f\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)))?/;
//
// 		// f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...
// 		var face_pattern3 = /^f\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))\s+((-?\d+)\/(-?\d+)\/(-?\d+))(?:\s+((-?\d+)\/(-?\d+)\/(-?\d+)))?/;
//
// 		// f vertex//normal vertex//normal vertex//normal ...
// 		var face_pattern4 = /^f\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))\s+((-?\d+)\/\/(-?\d+))(?:\s+((-?\d+)\/\/(-?\d+)))?/;
//
// 		var object_pattern = /^[og]\s+(.+)/;
//
// 		var smoothing_pattern = /^s\s+(\d+|on|off)/;
//
// 		//
//
// 		var lines = text.split( '\n' );
//
// 		for ( var i = 0; i < lines.length; i ++ ) {
//
// 			var line = lines[ i ];
// 			line = line.trim();
//
// 			var result;
//
// 			if ( line.length === 0 || line.charAt( 0 ) === '#' ) {
//
// 				continue;
//
// 			} else if ( ( result = vertex_pattern.exec( line ) ) !== null ) {
//
// 				// ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
//
// 				vertices.push(
// 					parseFloat( result[ 1 ] ),
// 					parseFloat( result[ 2 ] ),
// 					parseFloat( result[ 3 ] )
// 				);
//
// 			} else if ( ( result = normal_pattern.exec( line ) ) !== null ) {
//
// 				// ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
//
// 				normals.push(
// 					parseFloat( result[ 1 ] ),
// 					parseFloat( result[ 2 ] ),
// 					parseFloat( result[ 3 ] )
// 				);
//
// 			} else if ( ( result = uv_pattern.exec( line ) ) !== null ) {
//
// 				// ["vt 0.1 0.2", "0.1", "0.2"]
//
// 				uvs.push(
// 					parseFloat( result[ 1 ] ),
// 					parseFloat( result[ 2 ] )
// 				);
//
// 			} else if ( ( result = face_pattern1.exec( line ) ) !== null ) {
//
// 				// ["f 1 2 3", "1", "2", "3", undefined]
//
// 				addFace(
// 					result[ 1 ], result[ 2 ], result[ 3 ], result[ 4 ]
// 				);
//
// 			} else if ( ( result = face_pattern2.exec( line ) ) !== null ) {
//
// 				// ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3", undefined, undefined, undefined]
//
// 				addFace(
// 					result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
// 					result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
// 				);
//
// 			} else if ( ( result = face_pattern3.exec( line ) ) !== null ) {
//
// 				// ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3", undefined, undefined, undefined, undefined]
//
// 				addFace(
// 					result[ 2 ], result[ 6 ], result[ 10 ], result[ 14 ],
// 					result[ 3 ], result[ 7 ], result[ 11 ], result[ 15 ],
// 					result[ 4 ], result[ 8 ], result[ 12 ], result[ 16 ]
// 				);
//
// 			} else if ( ( result = face_pattern4.exec( line ) ) !== null ) {
//
// 				// ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]
//
// 				addFace(
// 					result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
// 					undefined, undefined, undefined, undefined,
// 					result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
// 				);
//
// 			} else if ( ( result = object_pattern.exec( line ) ) !== null ) {
//
// 				// o object_name
// 				// or
// 				// g group_name
//
// 				var name = result[ 1 ].trim();
//
// 				if ( foundObjects === false ) {
//
// 					foundObjects = true;
// 					object.name = name;
//
// 				} else {
//
// 					addObject( name );
//
// 				}
//
// 			} else if ( /^usemtl /.test( line ) ) {
//
// 				// material
//
// 				object.material.name = line.substring( 7 ).trim();
//
// 			} else if ( /^mtllib /.test( line ) ) {
//
// 				// mtl file
//
// 			} else if ( ( result = smoothing_pattern.exec( line ) ) !== null ) {
//
// 				// smooth shading
//
// 				object.material.smooth = result[ 1 ] === "1" || result[ 1 ] === "on";
//
// 			} else {
//
// 				throw new Error( "Unexpected line: " + line );
//
// 			}
//
// 		}
//
// 		var container = new THREE.Group();
//
// 		for ( var i = 0, l = objects.length; i < l; i ++ ) {
//
// 			object = objects[ i ];
// 			var geometry = object.geometry;
//
// 			var buffergeometry = new THREE.BufferGeometry();
//
// 			buffergeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( geometry.vertices ), 3 ) );
//
// 			if ( geometry.normals.length > 0 ) {
//
// 				buffergeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( geometry.normals ), 3 ) );
//
// 			} else {
//
// 				buffergeometry.computeVertexNormals();
//
// 			}
//
// 			if ( geometry.uvs.length > 0 ) {
//
// 				buffergeometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( geometry.uvs ), 2 ) );
//
// 			}
//
// 			var material;
//
// 			if ( this.materials !== null ) {
//
// 				material = this.materials.create( object.material.name );
//
// 			}
//
// 			if ( !material ) {
//
// 				material = new THREE.MeshPhongMaterial();
// 				material.name = object.material.name;
//
// 			}
//
// 			material.shading = object.material.smooth ? THREE.SmoothShading : THREE.FlatShading;
//
// 			var mesh = new THREE.Mesh( buffergeometry, material );
// 			mesh.name = object.name;
//
// 			container.add( mesh );
//
// 		}
//
// 		console.timeEnd( 'OBJLoader' );
//
// 		return container;
//
// 	}
//
// }

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

// TODO(AJ): Browserproof this
// TODO(AJ): Add controller support
class Keyboard {

    static KEYS = {
        BACKSPACE: 8, TAB: 9, RETURN: 13, SHIFT: 16, ESC: 27, SPACE: 32, PAGEUP: 33, PAGEDOWN: 34, END: 35, HOME: 36,
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, INSERT: 45, DELETE: 46, ZERO: 48, ONE: 49, TWO: 50, THREE: 51,
        FOUR: 52, FIVE: 53, SIX: 54, SEVEN: 55, EIGHT: 56, NINE: 57, A: 65, B: 66, C: 67, D: 68, E: 69, F: 70,
        G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85,
        V: 86, W: 87, X: 88, Y: 89, Z: 90, TILDE: 192
    };

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
                Keyboard.keysDown.splice(parseInt(i), 1);
                // don't break after the item has been found, in case it's in there more than once
            }
        }
    }
}

class Sound {

    static chop1: HTMLAudioElement;
    static chop2: HTMLAudioElement;
    static chop3: HTMLAudioElement;

    static chops: HTMLAudioElement[];

    // static hit2: HTMLAudioElement;
    // static hit3: HTMLAudioElement;
    // static hit4: HTMLAudioElement;

    // static hit: HTMLAudioElement[];

    static pickup: HTMLAudioElement;
    static powerup: HTMLAudioElement;

    static muted: boolean = false;
    static volume: number = 0.5;
    static volumeSlider: HTMLInputElement;

    static init() {
        // Sound.hit2 = <HTMLAudioElement>get('hit2');
        // Sound.hit3 = <HTMLAudioElement>get('hit3');
        // Sound.hit4 = <HTMLAudioElement>get('hit4');
        //
        // Sound.hit = new Array<HTMLAudioElement>();
        // Sound.hit.push(Sound.hit2);
        // Sound.hit.push(Sound.hit3);
        // Sound.hit.push(Sound.hit4);

        Sound.chop1 = <HTMLAudioElement>get('chop1');
        Sound.chop2 = <HTMLAudioElement>get('chop2');
        Sound.chop3 = <HTMLAudioElement>get('chop3');

        Sound.chops = new Array<HTMLAudioElement>();
        Sound.chops.push(Sound.chop1);
        Sound.chops.push(Sound.chop2);
        Sound.chops.push(Sound.chop3);

        Sound.pickup = <HTMLAudioElement>get('pickup');
        Sound.powerup = <HTMLAudioElement>get('powerup');

        Sound.volumeSlider = <HTMLInputElement>get('volumeSlider');
    }

    static changeVolume() {
        Sound.volume = Number(Sound.volumeSlider.value) / 100;
        Sound.play(Sound.pickup);
    }

    static toggleMute(): void {
        Sound.muted = !Sound.muted;
    }

    static play(sound: HTMLAudioElement): void {
        if (Sound.muted) return;
        sound.volume = Sound.volume;
        sound.currentTime = 0;
        sound.play();
    }

    static playRandom(sounds: HTMLAudioElement[]): void {
        var rand = Math.floor(Math.random() * sounds.length);
        Sound.play(sounds[rand]);
    }
}

class SaveGame {

    static SAVE_STRING = 'tm495save';

    /** Overwrites the current local storage item with the new information */
    static save(player: Player, level: Level): void {
        var data = '|';
        var serperator = data.charAt(0);

        data += Main.VERSION + serperator;

        // LEVEL
        data+= level.width + ',' + level.height + serperator;
        data += 'trees'
        for (var t in level.trees) {
            data += level.trees[t].pivot.position.x + ',' +
                      level.trees[t].pivot.position.y + ',' +
                      level.trees[t].width + ',' +
                      level.trees[t].height + ',' +
                      level.trees[t].damage + ';';
        }
        data += serperator;

        // PLAYER
        data += player.pivot.position.x + ',' + player.pivot.position.y + serperator;
        data += player.axe.type + serperator;


        if (typeof (Storage) === "undefined") {
            // TODO(AJ): What are those cool text box alerts called?
            alert("Sorry but your game can't be saved in this browser :(\nYou can copy the following string and load it in later if you want");
            alert(data);
        } else {
            data = encodeURI(data); // Just a little bit of encryption so it's hard for players to hack
            window.localStorage.setItem(SaveGame.SAVE_STRING, data);
        }
    }

    static load(scene: THREE.Scene): void {
        var saveString: string;
        if (typeof (Storage) === "undefined") {
            // TODO(AJ): What are those cool text box alerts called?
            alert("Sorry but your game can't be loaded in this browser :(\nIf you previously copied the save info you can paste it in the following window:");
            alert("here");
        } else {
            saveString = window.localStorage.getItem(SaveGame.SAVE_STRING);
            if (saveString === null) {
                console.error("Couldn't load any saves, none found");
                return;
            }
            saveString = decodeURI(saveString); // decryption
        }

        var data: Array<string> = saveString.split(saveString.charAt(0));
        var version = data[0];
        var level = new Level(Number(data[1]), Number(data[2]), scene);
        // var player = new Player();
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

function buttonClick(button: string, event: MouseEvent, callback: () => void) {
    if (get(button).className.indexOf('enabled') > -1 && clickType(event)===ClickType.LMB) {
        callback.call(this);
    }
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

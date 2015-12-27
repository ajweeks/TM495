
function get(what: string): HTMLElement {
    return document.getElementById(what);
}

// TODO(AJ): see if we can make Main not so static, that's probably a bad thing, right?
class Main {

    static VERSION = "0.017";

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

        this.level = new Level(45, 450, this.scene);
        this.player = new Player(this.level, this.scene, this);
        this.cameraAcceleration = new THREE.Vector2(0, 0.022);
        Main.renderer.camera.position.x = this.player.pivot.position.x;
        Main.renderer.camera.position.y = this.player.pivot.position.y - this.player.height;

        this.entityManager = new EntityManager(this.scene);
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

        // TODO(AJ): Don't allow the player to move off the screen

        var deltaY = playerY - Main.renderer.camera.position.y - 7;
        var speedY = (deltaY/3 * this.cameraAcceleration.y) * deltaTime;
        Main.renderer.camera.position.y += speedY;
        // Main.renderer.camera.position.y += Math.min((playerY - 5) - Main.renderer.camera.position.y, speedY);
    }

    render(): void {
        Main.renderer.render(this.scene);
    }
}

enum AXE {
    STEEL, GOLD
}

class Player {
    static MAX_V_WALK: number = 0.015;
    static MAX_V_RUN: number = 0.025;

    width: number;
    height: number;

    pivot: THREE.Object3D;
    animator: SpriteAnimator;
    //mesh: THREE.Mesh;
    maxVel: number;

    axe: AXE = AXE.STEEL;

    wood: number;
    choppingTime: number = -1; // how many ticks we have to wait to chop again! (or -1)

    level: Level;
    gameState: GameState;

    material: THREE.MeshBasicMaterial;
    weaponMaterial: THREE.MeshBasicMaterial;

    static IDLE_ANIM = 0;
    static WALK_ANIM = 1;
    static RUN_ANIM = 2;

    constructor(level: Level, scene: THREE.Scene, gameState: GameState) {
        this.level = level;
        this.gameState = gameState;
        this.width = 2.5;
        this.height = 5;

        this.wood = 0;
        get('woodInfoTab').innerHTML = "Wood: " + this.wood;

        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(0, this.height, 0);
        this.pivot.rotateX(Math.PI / 6.0);

    	var textureAnimators = new Array<TextureAnimator>();
        textureAnimators.push(new TextureAnimator(Resource.playerIdleTexture, 2, 1, 2, 480));
        textureAnimators.push(new TextureAnimator(Resource.playerWalkingTexture, 4, 1, 4, 160));
        textureAnimators.push(new TextureAnimator(Resource.playerRunningTexture, 4, 1, 4, 130));
        this.material = new THREE.MeshBasicMaterial( { map: textureAnimators[Player.IDLE_ANIM].texture, transparent: true } );
        this.animator = new SpriteAnimator(textureAnimators, this.material);

        var playerGeometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        var playerMesh = new THREE.Mesh(playerGeometry, this.material);
        playerMesh.position = new THREE.Vector3(0, 0, 2.5);

        this.weaponMaterial = new THREE.MeshBasicMaterial( { map: Resource.steelAxeTexture, transparent: true });
        var weaponGeometry = new THREE.PlaneGeometry(2.5, 2.5);
        var weaponMesh = new THREE.Mesh(weaponGeometry, this.weaponMaterial);
        weaponMesh.position = new THREE.Vector3(0.85, 0.0, 2.9);

        this.pivot.add(weaponMesh);
        this.pivot.add(playerMesh);
        scene.add(this.pivot);

        this.maxVel = Player.MAX_V_WALK;
    }

    update(deltaTime: number): void {
        this.animator.update(deltaTime);
        if (this.choppingTime >= 0) {
            --this.choppingTime;
        }

        if (Keyboard.keysDown.length > 0) {
            this.updatePosition(deltaTime);

            if (Keyboard.contains(Keyboard.KEYS.SPACE)) { // It's a choppin time!
                this.swingAxe(deltaTime);
            }

            if (Keyboard.contains(Keyboard.KEYS.B)) { // Build an axe
                if (this.wood >= 15 && this.axe == AXE.STEEL) {
                    this.axe = AXE.GOLD;
                    this.wood -= 15;

                    this.weaponMaterial.map = Resource.goldAxeTexture;
                    this.pivot.children[0].rotateZ(-0.65);
                    setTimeout(function(w) { w.rotateZ(-0.65); }, 0, this.pivot.children[0]);
                    setTimeout(function(w) { w.rotateZ(0.65); }, 200, this.pivot.children[0]);
                    setTimeout(function(w) { w.rotateZ(0.65); }, 400, this.pivot.children[0]);

                    Sound.play(Sound.powerup);
                }
            }
        } else {
            // TODO(AJ): Remove the following line, but keep its functionality
            this.animator.switchAnimation(Player.IDLE_ANIM);
        }
    }

    /** Reads in user input and affects player's position accordingly */
    updatePosition(deltaTime: number): void {
        if (Keyboard.contains(Keyboard.KEYS.SHIFT)) {
            this.maxVel = Player.MAX_V_RUN;
            this.animator.switchAnimation(Player.RUN_ANIM);
        } else {
            this.maxVel = Player.MAX_V_WALK;
            this.animator.switchAnimation(Player.WALK_ANIM);
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

        if (input === false) {
            this.animator.switchAnimation(0);
            return;
        }

        this.pivot.position.x += xv;
        this.pivot.position.y += yv;

        if (px == this.pivot.position.x && py == this.pivot.position.y) { // we didn't move, possibly walking against a wall or something
            this.animator.switchAnimation(0); // should be playing the idle animation
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

                this.gameState.entityManager.remove(entity);

                Sound.play(Sound.pickup);
                ++this.wood;
                get('woodInfoTab').innerHTML = "Wood: " + this.wood;
            }
        }
    }

    swingAxe(deltaTime: number): void {
        if (this.choppingTime === -1) {
            this.animateAxeSwing();
            this.choppingTime = 22;

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
            if (closest != -1 && this.level.trees[closest].damage > 0) {
                var tree = this.level.trees[closest];
                setTimeout(function() { Sound.playRandom(Sound.hit); }, 100);
                tree.chop();

                // TODO(AJ): Ensure that entities aren't generated outside the level's bounds

                if (tree.damage == 0) { // if we chopped the whole thing down
                    for (var i = 0; i < tree.height; ++i) {
                        this.gameState.entityManager.add(new TreeSectionEntity(
                            tree.pivot.position.x + (Math.random() * 6 - 3),
                            tree.pivot.position.y + (Math.random() * 6 - 3),
                            1 + Math.random() * 2));
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
        this.pivot.children[0].rotateZ(-0.5);
        setTimeout(function(w) {w.rotateZ(-0.5)}, 50, this.pivot.children[0]);
        setTimeout(function(w) {w.rotateZ(0.5)}, 100, this.pivot.children[0]);
        setTimeout(function(w) {w.rotateZ(0.5)}, 250, this.pivot.children[0]);
        // NOTE(AJ): Can we just take a mintue to appreciate what a beautiful thing
        // callbacks are? Like for real, shout out to setTimeout, you da real MVP
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
        Resource.grassTexture.repeat.set(width / 15, height / 15);
        var planeMaterial = new THREE.MeshPhongMaterial({
            map: Resource.grassTexture
        });
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.position = new THREE.Vector3(0, this.height / 2, 0);
        scene.add(this.mesh);

        this.trees = new Array<Tree>(180);
        for (var i = 0; i < this.trees.length; ++i) {
            var pos: THREE.Vector2;
            pos = new THREE.Vector2(Math.random() * width - width / 2, Math.random() * (height-5) + 5);

            this.trees[i] = new Tree(pos.x, pos.y, scene);
        }
    }

    collides(x: number, y: number, width: number, height: number): Tree {
        for (var t in this.trees) {
            var tree = this.trees[t];
            if (x - width / 2 > tree.pivot.position.x - tree.trunkRadius - tree.width / 2 &&
                x + width / 2 < tree.pivot.position.x + tree.trunkRadius + tree.width / 2 &&
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

    constructor(x: number, y: number, scene: THREE.Scene) {

        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(x, y, 0);
        this.pivot.rotateX(Math.PI / 6.0);

        this.width = 5;
        this.height = 7 + Math.floor(Math.random() * 3);
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

    chop() {
        if (this.damage > 0) {
            --this.damage;
        }
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
                this.entities.splice(e, 1);
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
        numberOfTiles: number, msPerFrame: number) {
        // note: texture passed by reference, will be updated by the update function.
        this.texture = texture;

        this.tileCountX = tileCountX;
        this.tileCountY = tileCountY;
        this.numberOfTiles = numberOfTiles;

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

    static textureLoader: THREE.TextureLoader;

    static playerIdleTexture: THREE.Texture;
    static playerWalkingTexture: THREE.Texture;
    static playerRunningTexture: THREE.Texture;

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
        Resource.textureLoader.load("res/player_idle.png", function(tex) {
            Resource.playerIdleTexture = tex;
        });

        Resource.textureLoader.load("res/player_walking.png", function(tex) {
            Resource.playerWalkingTexture = tex;
        });

        Resource.textureLoader.load("res/player_running.png", function(tex) {
            Resource.playerRunningTexture = tex;
        });


        // AXES
        Resource.textureLoader.load("res/steel_axe.png", function(tex) {
            Resource.steelAxeTexture = tex;
        });

        Resource.textureLoader.load("res/gold_axe.png", function(tex) {
            Resource.goldAxeTexture = tex;
        });

        Resource.textureLoader.load("res/tree_section.png", function(tex) {
            Resource.treeSectionTexture = tex;
        });

        // BACKGROUND
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

        console.log("All textures loaded!");
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

        Controller.onKeyDown(event.keyCode);

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

        Controller.onKeyDown(event.keyCode);

        for (var i in Keyboard.keysDown) {
            if (Keyboard.keysDown[i] === event.keyCode) {
                Keyboard.keysDown.splice(i, 1);
                // don't break after the item has been found, in case it's in there more than once
            }
        }
    }
}

enum INPUT {
    UP, DOWN, LEFT, RIGHT, JUMP
}

class KeyboardInput {
    down: boolean = false; // is down
    pressed: boolean = false; // is down and wasn't down last frame
    ticksDown: number = -1; // how long it has been down for

    keyCode: number; // which key code

    constructor(keyCode: number) {
        this.keyCode = keyCode;
    }

    // @overide Input
    onKeyDown(): void {
        if (this.down == false) { // was not down last frame
            this.pressed = true;
            this.ticksDown = 1;
        } else {
            this.pressed = false;
            this.ticksDown++;
        }
    }

    onKeyUp(): void {
        this.down = false;
        this.pressed = false;
        this.ticksDown = -1;
    }
}

/**
    Used to abstract away which keys map to which actions
        -> The Player class code deals with this interface,
        -> This interface deals with the Keyboard class
*/
class Controller {

    static inputs: KeyboardInput[];

    constructor() {
        Controller.inputs = new Array<KeyboardInput>();
        Controller.inputs.push(new KeyboardInput(Keyboard.KEYS.W));
    }

    static onKeyDown(keyCode: number): void {
        for (var i in Controller.inputs) {
            if (Controller.inputs[i].keyCode == keyCode) {
                Controller.inputs[i].onKeyDown();
            }
        }
    }

    static onKeyUp(keyCode: number): void {
        for (var i in Controller.inputs) {
            if (Controller.inputs[i].keyCode == keyCode) {
                Controller.inputs[i].onKeyUp();
            }
        }
    }

}

class Sound {

    static hit2: HTMLAudioElement;
    static hit3: HTMLAudioElement;
    static hit4: HTMLAudioElement;
    static pickup: HTMLAudioElement;
    static powerup: HTMLAudioElement;

    static hit: HTMLAudioElement[];

    static muted: boolean = false;
    static volume: number = 0.5;
    static volumeSlider: HTMLInputElement;

    static init() {
        Sound.hit2 = <HTMLAudioElement>get('hit2');
        Sound.hit3 = <HTMLAudioElement>get('hit3');
        Sound.hit4 = <HTMLAudioElement>get('hit4');

        Sound.hit = new Array<HTMLAudioElement>();
        Sound.hit.push(Sound.hit2);
        Sound.hit.push(Sound.hit3);
        Sound.hit.push(Sound.hit4);

        Sound.pickup = <HTMLAudioElement>get('pickup');
        Sound.powerup = <HTMLAudioElement>get('powerup');

        Sound.volumeSlider = <HTMLInputElement>get('volumeSlider');
    }

    static changeVolume() {
        Sound.volume = Number(Sound.volumeSlider.value) / 100;
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

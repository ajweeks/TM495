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
    Main.VERSION = "0.017";
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
        this.level = new Level(45, 450, this.scene);
        this.player = new Player(this.level, this.scene, this);
        this.cameraAcceleration = new THREE.Vector2(0, 0.022);
        Main.renderer.camera.position.x = this.player.pivot.position.x;
        Main.renderer.camera.position.y = this.player.pivot.position.y - this.player.height;
        this.entityManager = new EntityManager(this.scene);
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
        this.updateCamera(deltaTime);
        this.entityManager.update(deltaTime);
    };
    GameState.prototype.updateCamera = function (deltaTime) {
        var playerX = this.player.pivot.position.x;
        var playerY = this.player.pivot.position.y;
        var deltaY = playerY - Main.renderer.camera.position.y - 7;
        var speedY = (deltaY / 3 * this.cameraAcceleration.y) * deltaTime;
        Main.renderer.camera.position.y += speedY;
    };
    GameState.prototype.render = function () {
        Main.renderer.render(this.scene);
    };
    return GameState;
})(BasicState);
var AXE;
(function (AXE) {
    AXE[AXE["STEEL"] = 0] = "STEEL";
    AXE[AXE["GOLD"] = 1] = "GOLD";
})(AXE || (AXE = {}));
var Player = (function () {
    function Player(level, scene, gameState) {
        this.axe = AXE.STEEL;
        this.choppingTime = -1;
        this.level = level;
        this.gameState = gameState;
        this.width = 2.5;
        this.height = 5;
        this.wood = 0;
        get('woodInfoTab').innerHTML = "Wood: " + this.wood;
        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(0, this.height, 0);
        this.pivot.rotateX(Math.PI / 6.0);
        var textureAnimators = new Array();
        textureAnimators.push(new TextureAnimator(Resource.playerIdleTexture, 2, 1, 2, 480));
        textureAnimators.push(new TextureAnimator(Resource.playerWalkingTexture, 4, 1, 4, 160));
        textureAnimators.push(new TextureAnimator(Resource.playerRunningTexture, 4, 1, 4, 130));
        this.material = new THREE.MeshBasicMaterial({ map: textureAnimators[Player.IDLE_ANIM].texture, transparent: true });
        this.animator = new SpriteAnimator(textureAnimators, this.material);
        var playerGeometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        var playerMesh = new THREE.Mesh(playerGeometry, this.material);
        playerMesh.position = new THREE.Vector3(0, 0, 2.5);
        this.weaponMaterial = new THREE.MeshBasicMaterial({ map: Resource.steelAxeTexture, transparent: true });
        var weaponGeometry = new THREE.PlaneGeometry(2.5, 2.5);
        var weaponMesh = new THREE.Mesh(weaponGeometry, this.weaponMaterial);
        weaponMesh.position = new THREE.Vector3(0.85, 0.0, 2.9);
        this.pivot.add(weaponMesh);
        this.pivot.add(playerMesh);
        scene.add(this.pivot);
        this.maxVel = Player.MAX_V_WALK;
    }
    Player.prototype.update = function (deltaTime) {
        this.animator.update(deltaTime);
        if (this.choppingTime >= 0) {
            --this.choppingTime;
        }
        if (Keyboard.keysDown.length > 0) {
            this.updatePosition(deltaTime);
            if (Keyboard.contains(Keyboard.KEYS.SPACE)) {
                this.swingAxe(deltaTime);
            }
            if (Keyboard.contains(Keyboard.KEYS.B)) {
                if (this.wood >= 15 && this.axe == AXE.STEEL) {
                    this.axe = AXE.GOLD;
                    this.wood -= 15;
                    this.weaponMaterial.map = Resource.goldAxeTexture;
                    this.pivot.children[0].rotateZ(-0.65);
                    setTimeout(function (w) { w.rotateZ(-0.65); }, 0, this.pivot.children[0]);
                    setTimeout(function (w) { w.rotateZ(0.65); }, 200, this.pivot.children[0]);
                    setTimeout(function (w) { w.rotateZ(0.65); }, 400, this.pivot.children[0]);
                    Sound.play(Sound.powerup);
                }
            }
        }
        else {
            this.animator.switchAnimation(Player.IDLE_ANIM);
        }
    };
    Player.prototype.updatePosition = function (deltaTime) {
        if (Keyboard.contains(Keyboard.KEYS.SHIFT)) {
            this.maxVel = Player.MAX_V_RUN;
            this.animator.switchAnimation(Player.RUN_ANIM);
        }
        else {
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
        }
        else if (Keyboard.contains(Keyboard.KEYS.S) || Keyboard.contains(Keyboard.KEYS.DOWN)) {
            yv = -this.maxVel * deltaTime;
            input = true;
        }
        if (Keyboard.contains(Keyboard.KEYS.A) || Keyboard.contains(Keyboard.KEYS.LEFT)) {
            xv = -this.maxVel * deltaTime;
            input = true;
        }
        else if (Keyboard.contains(Keyboard.KEYS.D) || Keyboard.contains(Keyboard.KEYS.RIGHT)) {
            xv = this.maxVel * deltaTime;
            input = true;
        }
        if (input === false) {
            this.animator.switchAnimation(0);
            return;
        }
        this.pivot.position.x += xv;
        this.pivot.position.y += yv;
        if (px == this.pivot.position.x && py == this.pivot.position.y) {
            this.animator.switchAnimation(0);
        }
        this.collideWithEntities();
        var nudgeMultiplyer = this.maxVel * 2;
        var nudgeThreshold = 3;
        var tree = this.level.collides(this.pivot.position.x, this.pivot.position.y, this.width, this.height);
        if (tree !== null) {
            if (this.level.collides(this.pivot.position.x, py, this.width, this.height) === null) {
                if (this.pivot.position.x < tree.pivot.position.x) {
                    var dist = Math.abs((this.pivot.position.x + this.width / 2) - (tree.pivot.position.x - tree.width / 2));
                    if (dist < nudgeThreshold) {
                        if (xv <= 0) {
                            this.pivot.position.x -= this.maxVel * deltaTime;
                        }
                    }
                }
                else {
                    var dist = Math.abs((this.pivot.position.x - this.width / 2) - (tree.pivot.position.x + tree.width / 2));
                    if (dist < nudgeThreshold) {
                        if (xv >= 0) {
                            this.pivot.position.x += this.maxVel * deltaTime;
                        }
                    }
                }
                this.pivot.position.y = py;
            }
            else if (this.level.collides(px, this.pivot.position.y, this.width, this.height) === null) {
                if (this.pivot.position.y < tree.pivot.position.y) {
                    var dist = Math.abs((this.pivot.position.y) - (tree.pivot.position.y + tree.trunkRadius));
                    if (dist < nudgeThreshold) {
                        if (yv <= 0) {
                            this.pivot.position.y -= this.maxVel * deltaTime;
                        }
                    }
                }
                else {
                    if (this.pivot.position.y > tree.pivot.position.y) {
                        var dist = Math.abs((this.pivot.position.y) - (tree.pivot.position.y - tree.trunkRadius));
                        if (dist < nudgeThreshold) {
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
        if (this.pivot.position.y - this.height < 0) {
            this.pivot.position.y = this.height;
        }
    };
    Player.prototype.collideWithEntities = function () {
        for (var e in this.gameState.entityManager.entities) {
            var entity = this.gameState.entityManager.entities[e];
            var width = entity.mesh.geometry.parameters.width;
            var height = entity.mesh.geometry.parameters.height;
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
    };
    Player.prototype.swingAxe = function (deltaTime) {
        if (this.choppingTime === -1) {
            this.animateAxeSwing();
            this.choppingTime = 22;
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
            if (closest != -1 && this.level.trees[closest].damage > 0) {
                var tree = this.level.trees[closest];
                setTimeout(function () { Sound.playRandom(Sound.hit); }, 100);
                tree.chop();
                if (tree.damage == 0) {
                    for (var i = 0; i < tree.height; ++i) {
                        this.gameState.entityManager.add(new TreeSectionEntity(tree.pivot.position.x + (Math.random() * 6 - 3), tree.pivot.position.y + (Math.random() * 6 - 3), 1 + Math.random() * 2));
                    }
                    this.level.trees[closest].pivot.children[0].material = new THREE.MeshPhongMaterial({
                        map: THREE.ImageUtils.loadTexture("res/trunk.png"),
                        transparent: true
                    });
                }
            }
        }
    };
    Player.prototype.animateAxeSwing = function () {
        this.pivot.children[0].rotateZ(-0.5);
        setTimeout(function (w) { w.rotateZ(-0.5); }, 50, this.pivot.children[0]);
        setTimeout(function (w) { w.rotateZ(0.5); }, 100, this.pivot.children[0]);
        setTimeout(function (w) { w.rotateZ(0.5); }, 250, this.pivot.children[0]);
    };
    Player.MAX_V_WALK = 0.015;
    Player.MAX_V_RUN = 0.025;
    Player.IDLE_ANIM = 0;
    Player.WALK_ANIM = 1;
    Player.RUN_ANIM = 2;
    return Player;
})();
var Level = (function () {
    function Level(width, height, scene) {
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
        this.trees = new Array(180);
        for (var i = 0; i < this.trees.length; ++i) {
            var pos;
            pos = new THREE.Vector2(Math.random() * width - width / 2, Math.random() * (height - 5) + 5);
            this.trees[i] = new Tree(pos.x, pos.y, scene);
        }
    }
    Level.prototype.collides = function (x, y, width, height) {
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
    function Tree(x, y, scene) {
        this.pivot = new THREE.Object3D();
        this.pivot.position = new THREE.Vector3(x, y, 0);
        this.pivot.rotateX(Math.PI / 6.0);
        this.width = 5;
        this.height = 7 + Math.floor(Math.random() * 3);
        this.trunkRadius = 1.0;
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
        this.damage = Math.floor(this.width / 2);
    }
    Tree.prototype.chop = function () {
        if (this.damage > 0) {
            --this.damage;
        }
    };
    return Tree;
})();
var Entity = (function () {
    function Entity(x, y, startingZ, width, height, material, life, bobDistance) {
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
    Entity.prototype.update = function (deltaTime) {
        this.mesh.position.z = this.startingZ + deltaTime * (Math.sin(this.life / 10.0) / 80.0 * this.bobDistance);
        --this.life;
    };
    return Entity;
})();
var TreeSectionEntity = (function (_super) {
    __extends(TreeSectionEntity, _super);
    function TreeSectionEntity(x, y, startingZ) {
        var material = new THREE.MeshBasicMaterial({ map: Resource.treeSectionTexture, transparent: true });
        var life = 350 + Math.floor(Math.random() * 150);
        _super.call(this, x, y, startingZ, 2, 2, material, life, Math.random() * 5 + 2);
    }
    return TreeSectionEntity;
})(Entity);
var EntityManager = (function () {
    function EntityManager(scene) {
        this.scene = scene;
        this.entities = new Array(0);
    }
    EntityManager.prototype.add = function (entity) {
        this.scene.add(entity.mesh);
        this.entities.push(entity);
    };
    EntityManager.prototype.remove = function (entity) {
        var index = this.entities.indexOf(entity);
        this.scene.remove(this.entities[index].mesh);
        this.entities.splice(index, 1);
    };
    EntityManager.prototype.update = function (deltaTime) {
        for (var e in this.entities) {
            this.entities[e].update(deltaTime);
            if (this.entities[e].life <= 0) {
                this.scene.remove(this.entities[e].mesh);
                this.entities.splice(e, 1);
            }
        }
    };
    return EntityManager;
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
        Resource.textureLoader.load("res/player_idle.png", function (tex) {
            Resource.playerIdleTexture = tex;
        });
        Resource.textureLoader.load("res/player_walking.png", function (tex) {
            Resource.playerWalkingTexture = tex;
        });
        Resource.textureLoader.load("res/player_running.png", function (tex) {
            Resource.playerRunningTexture = tex;
        });
        Resource.textureLoader.load("res/steel_axe.png", function (tex) {
            Resource.steelAxeTexture = tex;
        });
        Resource.textureLoader.load("res/gold_axe.png", function (tex) {
            Resource.goldAxeTexture = tex;
        });
        Resource.textureLoader.load("res/tree_section.png", function (tex) {
            Resource.treeSectionTexture = tex;
        });
        Resource.textureLoader.load("res/grass_diffuse.jpg", function (tex) {
            Resource.grassTexture = tex;
            Resource.grassTexture.wrapS = Resource.grassTexture.wrapT = THREE.RepeatWrapping;
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
        Sound.hit = new Array();
        Sound.hit.push(Sound.hit2);
        Sound.hit.push(Sound.hit3);
        Sound.hit.push(Sound.hit4);
        Sound.pickup = get('pickup');
        Sound.powerup = get('powerup');
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
    Sound.playRandom = function (sounds) {
        var rand = Math.floor(Math.random() * sounds.length);
        Sound.play(sounds[rand]);
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

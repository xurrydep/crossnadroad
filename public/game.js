"use strict";

let scene, camera, renderer, orbitControl, stats;
let clock = new THREE.Clock(), deltaTime;

const cellWidth = 2, columns = 21;
let laneTypes = ['car', 'car', 'car', 'forest', 'forest', 'forest', 'truck', 'truck', 'river', 'river', 'rail'], laneSpeeds, logSpeeds;
let cameraOffsetX, cameraOffsetZ;

let chicken;
let lanes;
let gameSounds, themeSong;
let gameOver;

const firstRun = () =>{
    document.getElementById("instructions").innerText = ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? "Swipe in the direction you wanna move." : "Use the arrow keys to move around.") + "\nCross as many roads as possible";
    stats = new Stats();
    stats.showPanel(0);
    //document.body.appendChild(stats.dom);

    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 15, 18);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraOffsetX = camera.position.x;
    cameraOffsetZ = camera.position.z;

    
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor(0x69ceec, 1);
    document.body.appendChild(renderer.domElement);

    // orbitControl = new THREE.OrbitControls(camera, renderer.domElement); //helper to rotate around in scene
    // orbitControl.addEventListener('change', render);
    // orbitControl.enableZoom = true;

    update();
    gameSounds = new Sound(camera);
    
}

// Make functions available globally
window.firstRun = firstRun;
window.init = init;

const init = () =>{
    document.getElementById("score").innerText = "SCORE:0";
    document.getElementById("restart").style.visibility = "hidden";
    if(document.getElementById('splash'))
        document.body.removeChild(document.getElementById('splash'));
    
    scene = new THREE.Scene();

    gameOver = false;
    laneSpeeds = [3, 4, 5];
    logSpeeds = [2, 2.5, 3];

    camera.position.set(5, 15, 18);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    cameraOffsetX = camera.position.x;
    cameraOffsetZ = camera.position.z;

    //scene.add(new THREE.AxesHelper(10)); //show axes
    addLight();
    chicken = new Chicken();
    scene.add(chicken.model);
    lanes = [-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9].map(index => {
        const lane = new Lane(index);
        lane.mesh.position.z = -index * cellWidth;
        scene.add(lane.mesh);
        return lane;
    }).filter(lane => lane.index >= 0);

    gameSounds.themeSong.setVolume(0.25);
}

//lights up the scene
const addLight = () =>{
    let light = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(light);

    let hemisphere = new THREE.HemisphereLight(0xffffff, 0x000000, 0.4);
    scene.add(hemisphere);

    let sunlight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunlight.position.set(0, 100, 0);
    sunlight.castShadow = true;
    sunlight.shadow.camera.near = 50;
    sunlight.shadow.camera.far = 120;
    sunlight.shadow.camera.top = 200 * cellWidth;
    sunlight.shadow.camera.bottom = -columns/2 * cellWidth;
    sunlight.shadow.camera.left = -columns/2 * cellWidth;
    sunlight.shadow.camera.right = columns/2 * cellWidth;
    //scene.add(new THREE.DirectionalLightHelper(sunlight));
    //scene.add(new THREE.CameraHelper(sunlight.shadow.camera));    //enable to show shadow properties in scene
    scene.add(sunlight);
}

//creates chicken
class Chicken{
    constructor(size = {x: 0.63, y: 0.6, z: 0.63}){
        this.size = size;
        this.position = {x: 0, y: 0, z: 0};
        this.model = this.createModel();
        this.model.position.set(this.position.x, this.position.y, this.position.z);
    }

    createModel(){
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        const bodyMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.size.y / 2;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(this.size.x * 0.8, this.size.y * 0.8, this.size.z * 0.8);
        const headMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = this.size.y + this.size.y * 0.4;
        group.add(head);
        
        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
        const beakMaterial = new THREE.MeshLambertMaterial({color: 0xffa500});
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(0, this.size.y + this.size.y * 0.4, this.size.z * 0.5);
        beak.rotation.x = Math.PI / 2;
        group.add(beak);
        
        return group;
    }

    move(direction){
        if(gameOver) return;
        
        const previousPosition = {...this.position};
        
        switch(direction){
            case 'forward':
                this.position.z += cellWidth;
                break;
            case 'backward':
                this.position.z -= cellWidth;
                break;
            case 'left':
                this.position.x -= cellWidth;
                break;
            case 'right':
                this.position.x += cellWidth;
                break;
        }
        
        // Boundary checks
        if(this.position.x < -columns/2 * cellWidth || this.position.x > columns/2 * cellWidth){
            this.position.x = previousPosition.x;
            return;
        }
        
        this.model.position.set(this.position.x, this.position.y, this.position.z);
        
        // Update camera
        camera.position.x = this.position.x + cameraOffsetX;
        camera.position.z = this.position.z + cameraOffsetZ;
        camera.lookAt(new THREE.Vector3(this.position.x, 0, this.position.z));
        
        // Update score
        if(direction === 'forward'){
            updateScore();
        }
        
        // Check collisions
        checkCollisions();
    }
}

// Lane class
class Lane{
    constructor(index){
        this.index = index;
        this.type = this.getType();
        this.mesh = this.createMesh();
        this.vehicles = [];
        this.logs = [];
        
        if(this.type === 'car' || this.type === 'truck'){
            this.generateVehicles();
        } else if(this.type === 'river'){
            this.generateLogs();
        }
    }
    
    getType(){
        if(this.index === 0) return 'grass';
        if(this.index < 0) return 'grass';
        
        const typeIndex = (this.index - 1) % laneTypes.length;
        return laneTypes[typeIndex];
    }
    
    createMesh(){
        const geometry = new THREE.PlaneGeometry(columns * cellWidth, cellWidth);
        let material;
        
        switch(this.type){
            case 'grass':
                material = new THREE.MeshLambertMaterial({color: 0x90EE90});
                break;
            case 'forest':
                material = new THREE.MeshLambertMaterial({color: 0x228B22});
                break;
            case 'car':
            case 'truck':
                material = new THREE.MeshLambertMaterial({color: 0x696969});
                break;
            case 'river':
                material = new THREE.MeshLambertMaterial({color: 0x4169E1});
                break;
            case 'rail':
                material = new THREE.MeshLambertMaterial({color: 0x8B4513});
                break;
            default:
                material = new THREE.MeshLambertMaterial({color: 0x90EE90});
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        return mesh;
    }
    
    generateVehicles(){
        const vehicleCount = Math.floor(Math.random() * 3) + 1;
        const speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        for(let i = 0; i < vehicleCount; i++){
            const vehicle = new Vehicle(this.type, speed * direction);
            vehicle.mesh.position.set(
                (Math.random() - 0.5) * columns * cellWidth,
                0.5,
                this.mesh.position.z
            );
            this.vehicles.push(vehicle);
            scene.add(vehicle.mesh);
        }
    }
    
    generateLogs(){
        const logCount = Math.floor(Math.random() * 2) + 1;
        const speed = logSpeeds[Math.floor(Math.random() * logSpeeds.length)];
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        for(let i = 0; i < logCount; i++){
            const log = new Log(speed * direction);
            log.mesh.position.set(
                (Math.random() - 0.5) * columns * cellWidth,
                0.2,
                this.mesh.position.z
            );
            this.logs.push(log);
            scene.add(log.mesh);
        }
    }
    
    update(){
        this.vehicles.forEach(vehicle => vehicle.update());
        this.logs.forEach(log => log.update());
    }
}

// Vehicle class
class Vehicle{
    constructor(type, speed){
        this.type = type;
        this.speed = speed;
        this.mesh = this.createMesh();
    }
    
    createMesh(){
        const group = new THREE.Group();
        
        let bodyGeometry, bodyMaterial;
        
        if(this.type === 'car'){
            bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.8);
            bodyMaterial = new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff});
        } else {
            bodyGeometry = new THREE.BoxGeometry(2.5, 1.2, 1.2);
            bodyMaterial = new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff});
        }
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        
        return group;
    }
    
    update(){
        this.mesh.position.x += this.speed * deltaTime;
        
        // Reset position if out of bounds
        if(Math.abs(this.mesh.position.x) > columns * cellWidth){
            this.mesh.position.x = -Math.sign(this.speed) * columns * cellWidth;
        }
    }
}

// Log class
class Log{
    constructor(speed){
        this.speed = speed;
        this.mesh = this.createMesh();
    }
    
    createMesh(){
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const material = new THREE.MeshLambertMaterial({color: 0x8B4513});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = Math.PI / 2;
        return mesh;
    }
    
    update(){
        this.mesh.position.x += this.speed * deltaTime;
        
        // Reset position if out of bounds
        if(Math.abs(this.mesh.position.x) > columns * cellWidth){
            this.mesh.position.x = -Math.sign(this.speed) * columns * cellWidth;
        }
    }
}

// Sound class
class Sound{
    constructor(camera){
        this.camera = camera;
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        
        this.themeSong = new THREE.Audio(this.listener);
        this.loadAudio();
    }
    
    loadAudio(){
        const audioLoader = new THREE.AudioLoader();
        
        // Load theme song
        audioLoader.load('/assets/audio/katamari.mp3', (buffer) => {
            this.themeSong.setBuffer(buffer);
            this.themeSong.setLoop(true);
            this.themeSong.setVolume(0.25);
        });
    }
    
    playTheme(){
        if(this.themeSong.isPlaying) return;
        this.themeSong.play();
    }
    
    stopTheme(){
        if(!this.themeSong.isPlaying) return;
        this.themeSong.stop();
    }
}

// Game functions
function updateScore(){
    const currentScore = parseInt(document.getElementById("score").innerText.split(":")[1]) + 10;
    document.getElementById("score").innerText = `SCORE:${currentScore}`;
}

function checkCollisions(){
    if(gameOver) return;
    
    const chickenPosition = chicken.position;
    
    // Check vehicle collisions
    lanes.forEach(lane => {
        if(Math.abs(lane.mesh.position.z - chickenPosition.z) < cellWidth / 2){
            lane.vehicles.forEach(vehicle => {
                const distance = Math.abs(vehicle.mesh.position.x - chickenPosition.x);
                if(distance < 1){
                    gameOver = true;
                    showGameOver();
                }
            });
        }
    });
}

function showGameOver(){
    document.getElementById("restart").style.visibility = "visible";
    if(typeof swal !== 'undefined'){
        swal("Game Over!", "You got hit by a vehicle!", "error");
    }
}

// Input handling
function handleKeyPress(event){
    if(gameOver) return;
    
    switch(event.code){
        case 'ArrowUp':
        case 'KeyW':
            chicken.move('forward');
            break;
        case 'ArrowDown':
        case 'KeyS':
            chicken.move('backward');
            break;
        case 'ArrowLeft':
        case 'KeyA':
            chicken.move('left');
            break;
        case 'ArrowRight':
        case 'KeyD':
            chicken.move('right');
            break;
    }
}

// Touch handling for mobile
let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(event){
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event){
    if(gameOver) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 50;
    
    if(Math.abs(deltaX) > Math.abs(deltaY)){
        if(Math.abs(deltaX) > minSwipeDistance){
            if(deltaX > 0){
                chicken.move('right');
            } else {
                chicken.move('left');
            }
        }
    } else {
        if(Math.abs(deltaY) > minSwipeDistance){
            if(deltaY > 0){
                chicken.move('backward');
            } else {
                chicken.move('forward');
            }
        }
    }
}

// Event listeners
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchend', handleTouchEnd);

// Game loop
function update(){
    requestAnimationFrame(update);
    
    deltaTime = clock.getDelta();
    
    if(stats) stats.update();
    
    if(lanes){
        lanes.forEach(lane => lane.update());
    }
    
    if(renderer && scene && camera){
        renderer.render(scene, camera);
    }
}

// Window resize handling
function onWindowResize(){
    if(camera && renderer){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('resize', onWindowResize);
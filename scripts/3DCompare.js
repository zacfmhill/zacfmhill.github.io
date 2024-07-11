import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var fileUnits = "";
const renderer = new THREE.WebGLRenderer();
const stlLoader = new STLLoader();
const objLoader = new OBJLoader();
const progressBar = document.getElementById("fileUpProgress");
const referenceBar = document.getElementById("fileSelectProgress")
const volumeModalText = document.getElementById("volumeDisplayText");
const comparisonSelect = document.getElementById("comparisonFileSelect");
const unitSelect = document.getElementById("fileUnitSelect");
const userImportMaterial = new THREE.MeshNormalMaterial();
const referenceFileMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true });

var volumeModal = new bootstrap.Modal(document.getElementById('volumeCheckModal'));
var volumeCalculated = 0;
var comparisonVolume = 0;
renderer.setSize(window.innerWidth, window.innerHeight);
var domElem = renderer.domElement;
domElem.className = "ThreeJSCANVAS";
document.body.appendChild(domElem);

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// 
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );
//scene.fog = new THREE.Fog( 0x3f7b9d, 0, 100 );
const light = new THREE.AmbientLight(0x000000, 10); // soft white light
scene.add(light);
camera.position.z = 5;
var controls = new OrbitControls(camera, renderer.domElement);

document.getElementById("fileUPCONFIRM").onclick = fileUP;
document.getElementById("RESETbtn").onclick = resetScene;
function animate() {
    renderer.render(scene, camera);
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
}

// Checking for WebGL support
if (WebGL.isWebGLAvailable()) {
    // Initiate function or other initializations here
    renderer.setAnimationLoop(animate);
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}


function fileUP() {
    var file = document.getElementById("fileUP").files[0];
    console.log(document.getElementById("fileUP").files[0]);
    if (file) {
        console.log(comparisonSelect.value);
        if (comparisonSelect.value.includes("chall")) {
            for (var i = scene.children.length - 1; i >= 0; i--) {
                let obj = scene.children[i];
                scene.remove(obj);
            }
            progressBar.classList.add("bg-success");
            progressBar.classList.remove("bg-danger");
            referenceBar.classList.add("bg-success");
            referenceBar.classList.remove("bg-danger");
            if (file.name.endsWith("obj")) {
                objLoader.load(
                    URL.createObjectURL(file),
                    function (object) {   // called when resource is loaded
                        volumeCalculated = processOBJChildren(object, userImportMaterial);
                        volumeCalculated = math.unit(volumeCalculated, 'm').toNumber(unitSelect.value);
                        console.log("Upload volume is " + volumeCalculated);
                    },
                    loadingBar,
                    loadingError
                );
            } else if (file.name.endsWith("stl")) {
                stlLoader.load(
                    URL.createObjectURL(file),
                    function (object) {            // called when resource is loaded
                        var mesh = new THREE.Mesh(object, userImportMaterial);
                        // mesh.rotation.set(-Math.PI / 2, 0, 0);
                        scene.add(mesh);
                        //Calculating Volume for validation:
                        volumeCalculated = getVolume(object);
                        volumeCalculated = math.unit(volumeCalculated, 'm').toNumber(unitSelect.value);
                        console.log("Upload volume is " + volumeCalculated);

                    },
                    loadingBar,
                    loadingError
                );
            } else {
                progressBar.classList.remove("bg-success");
                progressBar.classList.add("bg-danger");
                progressBar.ariaValueNow = 100;
                progressBar.style = "width: 100%";
                alert("Error Reading file... Not STL or OBJ");
                return;
            }
            comparisonVolume = compareModels();
        }
        else {
            alert("No Comparison Selected!");
        }
    } else {
        alert("No File Selected!");
    }
}

function loadingBar(xhr) {
    progressBar.ariaValueNow = (xhr.loaded / xhr.total * 100);
    progressBar.style = "width: " + (xhr.loaded / xhr.total * 100) + "%";
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}

function loadingError(error) {
    progressBar.classList.remove("bg-success");
    progressBar.classList.add("bg-danger");
    console.log('An error happened');
    console.log(error);
}

function getVolume(geometry) {
    if (!geometry.isBufferGeometry) {
        console.log("'geometry' must be an indexed or non-indexed buffer geometry");
        return 0;
    }
    var isIndexed = geometry.index !== null;
    let position = geometry.attributes.position;
    let sum = 0;
    let p1 = new THREE.Vector3(),
        p2 = new THREE.Vector3(),
        p3 = new THREE.Vector3();
    if (!isIndexed) {
        let faces = position.count / 3;
        for (let i = 0; i < faces; i++) {
            p1.fromBufferAttribute(position, i * 3 + 0);
            p2.fromBufferAttribute(position, i * 3 + 1);
            p3.fromBufferAttribute(position, i * 3 + 2);
            sum += signedVolumeOfTriangle(p1, p2, p3);
        }
    }
    else {
        let index = geometry.index;
        let faces = index.count / 3;
        for (let i = 0; i < faces; i++) {
            p1.fromBufferAttribute(position, index.array[i * 3 + 0]);
            p2.fromBufferAttribute(position, index.array[i * 3 + 1]);
            p3.fromBufferAttribute(position, index.array[i * 3 + 2]);
            sum += signedVolumeOfTriangle(p1, p2, p3);
        }
    }
    return sum;
}
function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
}

function processOBJChildren(object, material) {
    var sumVolume = 0;
    for (var i = 0; i < object.children.length; i++) {
        let child = object.children[i];
        scene.add(new THREE.Mesh(child.geometry, material));
        sumVolume += getVolume(child.geometry);
    }
    return sumVolume;
}

function compareModels() {
    var compVol = 0;
    objLoader.load(
        "/public/" + comparisonSelect.value,
        function (object) {   // called when resource is loaded
            compVol = processOBJChildren(object, referenceFileMaterial);
            compVol = math.unit(compVol, 'm').toNumber(unitSelect.value);
            console.log("Reference volume is " + compVol);
            volumeModalText.innerHTML = "Upload volume is " + volumeCalculated + "\nReference volume is " + compVol;
            volumeModal.show();
        },
        function (xhr) {
            referenceBar.ariaValueNow = (xhr.loaded / xhr.total * 100);
            referenceBar.style = "width: " + (xhr.loaded / xhr.total * 100) + "%";
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        loadingError
    );
    return compVol;
}

function resetScene() {
    convertUnits();
    for (var i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        scene.remove(obj);

    }

}

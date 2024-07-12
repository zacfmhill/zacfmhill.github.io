import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const ROUNDTO = 2;

// Three.js renderers and scenes.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
// File loaders
const stlLoader = new STLLoader();
const objLoader = new OBJLoader();
// Progress Bars and Buttons
const progressBar = document.getElementById("fileUpProgress");
const referenceBar = document.getElementById("fileSelectProgress")
const comparisonSelect = document.getElementById("comparisonFileSelect");
const unitSelect = document.getElementById("fileUnitSelect");
//Materials used for User and Reference objects
const userImportMaterial = new THREE.MeshNormalMaterial();
const referenceFileMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, wireframe: true });
// Modal used for displaying volume info
const volumeModal = new bootstrap.Modal(document.getElementById('volumeCheckModal'));
const volumeModalText = document.getElementById("volumeDisplayText");
// User and Reference file calculated volumes
var userVolume = 0;
var comparisonVolume = 0;

//! ************************ Initialization ************************
// Sets the renderer size. 
renderer.setSize(window.innerWidth, window.innerHeight);
// Creates and inserts the dom element of the canvas.
let domElem = renderer.domElement;
domElem.className = "ThreeJSCANVAS";
document.body.appendChild(domElem);

// Setup the camera
camera.position.z = 5;
var controls = new OrbitControls(camera, renderer.domElement);

// Setting onclick events for the buttons
document.getElementById("fileUPCONFIRM").onclick = fileUP;
document.getElementById("RESETbtn").onclick = resetScene;
//! ***************************************************************

// Animation loop
function animate() {
    renderer.render(scene, camera);
}

// Checking for WebGL support
if (WebGL.isWebGLAvailable()) {
    renderer.setAnimationLoop(animate);
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById('container').appendChild(warning);
}

//* Called when file upload button is pressed.
function fileUP() {
    var file = document.getElementById("fileUP").files[0];
    if (file) {
        if (comparisonSelect.value.includes("chall")) {
            // Remove anything currently in the scene
            for (var i = scene.children.length - 1; i >= 0; i--) {
                let obj = scene.children[i];
                scene.remove(obj);
            }
            // Update progress bars
            resetProgressBars();
            if (file.name.endsWith("obj")) { //If the files is an OBJ
                objLoader.load(
                    URL.createObjectURL(file),
                    function (object) {   // called when resource is loaded
                        userVolume = processOBJChildren(object, userImportMaterial);
                        userVolume = math.round(math.unit(userVolume, 'm^3').toNumber('mm^3'), ROUNDTO);
                        console.log(`Upload volume is ${userVolume} mm^3`);
                    },
                    loadingBar,
                    loadingError
                );
            } else if (file.name.endsWith("stl")) { //If the files is a STL
                stlLoader.load(
                    URL.createObjectURL(file),
                    function (object) {            //Called when resource is loaded
                        var mesh = new THREE.Mesh(object, userImportMaterial);
                        //Scales the mesh to the correct size relative to the reference object.
                        mesh.scale.setScalar(math.unit(1, unitSelect.value).toNumber('mm'));
                        scene.add(mesh);
                        //Calculating volume for validation and converting it to correct units:
                        userVolume = getVolume(object);
                        userVolume = math.round(math.unit(userVolume, `${unitSelect.value}^3`).toNumber('mm^3'), ROUNDTO);
                        console.log(`Upload volume is ${userVolume} mm^3`);

                    },
                    loadingBar,
                    loadingError
                );
            } else {
                // Error reading files
                progressBar.classList.remove("bg-success");
                progressBar.classList.add("bg-danger");
                progressBar.ariaValueNow = 100;
                progressBar.style = "width: 100%";
                alert("Error Reading file... Not STL or OBJ");
                return;
            }
            //Call to compare the volume with the reference selected: 
            compareModels();
        }
        else {
            alert("No Comparison Selected!");
        }
    } else {
        alert("No File Selected!");
    }
}

//* Resets the progress bars for file reference and file upload.
function resetProgressBars() {
    progressBar.classList.add("bg-success");
    progressBar.classList.remove("bg-danger");
    referenceBar.classList.add("bg-success");
    referenceBar.classList.remove("bg-danger");
}

//* Updates the progress bars with % file loaded.
function loadingBar(xhr) {
    progressBar.ariaValueNow = (xhr.loaded / xhr.total * 100);
    progressBar.style = "width: " + (xhr.loaded / xhr.total * 100) + "%";
    console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
}

//* Error on loading, update progress bars. 
function loadingError(error) {
    progressBar.classList.remove("bg-success");
    progressBar.classList.add("bg-danger");
    console.log('An error happened');
    console.log(error);
}

//* Calculates the volume of a geometry mesh.
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

//* Returns the signed volume of the given triangle, for use in calculating volume. 
function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
}

//* Processes an OBJ by importing each child and calculating the total volume. 
function processOBJChildren(object, material) {
    var sumVolume = 0;
    for (var i = 0; i < object.children.length; i++) {
        let child = object.children[i];
        var mesh = new THREE.Mesh(child.geometry, material);
        mesh.scale.setScalar(1000);
        scene.add(mesh);
        sumVolume += getVolume(child.geometry);
    }
    return sumVolume;
}

//* Imports the reference file selected, calculates their volumes, and shows the relevant info in a Modal. 
function compareModels() {
    comparisonVolume = 0;
    objLoader.load(
        "/public/" + comparisonSelect.value,
        function (object) {   // called when resource is loaded
            comparisonVolume = processOBJChildren(object, referenceFileMaterial);
            comparisonVolume = math.round(math.unit(comparisonVolume, 'm^3').toNumber('mm^3'), ROUNDTO);
            console.log(`Reference volume is ${comparisonVolume} mm^3`);
            volumeModalText.innerHTML = `Upload volume is <span class="text-primary">${userVolume} mm^3</span><br>
            Reference volume is <span class="text-success">${comparisonVolume} mm^3</span>`;
            volumeModal.show();
        },
        function (xhr) {
            referenceBar.ariaValueNow = (xhr.loaded / xhr.total * 100);
            referenceBar.style = "width: " + (xhr.loaded / xhr.total * 100) + "%";
            console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        loadingError
    );
    return comparisonVolume;
}

//* Resets the Scene.
function resetScene() {
    volumeModal.show();
    for (var i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        scene.remove(obj);

    }

}

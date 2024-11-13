var startElement = document.getElementById('startButton');
var ENTER = document.getElementById('ENTER');
var userIMG = document.getElementById('userDrawing');
var challIMG = document.getElementById('challDrawing');
var output2 = document.getElementById('canvasOutput2');

var searchItem;
var userDwg;
var challDwg;
var boxBool = false;
var points = [];
output2.addEventListener('click', (e) => {
    let rect = output2.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    console.log("x: " + x + " y: " + y)
    if (boxBool) {
        try {
            points.push(x);
            points.push(y);
            let p1 = new cv.Point(points[0], points[1]);
            let p2 = new cv.Point(points[2] - points[0], points[3] - points[1]);
            let ROI = new cv.Rect(p1.x, p1.y, p2.x, p2.y);
            searchItem = userDwg.roi(ROI);
            let rectDisp = userDwg.clone();
            p2 = new cv.Point(p2.x + p1.x, p2.y + p1.y);
            let color = new cv.Scalar(255, 0, 0, 255); // Color for the drawn rectangle
            cv.rectangle(rectDisp, p1, p2, color, 2, cv.LINE_8, 0);
            cv.imshow('canvasOutput1', searchItem);
            cv.imshow('canvasOutput2', rectDisp);
        }
        catch (e) {
            console.log(e);
        }
        points = [];
        boxBool = false;
    } else {
        boxBool = true;
        points.push(x);
        points.push(y);
    }

});

ENTER.addEventListener('click', (e) => {
    userDwg = cv.imread(userIMG, 0);
    cv.imshow('canvasOutput2', userDwg);
});

startElement.addEventListener('click', (e) => {
    challDwg = cv.imread(challIMG, 0);

    // Setup Mats for contouring and templating
    let contourMat = cv.Mat.zeros(searchItem.rows, searchItem.cols, cv.CV_8UC3);
    let templateMatchMat = new cv.Mat();
    let tempIMG = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let templateMask = new cv.Mat();

    // Recolor search item. 
    cv.cvtColor(searchItem, tempIMG, cv.COLOR_RGB2GRAY, 0);
    cv.threshold(tempIMG, tempIMG, 120, 200, cv.THRESH_BINARY);

    // Finds contours in the search item
    cv.findContours(tempIMG, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    // Draws the contours found. 
    for (let i = 0; i < contours.size(); ++i) {
        let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
            Math.round(Math.random() * 255));
        cv.drawContours(contourMat, contours, i, color, 1, cv.LINE_8, hierarchy, 100);
    }

    // ** Template Matching 
    cv.matchTemplate(challDwg, searchItem, templateMatchMat, cv.TM_CCOEFF, templateMask);
    let result = cv.minMaxLoc(templateMatchMat, templateMask);
    let maxPoint = result.maxLoc;
    let color = new cv.Scalar(255, 0, 0, 255); // Color for the drawn rectangle
    let point = new cv.Point(maxPoint.x + searchItem.cols, maxPoint.y + searchItem.rows);
    // Draws the rectangle of the found template 
    cv.rectangle(challDwg, maxPoint, point, color, 2, cv.LINE_8, 0);


    // ** Overlaying Drawing 
    let freshDrawing = cv.imread(challIMG, 0);
    let overlayOutput = new cv.Mat();
    let overMat = new cv.Mat();
    cv.cvtColor(searchItem, overMat, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(overMat, overMat, 100, 255, cv.THRESH_BINARY);

    overlayOutput = freshDrawing.clone();
    for (let i = 0; i < searchItem.rows; i++) {
        for (let j = 0; j < searchItem.cols; j++) {
            overlayOutput.ucharPtr(i + maxPoint.y, j + maxPoint.x)[1] = overMat.ucharPtr(i, j)[0];
        }
    }

    console.log(`Template found @:{${maxPoint.x},${maxPoint.y}}->{${point.x},${point.y}}`);
    writeCanvas(1, overMat, "Selected Search View");
    writeCanvas(2, challDwg, "Challenge Drawing Found Template Area");
    writeCanvas(3, overlayOutput, "Overlayed Output. Purple = new from Selection. Green = new from Challenge");



}, false);

var Module = {
    // https://emscripten.org/docs/api_reference/module.html#Module.onRuntimeInitialized
    onRuntimeInitialized() {
        document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
        console.log("OpenCV.js READY");
    }
};

function writeCanvas(OUTPUT_NUM, IMG, caption) {
    cv.imshow('canvasOutput' + OUTPUT_NUM, IMG);
    document.getElementById('canvasOutput_Caption' + OUTPUT_NUM).innerHTML = caption;
}
const EXAMPLE_CODE_HTML = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Image Classifier</title>
  <link rel="shortcut icon" href="https://ai.almir.info/assets/img/logo/favicon.ico" type="image/x-icon">
  <link rel="stylesheet" href="https://ai.almir.info/assets/bootstrap/mdb.css">
  <link rel="stylesheet" href="https://ai.almir.info/assets/bootstrap/bootstrap-icons.css">
  <link rel="stylesheet" href="https://ai.almir.info/assets/css/common.css">
</head>

<body>
  <div class="container my-5">
    <h1 class="display-4 fw-bold text-primary mb-5">My Image Classifier</h1>

    <div id="status" class="alert alert-primary fs-5" role="alert">Loading model... please wait</div>
    <div class="d-flex gap-3 flex-wrap">
      <button id="webcam" class="btn btn-lg btn-primary d-none">Enable Webcam</button>
      <button id="testCamera" class="btn btn-lg btn-primary d-none">Take Photo</button>
      <button id="testImgBtn" class="btn btn-lg btn-primary d-none"
        onclick="document.getElementById('testImgFile').click()">
        Upload Image
      </button>
    </div>
    <div class="mt-3 d-flex gap-3">
      <input id="testImgFile" type="file" accept="image/*" class="d-none" />
      <video id="camera" autoplay muted class="d-none"></video>
      <img id="testImgPrev" class="d-none" width="224"></img>
    </div>
  </div>

  <script src="https://ai.almir.info/assets/bootstrap/mdb.js"></script>
  <script src="https://ai.almir.info/assets/js/jquery.js"></script>
  <script src="https://ai.almir.info/assets/js/common.js"></script>
  <script src="https://ai.almir.info/assets/js/tensorflow/tf.min.js"></script>

  <script type="text/javascript">
    const STATUS = document.getElementById("status");
    let mobilenet = undefined;
    let model = undefined
    const IMAGE_WIDTH = 224;
    const IMAGE_HEIGHT = 224;
    const modelUrl = './model.json';
    var CLASS_NAMES = './class_names.json';
    const VIDEO = document.getElementById("camera");
    VIDEO.width = IMAGE_WIDTH
    VIDEO.height = IMAGE_HEIGHT

    async function loadModel() {
      await loadMobileNetFeatureModel();
      model = await tf.loadLayersModel(modelUrl);
      CLASS_NAMES = await loadClasses(CLASS_NAMES)
      console.log('Classes: ', CLASS_NAMES)
      console.log('Model: ', model)

      $("#testImgFile").on("change", (event) => {
        predictImg(event);
      });
      $("#testCamera").on("click", (event) => {
        predictVideo();
      });
      $("#webcam").removeClass("d-none");
      $("#testImgBtn").removeClass("d-none");
      STATUS.innerHTML = "Model Loaded"
    }
    loadModel()

    async function loadClasses(path) {
      try {
        const response = await fetch(path);
        const classNames = await response.json();
        return classNames;
      } catch (error) {
        console.error('Failed to load class names:', error);
        return null;
      }
    }

    function prediction(testData) {
      tf.tidy(function () {
        let FrameAsTensor = tf.browser.fromPixels(testData).div(255);
        let resizedTensorFrame = tf.image.resizeBilinear(
          FrameAsTensor,
          [IMAGE_HEIGHT, IMAGE_WIDTH],
          true
        );

        let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims());
        let prediction = model.predict(imageFeatures).squeeze();
        let highestIndex = prediction.argMax().arraySync();
        let predictionArray = prediction.arraySync();

        var predictedClass = CLASS_NAMES[highestIndex]
        var accuracy = Math.floor(predictionArray[highestIndex] * 100) + '%'
        STATUS.innerHTML = 'Prediction: <span class="fw-semibold">'
          + predictedClass
          + '</span> with <span class="fw-semibold">'
          + accuracy
          + '</span> confidence';
        logPrediction(predictedClass, accuracy)
      });
    }

    function predictImg(event) {
      const imgElement = document.getElementById("testImgPrev");
      imgElement.src = URL.createObjectURL(event.target.files[0]);
      imgElement.onload = () => prediction(imgElement);
      imgElement.width = IMAGE_WIDTH;
      imgElement.height = IMAGE_HEIGHT;
      imgElement.classList.remove("d-none");
    }

    function predictVideo() {
      prediction(VIDEO);
    }

    $('#webcam').on("click", () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        VIDEO.classList.remove("d-none");
        const options = {
          video: { facingMode: "environment" },
          // width: 640,
          height: 480,
        };

        navigator.mediaDevices.getUserMedia(options).then(function (stream) {
          VIDEO.srcObject = stream;
          VIDEO.addEventListener("loadeddata", function () {
            videoPlaying = true;
            $('#webcam').addClass("d-none");
            $("#testCamera").removeClass("d-none");
            STATUS.innerText = "Camera is on!";
          });
        });

      } else {
        STATUS.innerText = "Camera is not found.";
      }
    });

    // Loads the MobileNet model and warms it up so ready for use.
    async function loadMobileNetFeatureModel() {
      const URL =
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";
      mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true });
      tf.tidy(function () {
        let answer = mobilenet.predict(tf.zeros([1, IMAGE_HEIGHT, IMAGE_WIDTH, 3]));
      });
    }

    async function logPrediction(className, accuracy) {
      const response = await fetch('/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ className, accuracy })
      });
      console.log(await response.text())
    }

  </script>
</body>

</html>
`;

const EXAMPLE_CODE_JS = `
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.static(__dirname));
app.use(express.json());
app.use(cors());

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.post("/log", async (req, res) => {
  try {
    await writeToCSV(req.body.className, req.body.accuracy);
    res.status(200).send("Prediction logged successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred while logging the prediction.");
  }
});

async function writeToCSV(className, accuracy) {
  const filePath = path.join(__dirname, "log.csv");
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "DateTime,Class,Accuracy\\n");
  }
  const row =
    new Date().toISOString() + "," + className + "," + accuracy + "\\n";
  fs.appendFileSync(filePath, row);
  console.log("New entry in the log.");
}

app.listen(8000, () => console.log("App running on http://localhost:8000"));
`;

const EXAMPLE_CODE_BAT = `
@echo off
cd /d %~dp0
CALL npm install express cors
start http://localhost:8000
node app.js
`;

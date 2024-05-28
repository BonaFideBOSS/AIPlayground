const STATUS = document.getElementById("status");
const VIDEO = document.getElementById("webcam");
const ENABLE_CAM_BUTTON = document.getElementById("enableCam");
const RESET_BUTTON = document.getElementById("reset");
const TRAIN_BUTTON = document.getElementById("train");
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const STOP_DATA_GATHER = -1;
var CLASS_NAMES = [];

let mobilenet = undefined;
let gatherDataState = STOP_DATA_GATHER;
let videoPlaying = false;
let trainingDataInputs = [];
let trainingDataOutputs = [];
let examplesCount = [];
let predict = false;

// Loads the MobileNet model and warms it up so ready for use.
async function loadMobileNetFeatureModel() {
  const modal = new mdb.Modal(document.querySelector(".status-modal"), {
    backdrop: "static",
  });
  modal.show();

  const URL =
    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";
  // const URL = 'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_large_100_224/feature_vector/5/default/1'

  mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true });
  $(".status-modal .modal-body").html(
    '<p class="fs-5 my-0">Model builder loaded successfully!</p>'
  );
  modal.hide();
  STATUS.innerText = "Enable webcam to capture images";

  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    let answer = mobilenet.predict(
      tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])
    );
    console.log("model builder loaded", answer.shape);
  });
}

// Call the function immediately to start loading.
loadMobileNetFeatureModel();

ENABLE_CAM_BUTTON.addEventListener("click", enableCam);
// TRAIN_BUTTON.addEventListener('click', trainAndPredict);
$(TRAIN_BUTTON).on("click", function () {
  if (trainingDataInputs.length > 0) {
    $("button,input").attr("disabled", true);
    STATUS.innerHTML = `<p>Compiling model... please wait.</p>
            <div class="progress" style="height: 20px;">
                <div class="progress-bar bg-primary progress-bar-striped progress-bar-animated" style="width: 100%"></div>
            </div>`;
    setTimeout(() => {
      trainAndPredict();
    }, 1000);
  } else {
    STATUS.innerText = "Please add some data";
  }
});
RESET_BUTTON.addEventListener("click", reset);

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam() {
  if (hasGetUserMedia()) {
    // getUsermedia parameters.
    const constraints = {
      video: true,
      // width: 640,
      height: 480,
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      VIDEO.srcObject = stream;
      VIDEO.addEventListener("loadeddata", function () {
        videoPlaying = true;
        ENABLE_CAM_BUTTON.classList.add("d-none");
        STATUS.innerText = "Camera is on! Start collecting data.";
        $(".dataCollector").attr("disabled", false);
      });
    });
  } else {
    STATUS.innerText = "Camera is not supported by your browser.";
  }
}

let model = tf.sequential();
async function trainAndPredict() {
  model.add(
    tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" })
  );
  model.add(
    tf.layers.dense({ units: CLASS_NAMES.length, activation: "softmax" })
  );
  model.summary();
  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    // Adam changes the learning rate over time which is useful.
    optimizer: "adam",
    // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
    // Else categoricalCrossentropy is used if more than 2 classes.
    loss:
      CLASS_NAMES.length === 2
        ? "binaryCrossentropy"
        : "categoricalCrossentropy",
    // As this is a classification problem you can record accuracy in the logs too!
    metrics: ["accuracy"],
  });

  predict = false;
  tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);
  let outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
  let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
  let inputsAsTensor = tf.stack(trainingDataInputs);

  let results = await model.fit(inputsAsTensor, oneHotOutputs, {
    shuffle: true,
    batchSize: parseInt($("#batchSize").val()),
    epochs: parseInt($("#epochs").val()),
    callbacks: { onEpochEnd: logProgress },
  });

  outputsAsTensor.dispose();
  oneHotOutputs.dispose();
  inputsAsTensor.dispose();
  predict = true;
  $("button,input").attr("disabled", false);
  predictLoop();
}

function predictLoop() {
  if (predict) {
    tf.tidy(function () {
      let videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
      let resizedTensorFrame = tf.image.resizeBilinear(
        videoFrameAsTensor,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      );

      let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims());
      let prediction = model.predict(imageFeatures).squeeze();
      let highestIndex = prediction.argMax().arraySync();
      let predictionArray = prediction.arraySync();

      STATUS.innerHTML = `Prediction: <span class="fw-semibold">${
        CLASS_NAMES[highestIndex]
      }</span> with <span class="fw-semibold">${Math.floor(
        predictionArray[highestIndex] * 100
      )}%</span> confidence`;
    });
    window.requestAnimationFrame(predictLoop);
  }
}

function logProgress(epoch, logs) {
  var percentage = ((epoch + 1) * 100) / parseInt($("#epochs").val());
  $(STATUS)
    .find("p")
    .text("Training... please wait. This may take several minutes.");
  $(STATUS).find(".progress-bar").width(`${percentage}%`);
  $(STATUS).find(".progress-bar").text(`${percentage}%`);
  console.log("Data for epoch " + epoch, logs);
}

function reset() {
  predict = false;
  examplesCount.length = 0;
  for (let i = 0; i < trainingDataInputs.length; i++) {
    trainingDataInputs[i].dispose();
  }
  trainingDataInputs.length = 0;
  trainingDataOutputs.length = 0;
  STATUS.innerText = "Model reset.";
  $(".sample-count").text("Add image samples:");
  $(".samples-container").html("");
  $(".samples-container").addClass("d-none");
  console.log("Tensors in memory: " + tf.memory().numTensors);
}

function get_classes() {
  CLASS_NAMES = [];
  let dataCollectorButtons = document.querySelectorAll("button.dataCollector");
  for (let i = 0; i < dataCollectorButtons.length; i++) {
    dataCollectorButtons[i].addEventListener("click", gatherDataForClass);
    // dataCollectorButtons[i].addEventListener('mouseup', gatherDataForClass);
    // Populate the human readable names for classes.
    var class_name = $(dataCollectorButtons[i])
      .parent()
      .parent()
      .find("input")
      .val();
    CLASS_NAMES.push(class_name);
  }
}
get_classes();

function gatherDataForClass() {
  $(".dataCollector").prop("disabled", true);
  let classNumber = parseInt(this.getAttribute("data-1hot"));
  gatherDataState =
    gatherDataState === STOP_DATA_GATHER ? classNumber : STOP_DATA_GATHER;
  if (gatherDataState === STOP_DATA_GATHER) {
    $(this).text("Capture images");
    $(".dataCollector").prop("disabled", false);
  } else {
    $(this).text("Stop capturing images");
    $(this).prop("disabled", false);
  }
  dataGatherLoop();
}

function dataGatherLoop() {
  if (videoPlaying && gatherDataState !== STOP_DATA_GATHER) {
    let imageFeatures = tf.tidy(function () {
      let videoFrameAsTensor = tf.browser.fromPixels(VIDEO);
      let resizedTensorFrame = tf.image.resizeBilinear(
        videoFrameAsTensor,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      );
      let normalizedTensorFrame = resizedTensorFrame.div(255);
      return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze();
    });

    trainingDataInputs.push(imageFeatures);
    trainingDataOutputs.push(gatherDataState);

    let canvas = document.createElement("canvas");
    canvas.width = MOBILE_NET_INPUT_WIDTH;
    canvas.height = MOBILE_NET_INPUT_HEIGHT;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(VIDEO, 0, 0, canvas.width, canvas.height);
    const $sampleContainer = $(`[data-image-samples="${gatherDataState}"]`);
    $sampleContainer.removeClass("d-none");
    $sampleContainer.append(canvas);
    $sampleContainer.scrollLeft($sampleContainer.get(0).scrollWidth);

    // Intialize array index element if currently undefined.
    if (examplesCount[gatherDataState] === undefined) {
      examplesCount[gatherDataState] = 0;
    }
    examplesCount[gatherDataState]++;

    for (let n = 0; n < CLASS_NAMES.length; n++) {
      var samples = examplesCount[n] ? examplesCount[n] : 0;
      if (samples > 0) {
        $(`[data-image-samples-count="${n}"]`).text(
          `Image samples: ${samples}`
        );
      }
    }
    window.requestAnimationFrame(dataGatherLoop);
  }
}

const add_class_btn = document.getElementById("add-class");
add_class_btn.addEventListener("click", function () {
  var no_of_classes = document.querySelectorAll(".classes").length;
  var disabled = videoPlaying === true ? "" : "disabled";
  var new_class = `
    <div class="classes card shadow-0 border">
        <div class="card-header p-3 text-bg-light">
          <div class="form-outline" data-mdb-input-init>
            <input type="text" class="form-control form-control-lg" value="Class ${
              no_of_classes + 1
            }" placeholder="class name" />
            <label class="form-label">Class Label</label>
          </div>
        </div>
        <div class="card-body">
            <p class="sample-count mb-0" data-image-samples-count="${no_of_classes}">Add image samples:</p>
            <div data-image-samples="${no_of_classes}" class="samples-container py-3 d-flex gap-1 overflow-hidden overflow-x-scroll d-none"></div>
            <button class="dataCollector btn btn-primary mt-3" data-1hot="${no_of_classes}" data-name="Class ${
    no_of_classes + 1
  }" ${disabled}>
                Capture images
            </button>
        </div>
    </div>`;
  $("#classes-container").append(new_class);
  document.querySelectorAll(".form-outline").forEach((el) => {
    new mdb.Input(el).update();
  });
  read_inputs();
  get_classes();
});

function read_inputs() {
  document.querySelectorAll(".classes input").forEach((class_input) => {
    class_input.addEventListener("input", function () {
      get_classes();
    });
  });
}
read_inputs();

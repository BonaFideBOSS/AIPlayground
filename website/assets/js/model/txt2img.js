const styles = [
  "text2img",
  "stable-diffusion",
  "cyberpunk-generator",
  "logo-generator",
];

$("#generate-image").on("submit", async function (e) {
  e.preventDefault();
  $(this).find("button").attr("disabled", true);
  show_new_image_loader();

  var query = Object.fromEntries(new FormData(this));
  if (query.prompt == "") {
    return;
  }

  if (!styles.includes(query.style)) {
    return;
  }

  const options = {
    text: query.prompt,
    aspect_ratio: "1:1",
    samples: 1,
  };

  var image = await generate_image(options);
  if (image) {
    display_new_image(image);
    $(this).find("button").attr("disabled", false);
    $(".delete-session-btn").removeClass("d-none");
  } else {
    display_fail_message();
  }
});

async function generate_image(options) {
  image = "";
  try {
    var result = await text2img(options);
    if (result.data) {
      const API_DATA = result.data[0];
      image = await upload_to_cloud(API_DATA.asset_url, options.text);
      add_to_session("txt2img", image);
    }
  } catch (error) {
    console.log(error);
  }
  return image;
}

async function text2img(options) {
  console.log(options);
  const resp = await fetch(`https://api.limewire.com/api/image/generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Version": "v1",
      Accept: "application/json",
      Authorization:
        "Bearer lmwr_sk_jsVlFoO4JI_4sKFgY3nUt674GeqAinpw4QodEExewge2y57s",
    },
    body: JSON.stringify(options),
  });

  const data = await resp.json();
  console.log(data);
}

function show_new_image_loader() {
  var loader = `
    <div class="col generating-image placeholder-wave">
      <div class="card text-bg-dark h-100 border-0 rounded-3">
        <img src="/assets/img/logo/logo-full.png" class="card-img opacity-0 placeholder h-100">
        <div class="card-img-overlay text-center d-flex flex-column justify-content-center">
          <h5 class="card-title">Generating image...</h5>
          <p class="card-text text-secondary">Please hold on! This may take a while.</p>
        </div>
      </div>
    </div>
  `;
  $("#ai-images").prepend(loader);
  scroll_to_new_image();
}

function display_new_image(image) {
  image = `<img src="${image}" width="100%">`;
  $(".generating-image").html(image);
  $(".generating-image").removeClass("generating-image placeholder-wave");
}

function display_fail_message() {
  $(".generating-image").removeClass("placeholder-wave");
  $(".generating-image .placeholder").removeClass("placeholder");
  $(".generating-image .card-title").html("Failed to generate image");
  $(".generating-image .card-text").html(
    "Please try again later or contact the developer."
  );

  setTimeout(() => {
    $(".generating-image").remove();
    $("#generate-image button").attr("disabled", false);
  }, 10000);
}

function scroll_to_new_image() {
  document.querySelector(".generating-image").scrollIntoView({
    behavior: "auto",
    block: "center",
    inline: "center",
  });
}

async function upload_to_cloud(image, name = null) {
  const api_key = "d5189c1fb088a3558b2c8ca0fae2e392";
  const url = "https://api.imgbb.com/1/upload";

  const form = new FormData();
  form.append("key", api_key);
  form.append("image", image);
  if (name) {
    form.append("name", name);
  }

  await $.ajax({
    url: url,
    data: form,
    cache: false,
    contentType: false,
    processData: false,
    method: "POST",
    success: function (response) {
      image = response.data.url;
    },
  });

  return image;
}

function add_to_session(db, img) {
  const url = "/aiart/add-to-session";
  const data = { db: db, image: img };
  $.post(url, data);
}

$(".btn-save-img").on("click", function () {
  var image = $(this).data("img");
  var link = document.createElement("a");
  link.href = image;
  link.download = image;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

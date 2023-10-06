const path = require("path");
// const {data} = require("./appscript.js")
const axios = require("axios");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

fastify.get("/", function (request, reply) {
  // The Handlebars code will be able to access the parameter values and build them into the page
  return reply.view("/src/pages/index.hbs");
});

fastify.post("/", async function (request, reply) {
  let username = request.body.username_admin;
  let password = request.body.password_admin;
  let rw = request.body.rw_admin;
  let params = { pesan: "" };
  if (username == "") {
    params["pesan"] = "tidak boleh kosong";
    return reply.view("/src/pages/index.hbs", params);
  } else {
    let url =
      "https://script.google.com/macros/s/AKfycbzJbbe-S3idijgn-MDurYngjZ7cw_8pSvxPmnc-_d_QSGcMjITDX8gQtjNhCSwYbqnM/exec";

    await axios({
      method: "post",
      url: url,
      data: {
        rw: rw,
        username: username,
        password: password,
      },
    })
      .then((res) => {
        console.log(res.data);
        let dataDb = {
          no_keluarga: "",
          kki: "",
          nik: "",
          nama: "",
          hubungan: "",
          tanggal_lahir: "",
          usia: "",
          jumlah_anak: "",
          kesetaraan_jkn: "",
          status_pus: "",
          status_hamil: "",
          password: "",
        };

        params["pesan"] = res.data;
        let pesanServer = res.data;

        if (pesanServer != "username/password salah") {
          return reply.view("/src/pages/dasboard.hbs", params);
        } else {
          return reply.view("/src/pages/index.hbs", params);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      // console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);

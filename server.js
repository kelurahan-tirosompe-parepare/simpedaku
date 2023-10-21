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
fastify.register(require('@fastify/multipart'),  { attachFieldsToBody: 'keyValues' })

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

// Load and parse SEO data
const suket = require("./src/suket.json");

async function kirimGscript(data){
  let urlScript =
    "https://script.google.com/macros/s/AKfycbzJbbe-S3idijgn-MDurYngjZ7cw_8pSvxPmnc-_d_QSGcMjITDX8gQtjNhCSwYbqnM/exec";
  
  return await axios({
    method: "post",
    url: urlScript,
    data: data,
  })
}


fastify.get("/", function (request, reply) {
  // The Handlebars code will be able to access the parameter values and build them into the page
  return reply.view("/src/pages/index.hbs");
});

fastify.get("/dashboard", function (request, reply) {
  // The Handlebars code will be able to access the parameter values and build them into the page
  return reply.view("/src/pages/index.hbs");
});

  

fastify.post("/dashboard", async function (request, reply) {
  let username = request.body.username_admin;
  let password = request.body.password_admin;
  let rw = request.body.rw_admin;
  
  let data = {
      rw: rw,
      username: username,
      password: password
    }
  
  
  let params = { pesan: "" };

  if (username == "" || Number.isNaN(rw * 1) || password == "") {
    params["pesan"] = "salah";
    return reply.view("/src/pages/index.hbs", params);
  }


  await kirimGscript(data)
    .then((res) => {
      // console.log(res.data);
      params["pesan"] = res.data;
      let pesanServer = res.data;

      let dataDb = {
        dataUser: JSON.stringify({
          no_keluarga: pesanServer[0],
          kki: pesanServer[1],
          nik: pesanServer[2],
          nama: pesanServer[3],
          hubungan: pesanServer[4],
          tanggal_lahir: pesanServer[5],
          usia: pesanServer[6],
          jumlah_anak: pesanServer[7],
          kesetaraan_jkn: pesanServer[8],
          status_pus: pesanServer[9],
          status_hamil: pesanServer[10],
          password: pesanServer[11],
        }),
        dataList: suket,
        dataForm: JSON.stringify(suket)
      };

      // console.log(dataDb)

      if (pesanServer != "username/password salah") {
        return reply.view("/src/pages/dasboard.hbs", dataDb);
      } else {
        return reply.view("/src/pages/index.hbs", params);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});


fastify.post("/kirimfile",  async function (req, reply){
  // console.log(req.body)
  let berkas = {berkas:req.body}
  console.log(berkas)
  kirimGscript(berkas)
  .then(resp => {
    console.log(resp.data)
    reply.send(resp.data)
  })
})

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



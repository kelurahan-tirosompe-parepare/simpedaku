const path = require("path");
// const {data} = require("./appscript.js")

const axios = require("axios");

let token, tirsom //user id

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
  options: {
    partials: {
      header: './src/partials/header.hbs',
      navigation: './src/partials/navigation.hbs',
      modal_loading: './src/partials/loading.hbs',
      jquery_bootstrap: './src/partials/jquery_bootstrap.hbs'
    }
  }
});


// Load and parse SEO data
const suket = require("./src/suket.json");

fastify.get("/", function (request, reply) {

  token = Math.random().toString(36).slice(2)
  
  var now = new Date();
  var time = now.getTime();
  var expireTime = time + 1000*36000;
  now.setTime(expireTime);

  reply.header('set-cookie', [`token=${token};Expires=${now.toUTCString()};HttpOnly=true;Secure=true`]);
  return reply.view("/src/pages/index.hbs");
});

fastify.get("/dashboard", function (req, reply) {
  let cookies = kukiValidation(req.headers.cookie)
  if(cookies){
    return reply.view("/src/pages/dashboard.hbs");
  }
  
    // reply.headers('set-cookie', [`tirsom=${tirsom} ;Expires=${Date.now()}`])
    return reply.redirect("/"); 
});


fastify.post("/login", async function (request, reply) {
  let username = request.body.username_admin;
  let password = request.body.password_admin;
  let rw = request.body.rw_admin;
  
  let data = {
      rw: rw,
      username: username,
      password: password,
      mode: 'login'
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
        dataUser: {
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
          rw: pesanServer[12]
        },
        dataList: suket,
        dataForm: JSON.stringify(suket)
      };

      // console.log(dataDb)

      if (pesanServer != "username/password salah") {
        tirsom = dataDb.dataUser.nik
        console.log(token)
        
        var now = new Date();
        var time = now.getTime();
        var expireTime = time + 1000*36000;
        now.setTime(expireTime);
        
        reply.header('set-cookie', [`tirsom=${tirsom} ;Expires=${now.toUTCString()};HttpOnly=true;Secure=true`]);
        reply.view("/src/pages/dashboard.hbs", dataDb);
        reply.redirect("dashboard")
      } else {
        reply.view("/src/pages/index.hbs", params)
        reply.redirect("/")
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

fastify.get("/login", function(req,res){
  res.redirect('/dashboard')
})

fastify.get("/riwayat", function(req, rep){
  let cookie = kukiValidation(req.headers.cookie)
 
  if(cookie){
    return rep.view("/src/pages/riwayat.hbs");  
  }
  
    return rep.view('/src/pages/index.hbs')
})

fastify.post("/kirimfile",  async function (req, reply){
  // console.log(req.body)
  let berkas = {berkas:req.body, mode: 'berkas'}
  // console.log(berkas)
  await kirimGscript(berkas)
  .then(resp => {
    console.log(resp.data)
    reply.send(resp.data)
  })
  .catch(err => {
    reply.send(err)
  })
})

// validasi kuki
function kukiValidation(kuki){
  console.log('tirsom:', tirsom)
  console.log('token:', token)
  try{
    let kukis = {}
    kukis['token'] = (kuki.split(';')[1]).split("=")[1]
    kukis['tirsom'] = (kuki.split(';')[0]).split("=")[1]

    if(kukis['token'] == token && kukis['tirsom'] == tirsom){
      return true 
    }
      return false
    
  }catch{
    return false
  }
}

async function kirimGscript(data){
  let urlScript = "https://script.google.com/macros/s/AKfycbzJbbe-S3idijgn-MDurYngjZ7cw_8pSvxPmnc-_d_QSGcMjITDX8gQtjNhCSwYbqnM/exec";
  // let urlScript = "https://script.google.com/macros/s/AKfycbwDXO3TvaJUqaAxrZ3i2zX7oyKJlEbkZEXPcrzk6_0/dev"
  console.log(data)
  return await axios({
    method: "post",
    url: urlScript,
    data: data,
  })
}

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
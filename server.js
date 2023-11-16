const path = require("path");
const PhotoSwipe = require('./node_modules/photoswipe/dist/photoswipe.esm.js')
//const phswStyle = require('./node_modules/dist/photoswipe/photoswipe.css');
console.log(PhotoSwipe)

const axios = require("axios");
const handlebars = require("handlebars")
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
    handlebars: handlebars,
  },
  options: {
    partials: {
      header: './src/partials/header.hbs',
      navigation: './src/partials/navigation.hbs',
      modal_loading: './src/partials/loading.hbs',
      jquery_bootstrap: './src/partials/jquery_bootstrap.hbs',
      admin_jquery_bootstrap: './src/partials/adminjqbootstrap.hbs',
      admin_navigation: './src/partials/adminnavigation.hbs',
    }
  }
});


//REGISTER HELPER =============================================
handlebars.registerHelper('noUrut', function (index) {
    return index + 1
})

handlebars.registerHelper('bikinLink', function (url, title) {
    return `<a href="${url}">${title}</a>`
})

handlebars.registerHelper('warna', function(warna){
  const pilihan = {"biru" : "primary", "abu" : "secondary", "hijau" : "success","jingga" : "info", "kuning" :"warning", "merah" : "danger", "putih" : "light", "hitam" : "dark"}
  if(warna == 'ada' || warna == 'selesai'){
    return 'success'
  }else{
    return 'warning'
  }
})

handlebars.registerHelper('link', function(items, options){
    const linkArr = JSON.parse(items)
    const itemsAsHtml = linkArr.map(item => {
      return `<a href=${item.url} target="frame_foto">${item.title}</a>`
    })
    console.log(itemsAsHtml)
    return itemsAsHtml.join("<br>") 
})

//\\=========================================================

function setCookie(exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = d.toUTCString();
  return expires
  // document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

fastify.register(require('@fastify/cookie'))
fastify.register(require('@fastify/session'), {
    cookieName: 'sessionId',
    secret: "Math.random().toString(36).slice(2)",
    cookie: { secure: false, expires: setCookie(1) }
  })

// Load and parse SEO data
const suket = require("./src/suket.json");

fastify.get("/", function (req, rep) {
  // token = Math.random().toString(36).slice(2)
  req.session.authenticated = false
  return rep.view("/src/pages/index.hbs");
});

fastify.get("/dashboard", function (req, reply) {
  // console.log((req.session.authenticated))
  if(req.session.authenticated){
    return reply.view("/src/pages/dashboard.hbs", req.session.get('dataDb'));
  }else{
    return reply.redirect("/"); 
  }
  
    // reply.headers('set-cookie', [`tirsom=${tirsom} ;Expires=${Date.now()}`])
});

fastify.get("/belanja/:produk", function(req, rep){
  if(req.session.authenticated){
    return rep.view("/src/pages/belanja.hbs")
    }else{
      return rep.redirect("/")
    }
})











//============          ADMIN         =============================

fastify.get("/admin", async function(req, rep){
  let data = {} 
  
  // console.log('log admin= ', rep)
  
  if(req.session.authenticated){
     data['mode'] = 'admin';
    await kirimGscript(data)
      .then((res) => {
      // let adminDb = req.session.get('admin')
      let data = res.data.pesanServer
      data.shift()
      // console.log('pesan server untuk admin= ', data)
      
      return rep.view("/src/pages/admin/admin.hbs", {riwayat: data})
    })
   }else{
      return rep.redirect("/")
   }
})

fastify.get("/admin-umkm", function(req, res){
  if(req.session.authenticated){
    return res.view("/src/pages/admin/admin-umkm.hbs")
  }else{
    return res.redirect("/")
  }
})

fastify.get("/admin-pengaduan", function(req, res){
  if(req.session.authenticated){
    return res.view("/src/pages/admin/admin-pengaduan.hbs")
  }else{
    return res.redirect("/")
  }
})

fastify.get("/admin-akun", function(req, res){
  if(req.session.authenticated){
    return res.view("/src/pages/admin/admin-akun.hbs")
  }else{
    return res.redirect("/")
  }
})

//=================================================================================












fastify.post("/dashbord", async function (request, reply) {
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

  if(username == "admin" && password == "admin"){
    request.session.authenticated = true
//     data.mode = 'admin';
//     await kirimGscript(data)
//       .then((res) => {
      
//        if (res.data != "username/password salah") {
//           params['pesan'] = res.data
          // request.session.authenticated = true
          // request.session.set('admin', params)
          reply.redirect("admin")
//         } else {
//           return reply.redirect("/")
//         }

//     })
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
        
        request.session.authenticated = true
        request.session.set('dataDb', dataDb)
        
        return reply.view("/src/pages/dashboard.hbs", dataDb);
      } else {
        return reply.view("/src/pages/index.hbs", params)
      }
    })
    .catch((err) => {
      console.log(err);
    });
});


fastify.get("/riwayat", function(req, rep){
 if(req.session.authenticated){
   let dataUser = (req.session.get('dataDb')).dataUser
   // console.log(dataUser.nik)
   let riwayat = {riwayat:dataUser, mode: 'riwayat'}
   kirimGscript(riwayat)
     .then(resp => {
     // console.log(resp.data.pesanServer)
      return rep.view("/src/pages/riwayat.hbs", {dataRiwayat: resp.data.pesanServer});
     })
   
  }else{
    return rep.redirect("/"); 
  }

})

fastify.get("/pengaduan", function(req, rep){
 if(req.session.authenticated){
   let dataUser = (req.session.get('dataDb')).dataUser
   // dataUser['aduan'] = '';
   // console.log(dataUser.nik)
   let aduan = {pengaduan:dataUser, mode: 'pengaduan'}
   // kirimGscript(aduan)
   //   .then(resp => {
   //   console.log(resp.data.pesanServer)
      return rep.view("/src/pages/pengaduan.hbs") //, {dataAduan: resp.data.pesanServer});
   //   })
   
  }else{
    return rep.redirect("/"); 
  }

})


fastify.get("/akun", function(req, rep){
 if(req.session.authenticated){
   let dataUser = (req.session.get('dataDb')).dataUser
   // console.log(dataUser.nik)
   let riwayat = {riwayat:dataUser, mode: 'riwayat'}
   kirimGscript(riwayat)
     .then(resp => {
     // console.log(resp.data.pesanServer)
      return rep.view("/src/pages/akun.hbs", {dataRiwayat: resp.data.pesanServer});
     })
   
  }else{
    return rep.redirect("/"); 
  }

})


fastify.post("/kirimfile",  async function (req, reply){
  // console.log(req.body)
  let berkas = {berkas:req.body, mode: 'berkas'}
  // console.log(berkas)
  await kirimGscript(berkas)
  .then(resp => {
    // console.log('kirimfile', resp.data)
    reply.send(resp.data)
  })
  .catch(err => {
    reply.send(err)
  })
})


async function kirimGscript(data){
  let urlScript = "https://script.google.com/macros/s/AKfycbzJbbe-S3idijgn-MDurYngjZ7cw_8pSvxPmnc-_d_QSGcMjITDX8gQtjNhCSwYbqnM/exec";
  // let urlScript = "https://script.google.com/macros/s/AKfycbwDXO3TvaJUqaAxrZ3i2zX7oyKJlEbkZEXPcrzk6_0/dev"
  console.log('kirimGscript: ', data)
  return await axios({
    method: "post",
    url: urlScript,
    data: data,
  })
}

// validasi kuki
// function kukiValidation(kuki){
//   console.log('tirsom:', tirsom)
//   console.log('token:', token)
//   try{
//     let kukis = {}
//     kukis['token'] = (kuki.split(';')[1]).split("=")[1]
//     kukis['tirsom'] = (kuki.split(';')[0]).split("=")[1]

//     if(kukis['token'] == token && kukis['tirsom'] == tirsom){
//       return true 
//     }
//       return false
    
//   }catch{
//     return false
//   }
// }

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
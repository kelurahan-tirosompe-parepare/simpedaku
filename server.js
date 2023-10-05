const path = require("path");
const {data} = require("./appscript.js")

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



fastify.post("/", function (request, reply) {
  
  let username = request.body.username_admin;
  let params = { pesan: "" };
  if (username == "") {
    params["pesan"] = "tidak boleh kosong";
    return reply.view("/src/pages/index.hbs", params);
  } else {
    data.then(res => {
      return params["pesan"] = res
    })
    //params["pesan"] = "username/password salah";
    //return reply.view("/src/pages/dasboard.hbs", params);
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

module.exports = function (fastify, url, next) {
  fastify.register(require('fastify-http-client'))

  // request via httpclient
  fastify.httpclient.request(url, (err, body) => {
    return  body.length;
  })

  next()
}
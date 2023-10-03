module.exports = function () {
  const { request } = require("urllib");
  const url =
    "https://script.google.com/macros/s/AKfycbzJbbe-S3idijgn-MDurYngjZ7cw_8pSvxPmnc-_d_QSGcMjITDX8gQtjNhCSwYbqnM/exec";
  
  const { data, res } = await request("http://cnodejs.org/");
    // result: { data: Buffer, res: Response }
    return data.
};

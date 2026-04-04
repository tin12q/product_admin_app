const http = require("http");
const fs = require("fs");
const path = require("path");
const base = "D:/Projects/product_admin_app/build/web";
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm"
};
http.createServer((req, res) => {
  let url = req.url === "/" ? "/index.html" : req.url;
  let filePath = path.join(base, url.split("?")[0]);
  try {
    const ext = path.extname(filePath);
    res.writeHead(200, {"Content-Type": mime[ext] || "application/octet-stream", "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp"});
    res.end(fs.readFileSync(filePath));
  } catch(e) {
    res.writeHead(404);
    res.end("Not found: " + url);
  }
}).listen(8080, () => { console.log("Server running at http://localhost:8080"); });

const app = require("../artifacts/api-server/dist/vercel-app.cjs");
module.exports = app.default ? app.default : app;

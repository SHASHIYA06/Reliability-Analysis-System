import app from "./app";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 10000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

import "dotenv/config";
import { app } from "./app.js";
import { ensureDbReady } from "./db.js";

const PORT = process.env.PORT || 4000;

await ensureDbReady();
app.listen(PORT, () => {
  console.log(`Prasanna API listening on http://localhost:${PORT}`);
});

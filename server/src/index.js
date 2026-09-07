import "dotenv/config";
import { app } from "./app.js";
import { initDb } from "./db.js";

const PORT = process.env.PORT || 4000;

await initDb();
app.listen(PORT, () => {
  console.log(`Prasanna API listening on http://localhost:${PORT}`);
});

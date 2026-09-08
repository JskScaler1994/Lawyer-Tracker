import { app } from "../src/app.js";

// DB readiness is handled inside app.js (see requireDb there), scoped to
// only the routes that actually need it — cors() must always run first and
// unconditionally, so it isn't gated on anything here.
export default function handler(req, res) {
  app(req, res);
}

import { app } from "../src/app.js";

// This is a single fixed function (not a [...path] bracket file) because
// Vercel's dynamic-route matching for a bracket catch-all under api/ was
// observed NOT to match multi-segment paths in this project (e.g.
// /api/cases worked but /api/cases/2 returned Vercel's own 404 without
// ever invoking a function) - a platform routing quirk, not something in
// this code. server/vercel.json rewrites every /api/* request (any depth)
// to this fixed function instead, which sidesteps that entirely; Vercel
// preserves the original request path in req.url across a rewrite, so
// Express's own routing below still sees e.g. "/api/cases/2" as normal.
//
// DB readiness is handled inside app.js (see requireDb there), scoped to
// only the routes that actually need it — cors() must always run first and
// unconditionally, so it isn't gated on anything here.
export default function handler(req, res) {
  app(req, res);
}

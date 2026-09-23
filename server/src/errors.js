// Thrown by the service layer (services/*.js) so both the Express routes and
// any other caller (e.g. MCP tools) can decide how to surface a failure
// without duplicating the "is this a 404 or a 400" logic in each caller.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

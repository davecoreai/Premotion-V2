import app from '../dist/app/server/server.mjs';

export default function handler(req, res) {
  return app(req, res);
}

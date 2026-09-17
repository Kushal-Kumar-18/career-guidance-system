const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { limiters } = require('./middleware/rateLimit');
const env = require('./config/env');

const app = express();

// Number of proxy hops to trust (nginx in the EC2 deployment). Without
// this, req.ip is the proxy's address and every rate-limit bucket would
// be shared by all users behind it.
app.set('trust proxy', env.trustProxyHops);

app.use(helmet({ crossOriginResourcePolicy: false }));
// Locked to specific origins in production via CORS_ALLOWED_ORIGINS
// (comma-separated, e.g. the S3 static-site/CloudFront URL); wide open
// in local dev where no origins are configured. See docs/AWS_ARCHITECTURE.md.
app.use(
  cors(
    env.corsAllowedOrigins.length
      ? {
          origin: env.corsAllowedOrigins,
          credentials: true,
          // The resume download route streams the PDF with a filename in
          // Content-Disposition; the browser can't read that header
          // cross-origin unless it's explicitly exposed.
          exposedHeaders: ['Content-Disposition'],
        }
      : undefined
  )
);
app.use(express.json());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// NOTE: there is deliberately NO static file route here.
//
// Generated resume PDFs used to be exposed at /files via
// express.static(LOCAL_STORAGE_PATH). That made every stored resume
// readable by anyone who could guess or observe the path
// (`/files/resumes/user-<id>.pdf` — trivially enumerable), with no
// authentication and no ownership check. Resumes are personal data, so
// they are now served exclusively by the authenticated, ownership-checked
// route GET /api/resume/download (see routes/resume.routes.js and
// services/resumeService.js). Do not reintroduce a static mount here.

// Blanket backstop across the whole API; per-route buckets are applied
// inside the individual route files (see middleware/rateLimit.js).
app.use('/api', limiters.global, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

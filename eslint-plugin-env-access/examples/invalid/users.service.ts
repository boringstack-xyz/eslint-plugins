// no-direct-process-env: bypasses the validated singleton
const port = process.env.PORT;

// no-direct-process-env: destructure form
const { DATABASE_URL, JWT_SECRET } = process.env;

// no-direct-process-env: write
process.env.NODE_ENV = "test";

void port;
void DATABASE_URL;
void JWT_SECRET;

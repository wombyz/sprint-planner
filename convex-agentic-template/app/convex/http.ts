/**
 * HTTP Routes
 *
 * Configures HTTP endpoints for authentication.
 * This file is REQUIRED for Convex Auth to work.
 * Without it, auth routes won't be exposed and login/signup will fail.
 */

import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;

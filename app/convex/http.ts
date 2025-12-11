/**
 * HTTP Routes
 *
 * Configures HTTP endpoints for authentication.
 */

import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;

/**
 * Authentication Configuration
 *
 * Configures Convex Auth with the Password provider.
 *
 * IMPORTANT: Uses named import for Password provider.
 * Wrong: import Password from "@convex-dev/auth/providers/Password";
 * Correct: import { Password } from "@convex-dev/auth/providers/Password";
 */

import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

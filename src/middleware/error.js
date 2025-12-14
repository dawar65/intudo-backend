/**
 * Intudo Backend — Error Handling Middleware
 *
 * Purpose:
 * - Catch ALL backend errors (sync + async)
 * - Never crash the server
 * - ALWAYS return a valid Intudo response shape
 *
 * This file is intentionally verbose and defensive.
 * The Chrome extension depends on this behavior.
 */

/**
 * Central error handler
 * Must be the LAST middleware registered.
 */
export function errorHandler(err, req, res, next) {
  try {
    console.error("[Intudo Error]", err?.message || err);
    if (err?.stack) {
      console.error(err.stack);
    }

    // IMPORTANT:
    // Always return HTTP 200 with a safe response shape
    // Extensions break if unexpected status codes appear
    res.status(200).json({
      result: {
        transcript: "",
        cleaned_intent: "An error occurred while processing your request.",
        final_prompt: "Please try again with a clearer recording.",
        intent_type: "clarification",
        confidence: 0.1
      }
    });
  } catch (fatalError) {
    // Absolute last-resort fallback (should never happen)
    console.error("[Fatal Error Handler Failure]", fatalError);

    res.status(200).json({
      result: {
        transcript: "",
        cleaned_intent: "A system error occurred.",
        final_prompt: "Please try again.",
        intent_type: "clarification",
        confidence: 0.05
      }
    });
  }
}

/**
 * Async route wrapper
 * Usage:
 *   router.post("/route", asyncHandler(async (req, res) => { ... }))
 *
 * Ensures rejected promises are forwarded to errorHandler
 */
export function asyncHandler(fn) {
  return function wrappedAsyncHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

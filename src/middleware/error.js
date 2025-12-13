/**
 * Intudo Backend - Error Handling Middleware
 * Ensures API always returns valid response shape
 */

/**
 * Central error handler
 * Catches all errors and returns safe response
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);
  console.error(err.stack);

  // Always return the expected response shape
  // The extension depends on this format
  res.status(200).json({
    result: {
      transcript: '',
      cleaned_intent: 'An error occurred while processing your request.',
      final_prompt: 'Please try again with a clearer recording.',
      intent_type: 'clarification',
      confidence: 0.1,
    },
  });
}

/**
 * Async route wrapper to catch promise rejections
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

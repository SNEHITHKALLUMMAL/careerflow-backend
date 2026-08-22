/**
 * Wraps an async Express route/controller so any rejected promise or thrown
 * error is forwarded to next(), instead of needing a try/catch in every
 * single controller.
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

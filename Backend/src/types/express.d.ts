// Augment Express Request to include `user` property.
// Use inline import type to avoid turning this file into a non-ambient module
// which can prevent declaration merging from working as expected.

declare global {
  namespace Express {
    interface Request {
      user?: import('../models/User').UserType;
    }
  }
}

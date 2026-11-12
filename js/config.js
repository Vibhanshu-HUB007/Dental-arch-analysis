/**
 * config.js — Site configuration
 *
 * To change the password:
 * 1. Open hash-generator.html in your browser
 * 2. Enter your new password and click "Generate Hash"
 * 3. Copy the hash and replace the value of PASSWORD_HASH below
 * 4. Save and redeploy to GitHub Pages
 *
 * Default password: dental2024
 */

const SITE_CONFIG = {
  // SHA-256 hash of the site password
  // Password is: web@123
  PASSWORD_HASH: '2d5e94deb8ba3012013e1627f5fd37d994708d0f0918964b8fba68184f07d1d0',

  // Session token key in sessionStorage
  SESSION_KEY: 'dental_arch_auth',

  // Session token value (arbitrary string checked for presence)
  SESSION_TOKEN: 'authenticated_v1',

  // Site title
  SITE_TITLE: 'Dental Arch Analysis Using AI',

  // Path prefix to STL files (relative to HTML pages)
  STL_BASE_PATH: 'Dataset/AnyConv.com__',
  STL_SUFFIX: '_upper.stl'
};

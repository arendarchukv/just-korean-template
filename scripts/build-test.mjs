// The build the checks run against: the production build plus the developer styleguide
// (/styleguide/), which the browser tests and check:dist use. Cross-platform: no env syntax in npm.
import { build } from 'astro';

process.env.JK_STYLEGUIDE = '1';
await build({});

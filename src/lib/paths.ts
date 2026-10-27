// Where the site's records live. SITE_DATA points a build at another tree;
// the build tests use tests/fixtures/data so they don't depend on real listings.
export const DATA_DIR = process.env.SITE_DATA ?? './data';

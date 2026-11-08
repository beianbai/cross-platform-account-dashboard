import test from 'node:test';
import assert from 'node:assert/strict';
import * as builder from '../extension/build-safari.mjs';

test('Safari project normalization repairs the packager parent identifier while preserving the embedded extension identity', () => {
  const current = '"PRODUCT_BUNDLE_IDENTIFIER": "com.beianbai.Account-Dashboard-Safari",\n"PRODUCT_BUNDLE_IDENTIFIER": "com.beianbai.accountdashboard.Extension",';
  const legacy = 'PRODUCT_BUNDLE_IDENTIFIER = "com.beianbai.Account-Dashboard-Safari";\nPRODUCT_BUNDLE_IDENTIFIER = com.beianbai.accountdashboard.Extension;';
  assert.equal(typeof builder.normalizeSafariBundleIdentifiers, 'function');
  assert.equal(builder.normalizeSafariBundleIdentifiers(current, 'com.beianbai.accountdashboard'), '"PRODUCT_BUNDLE_IDENTIFIER": "com.beianbai.accountdashboard",\n"PRODUCT_BUNDLE_IDENTIFIER": "com.beianbai.accountdashboard.Extension",');
  assert.equal(builder.normalizeSafariBundleIdentifiers(legacy, 'com.beianbai.accountdashboard'), 'PRODUCT_BUNDLE_IDENTIFIER = "com.beianbai.accountdashboard";\nPRODUCT_BUNDLE_IDENTIFIER = com.beianbai.accountdashboard.Extension;');
  assert.throws(() => builder.normalizeSafariBundleIdentifiers('unexpected project format', 'com.beianbai.accountdashboard'), /无法识别/);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { getIntegrityStatus } from './integrityStatus.js';

test('returns checking while provision status is still loading', () => {
  assert.deepEqual(getIntegrityStatus(null), {
    state: 'CHECKING',
    isHealthy: null,
  });
});

test('returns optimal when both provision flags are present and true', () => {
  assert.deepEqual(
    getIntegrityStatus({
      ls_core_exists: true,
      cert_pem_exists: true,
    }),
    {
      state: 'OPTIMAL',
      isHealthy: true,
    }
  );
});

test('returns degraded when any required asset is missing', () => {
  assert.deepEqual(
    getIntegrityStatus({
      ls_core_exists: true,
      cert_pem_exists: false,
    }),
    {
      state: 'DEGRADED',
      isHealthy: false,
    }
  );
});

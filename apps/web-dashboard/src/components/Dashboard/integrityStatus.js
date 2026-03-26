export function getIntegrityStatus(provision) {
  const hasResolvedProvision =
    provision &&
    typeof provision.ls_core_exists === 'boolean' &&
    typeof provision.cert_pem_exists === 'boolean';

  if (!hasResolvedProvision) {
    return {
      state: 'CHECKING',
      isHealthy: null,
    };
  }

  const isHealthy = provision.ls_core_exists && provision.cert_pem_exists;

  return {
    state: isHealthy ? 'OPTIMAL' : 'DEGRADED',
    isHealthy,
  };
}

export function assertContext(context, requiredKeys, scope) {
  const missing = requiredKeys.filter(key => context[key] === undefined || context[key] === null);
  if (missing.length) {
    throw new TypeError(`${scope}: missing context dependencies: ${missing.join(', ')}`);
  }
}

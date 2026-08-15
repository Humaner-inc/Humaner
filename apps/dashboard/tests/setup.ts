/**
 * Tests must never reach a real database, Redis, or Polar. Anything that needs
 * one of those mocks it explicitly; this only pins the environment so a missing
 * variable cannot make an assertion pass by accident.
 */
process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'cloud';
delete process.env.DATABASE_URL;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

process.env.NEXT_PUBLIC_DEPLOYMENT_MODE = 'cloud';
delete process.env.DATABASE_URL;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis replaced by SQLite refresh_tokens table.
// This file is kept as a no-op shim so existing imports don't break.

const redisShim = {
    setEx: async (_key: string, _ttl: number, _value: string) => { },
    get: async (_key: string): Promise<string | null> => null,
    del: async (_key: string) => { },
};

export default redisShim;

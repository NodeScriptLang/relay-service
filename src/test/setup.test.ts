import assert from 'assert';

import { runtime } from './runtime.js';

describe('/relay', () => {
    beforeEach(() => runtime.setup());
    afterEach(() => runtime.teardown());

    it('relays POST with body', async () => {
        runtime.testHttpServer.requestHandler = async (req, res) => {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const body = Buffer.concat(chunks).toString();
            assert.strictEqual(body, 'Hello World!');
            res.writeHead(200, {});
            res.end();
        };
        const res = await fetch(runtime.baseUrl + '/relay', {
            method: 'POST',
            headers: {
                'x-fetch-method': 'POST',
                'x-fetch-url': 'http://127.0.0.1:8099/foo',
                'x-fetch-headers': JSON.stringify({
                    'Content-Type': 'text/plain',
                })
            },
            body: 'Hello World!',
        });
        assert.strictEqual(res.status, 200);
    });

});

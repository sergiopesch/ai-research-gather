import { describe, expect, it } from 'vitest';
import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { ProxyOptions } from 'vite';
import createConfig from '../vite.config.js';

describe('development proxy access boundary', () => {
  it('binds locally and preserves the host', () => {
    const config = createConfig({ command: 'serve', mode: 'development' });
    expect(config.server?.host).toBe('127.0.0.1');
    expect((config.server?.proxy?.['/api'] as ProxyOptions).changeOrigin).toBe(false);
  });

  it('marks non-loopback clients with their actual address', () => {
    const config = createConfig({ command: 'serve', mode: 'development' });
    const options = config.server?.proxy?.['/api'] as ProxyOptions;
    const proxy = new EventEmitter();
    options.configure?.(proxy as Parameters<NonNullable<ProxyOptions['configure']>>[0], options);
    const headers: Record<string, string> = {};
    const proxyRequest = { setHeader: (name: string, value: string) => { headers[name] = value; } };
    proxy.emit('proxyReq', proxyRequest, { socket: { remoteAddress: '203.0.113.9' } } as IncomingMessage);
    expect(headers['x-forwarded-for']).toBe('203.0.113.9');
    delete headers['x-forwarded-for'];
    proxy.emit('proxyReq', proxyRequest, { socket: { remoteAddress: '127.0.0.1' } } as IncomingMessage);
    expect(headers['x-forwarded-for']).toBeUndefined();
  });
});

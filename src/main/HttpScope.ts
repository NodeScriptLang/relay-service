import { Mesh } from 'mesh-ioc';

import { AiDomainImpl } from './scoped/ai/AiDomainImpl.js';
import { AuthContext } from './scoped/AuthContext.js';
import { HttpAuthHandler } from './scoped/HttpAuthHandler.js';
import { MainHttpHandler } from './scoped/MainHttpHandler.js';
import { NodeScriptApi } from './scoped/NodeScriptApi.js';
import { RelayProtocolHandler } from './scoped/RelayProtocolHandler.js';
import { RelayProtocolImpl } from './scoped/RelayProtocolImpl.js';

export class HttpScope extends Mesh {

    constructor(parent: Mesh) {
        super('HttpScope', parent);
        this.service(AuthContext);
        this.service(AiDomainImpl);
        this.service(RelayProtocolImpl);
        this.service(RelayProtocolHandler);
        this.service(HttpAuthHandler);
        this.service(MainHttpHandler);
        this.service(NodeScriptApi);
    }

}

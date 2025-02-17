import { Mesh } from 'mesh-ioc';

import { AuthContext } from './scoped/AuthContext.js';
import { HttpAuthHandler } from './scoped/HttpAuthHandler.js';
import { MainHttpHandler } from './scoped/MainHttpHandler.js';
import { NodeScriptApi } from './scoped/NodeScriptApi.js';
import { RelayHandler } from './scoped/RelayHandler.js';

export class HttpScope extends Mesh {

    constructor(parent: Mesh) {
        super('HttpScope', parent);
        this.service(AuthContext);
        this.service(HttpAuthHandler);
        this.service(RelayHandler);
        this.service(MainHttpHandler);
        this.service(NodeScriptApi);
    }

}

import { Mesh } from 'mesh-ioc';

import { AuthContext } from './scoped/AuthContext.js';
import { HttpAuthHandler } from './scoped/HttpAuthHandler.js';
import { MainHttpHandler } from './scoped/MainHttpHandler.js';
import { NodeScriptApi } from './scoped/NodeScriptApi.js';
import { RelayHandler } from './scoped/RelayHandler.js';
import { AnthropicService } from './services/AnthropicService.js';
import { DeepseekService } from './services/DeepseekService.js';
import { GeminiService } from './services/GeminiService.js';
import { OpenaAiService } from './services/OpenaAiService.js';

export class HttpScope extends Mesh {

    constructor(parent: Mesh) {
        super('HttpScope', parent);
        this.service(AuthContext);
        this.service(HttpAuthHandler);
        this.service(RelayHandler);
        this.service(MainHttpHandler);
        this.service(NodeScriptApi);
        this.service(OpenaAiService);
        this.service(AnthropicService);
        this.service(GeminiService);
        this.service(DeepseekService);
    }

}

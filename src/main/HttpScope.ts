import { Mesh } from 'mesh-ioc';

import { AuthContext } from './scoped/AuthContext.js';
import { HttpAuthHandler } from './scoped/HttpAuthHandler.js';
import { MainHttpHandler } from './scoped/MainHttpHandler.js';
import { NodeScriptApi } from './scoped/NodeScriptApi.js';
import { RelayHandler } from './scoped/RelayHandler.js';
import { AnthropicLlmService } from './services/llm/AnthropicLlmService.js';
import { DeepseekLlmService } from './services/llm/DeepseekLlmService.js';
import { GeminiLlmService } from './services/llm/GeminiLlmService.js';
import { LlmService } from './services/llm/LlmService.js';
import { OpenaAiLlmService } from './services/llm/OpenaAiLlmService.js';

export class HttpScope extends Mesh {

    constructor(parent: Mesh) {
        super('HttpScope', parent);
        this.service(AuthContext);
        this.service(HttpAuthHandler);
        this.service(RelayHandler);
        this.service(MainHttpHandler);
        this.service(NodeScriptApi);
        this.service(LlmService, OpenaAiLlmService);
        this.service(LlmService, AnthropicLlmService);
        this.service(LlmService, GeminiLlmService);
        this.service(LlmService, DeepseekLlmService);
    }

}

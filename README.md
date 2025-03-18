# Relay Service

Acts as a proxy for authorising NodeScript Libraries high level modules and usage tracking with external APIs. E.g. OpenAI, Gemini, Anthropic, etc.

### Local dev:

1. Create/update `.env.dev` file with your configuration:

```
LOG_PRETTY=true
NODESCRIPT_API_URL=http://localhost:32001
HTTP_PORT=3000
AUX_HTTP_PORT=3001
LLM_OPENAI_API_KEY=<key>
LLM_ANTHROPIC_API_KEY=<key>
LLM_GEMINI_API_KEY=<key>
LLM_DEEPSEEK_API_KEY=<key>
LLM_PRICE_PER_CREDIT=<price>
JWT_PUBLIC_KEY=<key>
```

Replace the LLM Service Providers API Keys with your own.
JWT_PUBLIC_KEY is the public key for the JWT token. You can get this by accessing `relay-secrets.yaml` in the `infrastructure` repo.

### Production:

For production, we set the CONFIG environment variable as a secret in `relay-secrets.yaml` and we use Sops for encryption. For more info on Sops. Check out the `infrastructure` repo [README.md](https://github.com/NodeScriptLang/infrastructure/blob/main/README.md)

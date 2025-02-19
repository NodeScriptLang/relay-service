# Relay Service

Acts as a proxy for authorising NodeScript Libraries high level modules and usage tracking with external APIs. E.g. OpenAI, Gemini, Anthropic, etc.

### Local dev:

1. Create/update `.env.dev` file with your configuration:

```
LOG_PRETTY=true
NODESCRIPT_API_URL=http://localhost:32001
HTTP_PORT=3000
AUX_HTTP_PORT=3001
CONFIG='{
    "<module title lowercase>": {
        "id": "<module title lowercase>",
        "title": "<module title uppercase>",
        "baseUrl": "<base api url>",
        "version": "v1",
        "authSchema": "header",
        "key": "<key>"
    }
}'
```

Example config:
```
CONFIG='{
    "openai": {
        "id": "openai",
        "title": "OpenAI",
        "baseUrl": "https://api.openai.com/",
        "version": "v1",
        "authSchema": "header",
        "key": "your-api-key"
    }
}'
```

### Production:

For production, we set the CONFIG environment variable as a secret in `relay-secrets.yaml` and we use Sops for encryption. For more info on Sops. Check out the `infrastructure` repo README.md

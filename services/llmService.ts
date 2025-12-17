import { GoogleGenAI } from "@google/genai";

export type LLMProvider = 'gemini' | 'openai' | 'xai' | 'perplexity';
export type TaskComplexity = 'FAST' | 'STANDARD' | 'COMPLEX' | 'RESEARCH';

interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey: string;
}

const API_KEYS = {
    gemini: (import.meta.env.VITE_GEMINI_API_KEY || '').trim(),
    openai: (import.meta.env.VITE_OPENAI_API_KEY || '').trim(),
    xai: (import.meta.env.VITE_XAI_API_KEY || '').trim(),
    perplexity: (import.meta.env.VITE_PERPLEXITY_API_KEY || '').trim(),
};

const PROVIDER_MODELS = {
    gemini: {
        FAST: 'gemini-2.5-flash-lite-preview-02-05',
        STANDARD: 'gemini-2.5-flash',
        COMPLEX: 'gemini-3-pro-preview',
        RESEARCH: 'gemini-2.5-flash',
    },
    openai: {
        FAST: 'gpt-4.1-nano',
        STANDARD: 'gpt-4.1-mini',
        COMPLEX: 'gpt-5.2',
        RESEARCH: 'gpt-4.1',
    },
    xai: {
        FAST: 'grok-3-mini',
        STANDARD: 'grok-3',
        COMPLEX: 'grok-4.1',
        RESEARCH: 'grok-3',
    },
    perplexity: {
        FAST: 'sonar',
        STANDARD: 'sonar-pro',
        COMPLEX: 'sonar-reasoning-pro',
        RESEARCH: 'sonar-deep-research',
    },
};

const PROVIDER_BASE_URLS: Record<LLMProvider, string> = {
    gemini: '', 
    openai: 'https://api.openai.com/v1',
    xai: 'https://api.x.ai/v1',
    perplexity: 'https://api.perplexity.ai',
};

export const getAvailableProviders = (): LLMProvider[] => {
    const available: LLMProvider[] = [];
    if (API_KEYS.gemini) available.push('gemini');
    if (API_KEYS.openai) available.push('openai');
    if (API_KEYS.xai) available.push('xai');
    if (API_KEYS.perplexity) available.push('perplexity');
    return available;
};

export const getModelForTask = (provider: LLMProvider, complexity: TaskComplexity): string => {
    return PROVIDER_MODELS[provider]?.[complexity] || PROVIDER_MODELS.gemini[complexity];
};

export const getGeminiClient = (apiKeyOverride?: string) => {
    const key = (apiKeyOverride && apiKeyOverride.trim().length > 0) ? apiKeyOverride : API_KEYS.gemini;
    return new GoogleGenAI({ apiKey: key });
};

export const callOpenAICompatibleAPI = async (
    provider: LLMProvider,
    model: string,
    messages: Array<{role: string; content: string}>,
    options: {
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: string };
    } = {}
): Promise<string> => {
    const apiKey = API_KEYS[provider];
    const baseUrl = PROVIDER_BASE_URLS[provider];
    
    if (!apiKey) {
        throw new Error(`API key not configured for provider: ${provider}`);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 4096,
            ...(options.response_format && { response_format: options.response_format }),
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`${provider} API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
};

export const callPerplexityResearch = async (
    query: string,
    options: {
        model?: string;
        search_recency_filter?: string;
    } = {}
): Promise<{ answer: string; citations: string[] }> => {
    const apiKey = API_KEYS.perplexity;
    
    if (!apiKey) {
        throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: options.model || 'sonar-pro',
            messages: [{ role: 'user', content: query }],
            search_recency_filter: options.search_recency_filter || 'week',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
        answer: data.choices[0]?.message?.content || '',
        citations: data.citations || [],
    };
};

export const selectBestProvider = (
    complexity: TaskComplexity,
    preferredProvider?: LLMProvider
): { provider: LLMProvider; model: string } => {
    const available = getAvailableProviders();
    
    if (available.length === 0) {
        throw new Error('No LLM providers configured. Please add API keys.');
    }

    if (complexity === 'RESEARCH' && available.includes('perplexity')) {
        return { provider: 'perplexity', model: getModelForTask('perplexity', 'RESEARCH') };
    }

    if (preferredProvider && available.includes(preferredProvider)) {
        return { provider: preferredProvider, model: getModelForTask(preferredProvider, complexity) };
    }

    if (complexity === 'COMPLEX') {
        if (available.includes('openai')) {
            return { provider: 'openai', model: getModelForTask('openai', 'COMPLEX') };
        }
        if (available.includes('xai')) {
            return { provider: 'xai', model: getModelForTask('xai', 'COMPLEX') };
        }
    }

    const defaultProvider = available[0];
    return { provider: defaultProvider, model: getModelForTask(defaultProvider, complexity) };
};

export const multiLLMChat = async (
    messages: Array<{role: string; content: string}>,
    options: {
        complexity?: TaskComplexity;
        provider?: LLMProvider;
        jsonMode?: boolean;
    } = {}
): Promise<string> => {
    const complexity = options.complexity || 'STANDARD';
    const { provider, model } = selectBestProvider(complexity, options.provider);

    if (provider === 'gemini') {
        const ai = getGeminiClient();
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: options.jsonMode ? { responseMimeType: 'application/json' } : undefined,
        });
        
        return response.text || '';
    }

    return callOpenAICompatibleAPI(provider, model, messages, {
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    });
};

export { API_KEYS, PROVIDER_MODELS, PROVIDER_BASE_URLS };

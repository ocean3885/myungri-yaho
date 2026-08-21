export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
export const DEEPSEEK_MODEL = 'deepseek-v4-pro';

export const DEEPSEEK_MODELS = [
    {
        id: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        description: '고성능 모델',
    },
    {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        description: '빠르고 경제적인 모델',
    },
] as const;

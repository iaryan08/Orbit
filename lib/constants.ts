export type MoodType = 'happy' | 'loved' | 'excited' | 'calm' | 'sad' | 'anxious' | 'tired' | 'grateful' | 'flirty' | 'teasing' | 'needy' | 'touchy' | 'cuddly' | 'romantic' | 'turned on' | 'craving you' | 'affectionate' | 'playful naughty' | 'feeling desired' | 'miss you badly'

export const MOOD_EMOJIS: Record<MoodType, string> = {
    happy: '😊',
    loved: '🥰',
    excited: '🤩',
    calm: '😌',
    sad: '😢',
    anxious: '😰',
    tired: '😴',
    grateful: '🙏',
    flirty: '😏',
    teasing: '😉',
    needy: '🥺',
    touchy: '🤍',
    cuddly: '🫂',
    romantic: '🌹',
    'turned on': '🔥',
    'craving you': '💋',
    affectionate: '💞',
    'playful naughty': '😈',
    'feeling desired': '✨',
    'miss you badly': '💭'

}

export const MOOD_COLORS: Record<MoodType, string> = {
    happy: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    loved: 'bg-pink-100 border-pink-300 text-pink-800',
    excited: 'bg-orange-100 border-orange-300 text-orange-800',
    calm: 'bg-blue-100 border-blue-300 text-blue-800',
    sad: 'bg-slate-100 border-slate-300 text-slate-800',
    anxious: 'bg-purple-100 border-purple-300 text-purple-800',
    tired: 'bg-gray-100 border-gray-300 text-gray-800',
    grateful: 'bg-green-100 border-green-300 text-green-800',
    flirty: 'bg-pink-100 border-pink-300 text-pink-800',
    teasing: 'bg-orange-100 border-orange-300 text-orange-800',
    needy: 'bg-purple-100 border-purple-300 text-purple-800',
    touchy: 'bg-blue-100 border-blue-300 text-blue-800',
    cuddly: 'bg-pink-100 border-pink-300 text-pink-800',
    romantic: 'bg-red-100 border-red-300 text-red-800',
    'turned on': 'bg-red-100 border-red-300 text-red-800',
    'craving you': 'bg-red-100 border-red-300 text-red-800',
    affectionate: 'bg-pink-100 border-pink-300 text-pink-800',
    'playful naughty': 'bg-purple-100 border-purple-300 text-purple-800',
    'feeling desired': 'bg-yellow-100 border-yellow-300 text-yellow-800',
    'miss you badly': 'bg-blue-100 border-blue-300 text-blue-800',
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-v4-flash-vision-exp'

// 允许的图片格式与 MIME 类型（DeepSeek 会从内容检测，但 data URL 需要正确的 MIME 前缀）
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_SIZE = 32 * 1024 * 1024 // 32 MiB，DeepSeek inline 限制

interface RecipePayload {
  title: string
  ingredients: string[]
  mainIngredient?: string
  proteinTier?: 'main' | 'semi' | 'veg'
  cuisine?: string
  tags: string[]
  confidence: number
}

// 把前端可能传过来的各种主料写法归一化
const MAIN_INGREDIENTS = [
  'pork', 'beef', 'lamb', 'chicken', 'duck_goose',
  'fish', 'shellfish', 'egg', 'tofu', 'mushroom', 'leafy', 'other',
]

const MAIN_ALIASES: Record<string, string> = {
  猪: 'pork', 猪肉: 'pork', 排骨: 'pork', 五花肉: 'pork', 里脊: 'pork',
  牛: 'beef', 牛肉: 'beef', 牛腩: 'beef', 牛排: 'beef',
  羊: 'lamb', 羊肉: 'lamb',
  鸡: 'chicken', 鸡肉: 'chicken', 鸡翅: 'chicken', 鸡腿: 'chicken',
  鸭: 'duck_goose', 鸭肉: 'duck_goose', 鹅: 'duck_goose', 鹅肉: 'duck_goose',
  鱼: 'fish', 鱼肉: 'fish',
  虾: 'shellfish', 虾蟹贝: 'shellfish', 蟹: 'shellfish', 贝: 'shellfish', 海鲜: 'shellfish',
  蛋: 'egg', 鸡蛋: 'egg',
  豆制品: 'tofu', 豆腐: 'tofu', 豆干: 'tofu',
  菌菇: 'mushroom', 蘑菇: 'mushroom', 香菇: 'mushroom',
  叶菜: 'leafy', 青菜: 'leafy', 蔬菜: 'leafy',
}

function normalizeMainIngredient(value?: string): string | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (MAIN_INGREDIENTS.includes(v)) return v
  const mapped = MAIN_ALIASES[v] || MAIN_ALIASES[value.trim()]
  if (mapped) return mapped
  return 'other'
}

function normalizeProteinTier(value?: string): 'main' | 'semi' | 'veg' | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === 'main' || v.includes('荤') || v.includes('肉') || v === '主荤') return 'main'
  if (v === 'semi' || v.includes('半') || v === '半荤') return 'semi'
  if (v === 'veg' || v.includes('素') || v === '全素') return 'veg'
  return undefined
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  if (!DEEPSEEK_API_KEY) {
    return errorResponse('服务器未配置 DEEPSEEK_API_KEY', 500)
  }

  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return errorResponse('缺少图片或格式错误', 400)
    }

    // 去掉可能的前缀，得到纯 base64
    let cleanBase64 = imageBase64
    let mimeType = 'image/jpeg'
    const match = imageBase64.match(/^data:([a-zA-Z0-9+/\-]+);base64,/)
    if (match) {
      mimeType = match[1].toLowerCase()
      cleanBase64 = imageBase64.slice(match[0].length)
    }

    if (!ALLOWED_MIME.includes(mimeType)) {
      return errorResponse(`不支持的图片格式：${mimeType}，请用 JPEG/PNG/GIF/WebP`, 400)
    }

    // 校验 base64 大小（解码前大约 ×0.75 就是实际大小）
    const estimatedSize = Math.floor(cleanBase64.length * 0.75)
    if (estimatedSize > MAX_IMAGE_SIZE) {
      return errorResponse(`图片太大（${Math.round(estimatedSize / 1024 / 1024)}MB），请压缩到 32MB 以下`, 413)
    }

    const prompt = `这是一张小红书做菜笔记的截图。请仔细阅读图片中的文字和食材，提取菜谱信息并以 JSON 格式返回，不要任何解释，只返回 JSON：
{
  "title": "菜名",
  "ingredients": ["食材1", "食材2"],
  "mainIngredient": "主料分类，必须是以下之一：${MAIN_INGREDIENTS.join(', ')}",
  "proteinTier": "蛋白档位，必须是 main（主荤）/ semi（半荤）/ veg（素）之一",
  "cuisine": "菜系，如粤式/川式/日式/西式/家常/不详",
  "tags": ["标签1", "标签2"],
  "confidence": 0-1之间的数字
}
要求：
1. title 只返回菜名，不要包含"做法"、"教程"等词。
2. ingredients 列出主要食材，用量可选。
3. 如果看不清或不是菜谱，title 填"无法识别"，ingredients 为空数组，confidence 填 0。
4. 必须返回合法 JSON，不要 markdown 代码块。`

    const body = {
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${cleanBase64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }

    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('DeepSeek error:', err)
      return errorResponse(`DeepSeek 错误: ${err}`, 502)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    let parsed: Partial<RecipePayload>
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      console.error('JSON parse error:', content)
      return errorResponse('DeepSeek 返回不是合法 JSON', 502)
    }

    const normalized: RecipePayload = {
      title: parsed.title?.trim() || '无法识别',
      ingredients: Array.isArray(parsed.ingredients)
        ? parsed.ingredients.map((i) => String(i).trim()).filter(Boolean)
        : [],
      mainIngredient: normalizeMainIngredient(parsed.mainIngredient),
      proteinTier: normalizeProteinTier(parsed.proteinTier),
      cuisine: parsed.cuisine?.trim() || '不详',
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
    }

    return jsonResponse(normalized)
  } catch (e: any) {
    console.error('Edge function error:', e)
    return errorResponse(e.message || '内部错误', 500)
  }
})

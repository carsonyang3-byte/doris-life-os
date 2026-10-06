import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-v4-flash-vision-exp'

interface RecipePayload {
  title: string
  ingredients: string[]
  mainIngredient?: string
  proteinTier?: 'main' | 'semi' | 'veg'
  cuisine?: string
  tags: string[]
  confidence: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: '缺少图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const mainIngredients = [
      'pork', 'beef', 'lamb', 'chicken', 'duck_goose',
      'fish', 'shellfish', 'egg', 'tofu', 'mushroom', 'leafy', 'other'
    ]

    const prompt = `这是一张小红书做菜笔记的截图。请从图中提取信息并以JSON格式返回，不要任何解释：
{
  "title": "菜名",
  "ingredients": ["食材1", "食材2"],
  "mainIngredient": "主料分类，必须是以下之一：${mainIngredients.join(', ')}",
  "proteinTier": "蛋白档位，必须是 main（主荤）/ semi（半荤）/ veg（素）之一",
  "cuisine": "菜系，如粤式/川式/日式/西式/家常/不详",
  "tags": ["标签1", "标签2"],
  "confidence": 0-1之间的数字
}
如果看不清或不是菜谱，title填"无法识别"，ingredients为空数组。`

    const body = {
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
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
      return new Response(JSON.stringify({ error: `DeepSeek 错误: ${err}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(content) as RecipePayload

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || '内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})

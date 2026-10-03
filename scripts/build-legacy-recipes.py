# -*- coding: utf-8 -*-
"""
一次性脚本：把历史抗炎菜谱池转换成 Kitchen 模块的种子数据。

输入  C:/Users/carso/Documents/Claw/anti_inflammatory_recipes.json
输出  src/data/legacyRecipes.ts

处理内容：
  1. 按用户裁决的三份名单删除（川湘 19 / 合并丢弃 8 / 用户点名 63），共 90 条
  2. 繁体统一转简体
  3. 修正明显错误：错别字、protein 误标
  4. 映射到新字段：mainIngredient / proteinTier / isSoup / ingredients
不做任何主观筛选。
"""
import json
import re
import zhconv

SRC = r'C:/Users/carso/Documents/Claw/anti_inflammatory_recipes.json'
OUT = r'C:/Users/carso/Documents/projects/doris-life-os/src/data/legacyRecipes.ts'

# ---------- 删除名单（用户裁决） ----------
CX19 = "宫保鸡丁、麻婆豆腐、干锅莴笋、小炒鸡胸肉、香辣鸡胸肉、糖醋鸡胸肉、辣味牛肉凉拌小黄瓜、孜然土豆牛肉、小炒牛肉、醋溜白菜、麻辣凉拌包菜、干锅花菜、干锅西葫芦、脆皮糖醋豆腐、番茄鸡蛋油泼面、鱼香茄子、干锅土豆五花肉、盖码莴笋、胡辣莴笋"
MG8 = "茄汁汤面、番茄肥牛、番茄肉酱、6阶番茄炒蛋、白菜酿肉、蒸芹菜饼、法式胡萝卜炖牛肉、胡萝卜炒里脊肉"
U63 = "黃瓜翡翠羹、火燒雲油燜雞、家常黃燜雞、爛糊白菜、洋蔥拌木耳、涼拌黃瓜蝦滑、涼拌萵筍絲、香菜拌牛肉、蘿蔔牛肉煲、清燉牛肉、涼拌包菜、土豆燒包菜、番茄焖面、电饭煲番茄牛肉焖饭、牛肉蒸黄瓜条、胡萝卜蛋饼、莴笋菜饭、白菜炒土豆片、白菜荷包蛋、火腿白菜豆腐煲、一口酥豆腐、茄汁蛋黄浓汤面、鸡蛋番茄拌面、浇汁西兰花、白灼西兰花、鸡蛋西兰花豆腐羹、鸡胸肉蔬菜小饼、莴笋炒鸡丁、油焖大虾、口蘑汤、大虾烧白菜、凉拌洋葱、番茄虾滑汤、番茄肉酱面、清汤锅万能高汤做法（鸡蛋+猪肉）、茄子焖面、白菜肉卷、白菜三丝饼、东北鸡蛋酱、黄瓜鸡蛋卷、鸡蛋饼、鸡蛋焖面、鸡蛋蒜、酱鸡蛋、莲花洋葱（消耗洋葱！）、芹菜煎饼、土豆泥厚蛋烧、西葫芦鸡蛋饼、洋葱炒土豆、一只鸡蛋糕、热炒莴笋叶、莴笋泡菜、胡萝卜炒肉、芹菜蒸面卷、开胃莴笋叶、爽口腌莴笋、土豆烧牛腩、莴笋胡萝卜酿肉、莴笋三吃、虾肉茄子卷、微波炉版菌菇鸡肉焖饭、微波炉版番茄鸡蛋汤、微波炉版虾吃豆腐"

norm = lambda s: zhconv.convert((s or '').strip(), 'zh-cn')


def split_list(s):
    return [x.strip() for x in s.replace('\n', '、').split('、') if x.strip()]


DROP = set(norm(x) for x in split_list(CX19) + split_list(MG8) + split_list(U63))

# ---------- 主料映射 ----------
PROTEIN_MAP = [
    (r'羊', 'lamb'),
    (r'牛', 'beef'),
    (r'猪|豬|排骨|五花', 'pork'),
    (r'鴨|鸭|鵝|鹅', 'duck_goose'),
    (r'蛋', 'egg'),                      # 必须排在"鸡"之前，否则"鸡蛋"会被判成鸡肉
    (r'雞|鸡', 'chicken'),
    (r'三文|鮭|鲑|鱈|鳕|吞拿|金枪|鯖|鲭|鱸|鲈|鰻|鳗|魚|鱼', 'fish'),
    (r'蝦|虾|蟹|貝|贝|帶子|带子|蠔|蚝|蛤|蜆|蚬|魷|鱿|鮑|鲍', 'shellfish'),
    (r'豆腐|腐竹|豆干|豆類|豆类|豆', 'tofu'),
    (r'菇|菌|木耳', 'mushroom'),
    (r'菜心|芥蘭|芥兰|菠菜|生菜|白菜|通菜|油麥|油麦|甘藍|甘蓝|茼蒿|韭菜|芹菜', 'leafy'),
]

VEG_MAP = [
    (r'菇|菌|木耳', 'mushroom'),
    (r'菜心|芥蘭|芥兰|菠菜|生菜|白菜|通菜|油麥|油麦|甘藍|甘蓝|茼蒿|韭菜', 'leafy'),
]

MAIN_TIER = {'pork', 'beef', 'lamb', 'chicken', 'duck_goose', 'fish', 'shellfish'}
SEMI_TIER = {'egg', 'tofu'}


def to_main_ingredient(protein, veggie):
    """按原字段书写的先后顺序取第一个蛋白来源做主料，而不是按映射表顺序。"""
    for part in re.split(r'[,，/]', protein):
        part = part.strip()
        if not part or part in ('无', '無'):
            continue
        for pat, ing in PROTEIN_MAP:
            if re.search(pat, part):
                return ing
    # protein 字段为空或"无" → 落到蔬菜
    for pat, ing in VEG_MAP:
        if re.search(pat, veggie):
            return ing
    return 'other'


def to_protein_tier(main_ing, protein):
    if main_ing in MAIN_TIER:
        return 'main'
    if main_ing in SEMI_TIER:
        return 'semi'
    # 菌菇/叶菜/其他：protein 字段里若写了坚果、谷物、乳制品、杂豆，算次要蛋白
    if re.search(r'腰果|核桃|藜麦|燕麦|芝士|奶|坚果|扁豆|鹰嘴豆|豆', protein):
        return 'semi'
    return 'veg'


def clean_title(name):
    t = norm(name)
    t = t.replace('蜂胸', '鸡胸')          # 错别字：蒜香蜂胸扒 → 蒜香鸡胸扒
    t = t.replace('微波器版', '微波炉版')
    return t


def build_ingredients(protein, veggie):
    """原数据的 protein / veggie 就是食材字段，如实拆开使用，不做增补。"""
    out = []
    for raw in re.split(r'[,，]', f'{protein},{veggie}'):
        v = norm(raw).strip()
        if not v or v in ('无', '無', ''):
            continue
        if v not in out:
            out.append(v)
    return out


def main():
    d = json.load(open(SRC, encoding='utf-8'))
    keep = [x for x in d if norm(x.get('name', '')) not in DROP]

    seeds = []
    for x in keep:
        title = clean_title(x.get('name', ''))
        cuisine = norm(x.get('cuisine', ''))
        protein = norm(x.get('protein', ''))
        veggie = norm(x.get('veggie', ''))

        # protein 误标修正：菜名含"蛋"但 protein 写的是鸡/肉 → 改成鸡蛋
        if '蛋' in title and not re.search(r'蛋', protein) and re.search(r'雞|鸡|豬|猪', protein):
            protein = '鸡蛋'

        main_ing = to_main_ingredient(protein, veggie)
        tier = to_protein_tier(main_ing, protein)
        soup = bool(re.search(r'湯|汤|羹', title))
        ings = build_ingredients(protein, veggie)

        seeds.append({
            'title': title,
            'cuisine': cuisine,
            'mainIngredient': main_ing,
            'proteinTier': tier,
            'isSoup': soup,
            'ingredients': ings,
        })

    seeds.sort(key=lambda s: (s['cuisine'], s['title']))

    lines = [
        '// 本文件由 scripts/build-legacy-recipes.py 自动生成，请勿手改。',
        '// 来源：历史抗炎菜谱池，按用户裁决剔除 90 条后剩余的 135 道。',
        "import type { MainIngredient, ProteinTier } from '../types';",
        '',
        'export interface LegacyRecipeSeed {',
        '  title: string;',
        '  cuisine: string;',
        '  mainIngredient: MainIngredient;',
        '  proteinTier: ProteinTier;',
        '  isSoup: boolean;',
        '  ingredients: string[];',
        '}',
        '',
        f'export const LEGACY_RECIPES: LegacyRecipeSeed[] = [',
    ]
    for s in seeds:
        ings = ', '.join("'" + i.replace("'", "\\'") + "'" for i in s['ingredients'])
        lines.append(
            "  { title: '%s', cuisine: '%s', mainIngredient: '%s', proteinTier: '%s', isSoup: %s, ingredients: [%s] },"
            % (s['title'].replace("'", "\\'"), s['cuisine'], s['mainIngredient'], s['proteinTier'],
               'true' if s['isSoup'] else 'false', ings)
        )
    lines.append('];')
    lines.append('')

    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'源 {len(d)} 道 → 剔除 {len(DROP)} 条 → 输出 {len(seeds)} 道')
    print(f'写入 {OUT}')

    from collections import Counter
    print('\n主料分布:', dict(Counter(s['mainIngredient'] for s in seeds).most_common()))
    print('档位分布:', dict(Counter(s['proteinTier'] for s in seeds).most_common()))
    print('汤羹:', sum(1 for s in seeds if s['isSoup']))


if __name__ == '__main__':
    main()

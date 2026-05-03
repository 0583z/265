import requests
import json
import time

# 基础配置
# 注意：在 AI Studio 预览环境中，localhost 可能无法直接访问，建议使用完整 URL
BASE_URL = "localhost:3000" 
CHAT_API = f"{BASE_URL}/api/chat"
SYNC_API = f"{BASE_URL}/api/sync-competitions"

# 1. 采集到的权威 A 类赛事列表 (示例数据，可扩展)
competitions = [
    {
        "title": "中国国际“互联网+”大学生创新创业大赛",
        "category": "创新创业",
        "deadline": "2026-06-30",
        "link": "https://cy.ncss.cn/",
        "description": "教育部主办，中国创新创业第一大奖。团队人数限制为 2-15 人，面向在校及毕业5年内大学生。"
    },
    {
        "title": "“挑战杯”全国大学生课外学术科技作品竞赛",
        "category": "综合类",
        "deadline": "2026-04-15",
        "link": "http://www.tiaozhanbei.net/",
        "description": "当代大学生科技创新的“奥林匹克”。团队人数通常为 1-10 人，面向全日制在校大学生。"
    },
    {
        "title": "ACM-ICPC 国际大学生程序设计竞赛",
        "category": "算法/程序设计",
        "deadline": "2026-10-20",
        "link": "https://icpc.global/",
        "description": "全球最高水平算法竞赛。3人组队，限时5小时。面向具有学籍的在校本科生及研究生。"
    }
]

def generate_ai_strategy(comp_data):
    """
    通过调用本地 /api/chat 接口接入 DeepSeek 生成提分攻略
    """
    print(f"正在为竞赛生成攻略: {comp_data['title']}...")
    payload = {
        "rawText": comp_data['title'],
        "mode": "strategy"  # 切换到 api/chat.ts 中新支持的 strategy 模式
    }
    
    try:
        response = requests.post(CHAT_API, json=payload)
        if response.status_code == 200:
            return response.json().get('strategy', '暂无建议')
        else:
            print(f"AI 生成失败: {response.text}")
            return "AI 建议生成失败"
    except Exception as e:
        print(f"请求异常: {e}")
        return "请求 AI 接口异常"

def main():
    final_data = []
    
    # 2. 为每个比赛添加 AI 建议
    for comp in competitions:
        strategy = generate_ai_strategy(comp)
        # 兼容 backend 数据库字段
        comp_with_ai = {
            "name": comp['title'],
            "category": comp['category'],
            "deadline": comp['deadline'] + "T23:59:59",
            "registrationUrl": comp['link'],
            "description": comp['description'],
            "ai_suggestion": strategy,
            "level": "国家级"
        }
        final_data.append(comp_with_ai)
        time.sleep(1) # 频率限制保护
    
    # 3. 输出生成的完整数据
    print("\n--- 最终生成数据 (JSON) ---")
    print(json.dumps(final_data, ensure_ascii=False, indent=2))
    
    # 4. (可选) 写入文件供后续使用
    with open('enriched_competitions.json', 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=2)
    
    print("\n[成功] 完整资料已存入 enriched_competitions.json")

if __name__ == "__main__":
    main()

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from fastapi.middleware.cors import CORSMiddleware

# 🚀 启动指令：python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
app = FastAPI(title="Geek Hub AI Match Engine")

# 🚨 终极跨域配置：允许 React (3000端口) 的所有请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeekProfile(BaseModel):
    user_id: str
    username: str
    algorithm_score: float
    engineering_score: float
    product_score: float
    focus_hours: float

class MatchRequest(BaseModel):
    geeks: List[GeekProfile]

@app.get("/")
def read_root():
    return {"status": "online", "message": "Geek Hub AI Engine Active."}

@app.post("/api/v1/cluster_match")
async def cluster_geeks(request: MatchRequest):
    print(f"📡 [AI Engine] 收到聚类请求！当前待匹配人数: {len(request.geeks)}")
    
    geeks = request.geeks
    if len(geeks) < 2:
        return {
            "status": "success", 
            "clusters": {"探索者星系": [{"user_id": g.user_id, "username": g.username} for g in geeks]}
        }
    
    # 1. 特征提取 (欧氏空间向量构建)
    # 维度顺序：[算法, 工程, 产品, 专注时长]
    features = np.array([[g.algorithm_score, g.engineering_score, g.product_score, g.focus_hours] for g in geeks])
    
    # 2. 🚀 特征缩放 (StandardScaler) & 权重赋能 (Weight Vector)
    # 赋予特定维度更高的决策权：算法 1.5倍，工程 1.2倍，产品 1.0倍，时长 0.8倍
    weights = np.array([1.5, 1.2, 1.0, 0.8])
    
    # 先做 Z-Score 标准化消除量纲差异，再通过矩阵乘法注入权重
    scaled_weighted_features = StandardScaler().fit_transform(features) * weights
    
    # 3. 动态聚类 (K-Means++)
    n_clusters = min(3, len(geeks))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto")
    
    # 将加权后的新特征矩阵喂给算法
    labels = kmeans.fit_predict(scaled_weighted_features)
    
    # 4. 星系映射逻辑
    galaxy_names = {0: "🌌 算法原力星系", 1: "🛠️ 架构铸造星系", 2: "🧭 商业引航星系"}
    results = {}
    
    for i, geek in enumerate(geeks):
        label = labels[i]
        g_name = galaxy_names.get(label, "🌀 混沌星系")
        if g_name not in results: results[g_name] = []
        results[g_name].append({"user_id": geek.user_id, "username": geek.username})
    
    print(f"✅ [AI Engine] 聚类完成，共划分至 {len(results)} 个星系")
    return {"status": "success", "clusters": results}
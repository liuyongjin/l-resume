FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 国内服务器构建可设: --build-arg PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ARG PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple

COPY backend-agent-python/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    -i "${PIP_INDEX_URL}" \
    --trusted-host pypi.org --trusted-host files.pythonhosted.org \
    --trusted-host pypi.tuna.tsinghua.edu.cn --trusted-host mirrors.aliyun.com

COPY backend-agent-python/src ./src
COPY backend-nest/config/llm-models.json ./config/llm-models.json

RUN mkdir -p logs

EXPOSE 5001

CMD ["python", "src/main.py"]

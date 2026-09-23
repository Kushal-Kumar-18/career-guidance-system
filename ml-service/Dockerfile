# Not build-tested in this sandbox (no Docker daemon available here) —
# see README "Known limitations".
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
# python:3.11-slim has no curl; urllib is stdlib so this needs no extra
# package. Hits this service's own GET /health (model_loaded + storage
# status — see app/main.py), same reasoning as backend's HEALTHCHECK.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).status==200 else 1)" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

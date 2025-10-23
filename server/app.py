from flask import Flask, request, jsonify, send_from_directory, abort
import os
from tasks import process_url_task, celery
from celery.result import AsyncResult

app = Flask(__name__, static_folder="static")

@app.route("/api/process-url", methods=["POST"])
def api_process_url():
    data = request.get_json() or {}
    url = data.get("url")
    if not url:
        return jsonify({"error":"missing url"}), 400
    render = bool(data.get("render", False))
    task = process_url_task.delay(url, render)
    return jsonify({"ok": True, "task_id": task.id}), 202

@app.route("/api/job/<task_id>", methods=["GET"])
def api_job_status(task_id):
    res = AsyncResult(task_id, app=celery)
    if res.state == "PENDING":
        return jsonify({"status": "pending"}), 202
    if res.state in ("STARTED", "RETRY"):
        return jsonify({"status": res.state}), 202
    if res.state == "FAILURE":
        return jsonify({"status":"failure", "error": str(res.result)}), 500
    # READY
    try:
        result = res.get(timeout=1)
    except Exception as e:
        return jsonify({"status":"error", "error": str(e)}), 500
    return jsonify({"status":"done", "result": result})

# static files served from server/static
@app.route("/static/uploads/<path:filename>")
def static_uploads(filename):
    root = os.path.join(os.path.dirname(__file__), "static", "uploads")
    if not os.path.exists(os.path.join(root, filename)):
        abort(404)
    return send_from_directory(root, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    # https://www.amazon.com/MAGCOMSEN-Cotton-Pocket-Lightweight-Relaxed/dp/B0C7GHSG9F/ref=sr_1_3_sspa?sr=8-3-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1
# curl -X POST http://localhost:5000/api/process-url \
# -H "Content-Type: application/json" \
# -d '{"url":"https://www.amazon.com/MAGCOMSEN-Cotton-Pocket-Lightweight-Relaxed/dp/B0C7GHSG9F/ref=sr_1_3_sspa?sr=8-3-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1","render":false"}'
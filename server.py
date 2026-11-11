"""Local-only development server with same-origin DeepSeek API proxy."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import ipaddress
import json
import secrets
import threading
from ai import AIError, interpret, load_env

ROOT = Path(__file__).parent
TOKEN = secrets.token_urlsafe(32)
BUSY = threading.BoundedSemaphore(1)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'static'), **kwargs)

    def allowed(self):
        host = self.headers.get('Host', '')
        try:
            hostname = urlsplit('http://' + host).hostname
            if hostname != 'localhost':
                ipaddress.ip_address(hostname)
        except (ValueError, TypeError):
            return False
        origin = self.headers.get('Origin')
        return not origin or origin in {'http://' + host, 'https://' + host}

    def respond(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.allowed():
            return self.respond(403, {'error': '请使用本机或局域网 IP 访问。'})
        if self.path == '/api/config':
            import os
            key = os.environ.get('DEEPSEEK_API_KEY', '').strip()
            return self.respond(200, {'csrf_token': TOKEN, 'configured': bool(key and key != 'your_deepseek_api_key_here')})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/interpret':
            return self.respond(404, {'error': '接口不存在。'})
        if not self.allowed() or not secrets.compare_digest(self.headers.get('X-CSRF-Token', ''), TOKEN):
            return self.respond(403, {'error': '页面验证失效，请刷新后重试。'})
        if self.headers.get_content_type() != 'application/json':
            return self.respond(415, {'error': '需要 JSON 格式。'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 200_000:
                return self.respond(413, {'error': '请求过大或为空。'})
            data = json.loads(self.rfile.read(length))
        except (ValueError, UnicodeError):
            return self.respond(400, {'error': '请求格式错误。'})
        if not BUSY.acquire(blocking=False):
            return self.respond(429, {'error': '正在生成上一条解读，请稍后再试。'})
        try:
            self.respond(200, interpret(data))
        except AIError as error:
            self.respond(error.status, {'error': str(error)})
        except Exception:
            self.respond(500, {'error': '服务发生错误，请稍后重试。'})
        finally:
            BUSY.release()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    load_env()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f'Mirror Arcana: http://{args.host}:{args.port}', flush=True)
    server.serve_forever()

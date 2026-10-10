#!/usr/bin/env bash
set -Eeuo pipefail
image=${1:?image required}
revision=${2:?revision required}
certs=$(mktemp -d)
name="kratos-frontend-smoke-$RANDOM"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$certs"' EXIT
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj '/CN=localhost' \
  -keyout "$certs/server.key" -out "$certs/server.crt" >/dev/null 2>&1
docker run -d --name "$name" -p 127.0.0.1::80 -v "$certs:/etc/nginx/ssl:ro" "$image"
port=$(docker port "$name" 80/tcp | awk -F: '{print $NF}')
python3 - "$port" "$revision" <<'PY'
import json, re, sys, time
from urllib.request import urlopen
base = f'http://127.0.0.1:{sys.argv[1]}'
for attempt in range(30):
    try:
        with urlopen(base, timeout=3) as response:
            html = response.read().decode()
        break
    except Exception:
        if attempt == 29:
            raise
        time.sleep(1)
assert '<div id="root"></div>' in html
assets = re.findall(r'(?:src|href)="(/assets/[^\"]+)"', html)
assert any(x.endswith('.js') for x in assets) and any(x.endswith('.css') for x in assets), assets
for asset in assets:
    with urlopen(base + asset, timeout=10) as response:
        assert response.status == 200 and len(response.read()) > 0, asset
with urlopen(base + '/chat') as response:
    assert response.read().decode() == html, 'SPA fallback is broken'
with urlopen(base + '/version.json') as response:
    assert response.headers.get('Cache-Control') == 'no-store'
    data = json.load(response)
    assert data == {'service': 'frontend', 'revision': sys.argv[2]}, data
print(f'Frontend smoke tests passed: {len(assets)} assets, SPA route, revision, cache headers')
PY

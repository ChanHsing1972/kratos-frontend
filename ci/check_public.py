"""Verify the production origin/CDN serves the deployed revision."""
import json
import sys
import time
from urllib.request import Request, urlopen

expected = sys.argv[1]
path = 'version.json'
for attempt in range(12):
    try:
        request = Request(f"https://kratos.qzz.io/{path}?ci={expected}", headers={"Cache-Control": "no-cache"})
        with urlopen(request, timeout=15) as response:
            data = json.load(response)
        assert data["revision"] == expected, data
        assert data["service"] == "frontend", data
        print(f"Public deployment verified: {expected}")
        break
    except Exception as error:
        if attempt == 11:
            raise
        print(f"Waiting for public deployment: {error}")
        time.sleep(5)

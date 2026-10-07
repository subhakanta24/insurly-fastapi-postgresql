import urllib.request
import json

BASE = "http://127.0.0.1:8000"

for path in ["/", "/health", "/docs"]:
    with urllib.request.urlopen(BASE + path) as response:
        print(path, response.status)

print("Basic API connectivity test passed.")

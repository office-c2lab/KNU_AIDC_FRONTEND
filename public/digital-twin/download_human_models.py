from pathlib import Path
import json, urllib.request
source = Path(__file__).parent
assets = json.loads((source / 'HUMAN_ASSETS.json').read_text(encoding='utf-8'))['models']
target = source / 'assets' / 'humans'
target.mkdir(parents=True, exist_ok=True)
for name, item in assets.items():
    dest = target / f'{name}.glb'
    if dest.exists() and dest.stat().st_size > 100_000:
        print('Already downloaded:', dest.name)
        continue
    print('Downloading', name, item['url'])
    try:
        request = urllib.request.Request(
            item['url'],
            headers={
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://www.innerscene.com/',
            },
        )
        with urllib.request.urlopen(request) as response, dest.open('wb') as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        print('Saved:', dest.name, dest.stat().st_size, 'bytes')
    except Exception as exc:
        print('FAILED:', name, exc)
        if dest.exists() and dest.stat().st_size < 100_000: dest.unlink()

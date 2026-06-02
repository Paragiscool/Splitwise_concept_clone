import urllib.request
import re

try:
    html = urllib.request.urlopen('https://splitwise-concept-clone-iojmey043-patleparag125-2969s-projects.vercel.app/').read().decode('utf-8')
    js_match = re.search(r'assets/index-[^.]+\.js', html)
    if js_match:
        js_url = 'https://splitwise-concept-clone-iojmey043-patleparag125-2969s-projects.vercel.app/' + js_match.group(0)
        js = urllib.request.urlopen(js_url).read().decode('utf-8')
        render_url_match = re.search(r'https://[^"\']+\.onrender\.com', js)
        if render_url_match:
            print("RENDER URL: " + render_url_match.group(0))
        else:
            print("Render URL not found in JS.")
    else:
        print("JS not found in HTML.")
except Exception as e:
    print("Error:", e)

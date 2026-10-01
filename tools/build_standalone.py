#!/usr/bin/env python3
"""Build one self-contained HTML file: all code inline, plus (optionally) a snapshot of the data to start from."""
import re,sys,json,os
root=os.path.join(os.path.dirname(__file__),'..','app')
seed=sys.argv[2] if len(sys.argv)>2 else None   # json with {versions,state,tx}
h=open(os.path.join(root,'index.html')).read()
h=re.sub(r'<link[^>]*fonts[^>]*>\s*','',h)
h=re.sub(r'<link rel="stylesheet" href="(css/app.css)">',lambda m:'<style>\n'+open(os.path.join(root,m.group(1))).read()+'\n</style>',h)
def js(m):
    p=m.group(1);code=open(os.path.join(root,p)).read().replace('</script','<\\/script')
    out='<script>\n'+code+'\n</script>'
    if p=='data/history.js' and seed: out+='\n<script>window.SEED='+json.dumps(json.load(open(seed)),separators=(',',':')).replace('</','<\\/')+';</script>'
    return out
h=re.sub(r'<script src="([^"]+)"></script>',js,h)
open(sys.argv[1],'w').write(h)
print(len(h))

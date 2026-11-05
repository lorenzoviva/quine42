import json, os
U=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','orichalcum','modules')+'/'
def module(mid, manifest, lua=None):
    d=U+mid; os.makedirs(d,exist_ok=True)
    m={"id":mid,"version":"0.1.0"}; m.update(manifest)
    if lua is not None: m["logic"]="module.lua"
    json.dump(m,open(d+'/manifest.json','w'),ensure_ascii=False,indent=2); open(d+'/manifest.json','a').write('\n')
    if lua is not None: open(d+'/module.lua','w').write(lua.strip('\n')+'\n')

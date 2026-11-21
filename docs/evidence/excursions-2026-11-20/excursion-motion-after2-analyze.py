import json,math,hashlib
from pathlib import Path
before=json.load(open('/tmp/excursion-motion-summary.json'));after=json.load(open('/tmp/excursion-motion-after2-summary.json'))
changes=[k for k in before['hashes'] if before['hashes'][k]!=after['hashes'].get(k)]
assert changes==['contact.js','physics.js'],changes
assert before['config']==after['config']
rows=[]
for row in before['rows']:
 name=row['name'];out={'name':name}
 for label,prefix in [('before',''),('after','after2-')]:
  raw=Path('/tmp/excursion-motion-'+prefix+name+'.jsonl').read_bytes();frames=[json.loads(s) for s in raw.splitlines()];hz=row['hz'];dt=1/hz
  path=visible=0;minPaw=math.inf;maxOverlap=0;collisions=0;maxBlocked=0;blocked=[0,0];finite=True;exitCount=0;maxStep=0;maxEmpty=empty=0
  for j,pair in enumerate(frames):
   collisions+=pair[0]['collisions'];anyVisible=False
   if all(s['state']=='active' for s in pair):maxOverlap=max(maxOverlap,223.08-math.hypot(pair[0]['x']-pair[1]['x'],pair[0]['y']-pair[1]['y']))
   for i,s in enumerate(pair):
    finite=finite and all(math.isfinite(s[k]) for k in ['x','y','angle','targetX','targetY','vx','vy'])
    if row['scenario']=='paw' and s['state']=='active':minPaw=min(minPaw,math.hypot(s['x']-512,s['y']-384))
    if s['visible']:visible+=dt;anyVisible=True
    if j:
     old=frames[j-1][i];dist=math.hypot(s['x']-old['x'],s['y']-old['y'])
     if old['state']=='active' and s['state']=='active':maxStep=max(maxStep,dist)
     if s['visible'] and old['visible']:path+=dist
     if old['phase']!='hidden' and s['phase']=='hidden':exitCount+=1
     if s['phase'] in ['creep','dart','peek','traverse','retreat'] and math.hypot(s['targetX']-s['x'],s['targetY']-s['y'])>8 and dist/dt<3:blocked[i]+=dt
     else:blocked[i]=0
     maxBlocked=max(maxBlocked,*blocked)
   empty=0 if anyVisible else empty+dt;maxEmpty=max(maxEmpty,empty)
  selected=next(r for r in (before if label=='before' else after)['rows'] if r['name']==name)
  out[label]={'sha256':hashlib.sha256(raw).hexdigest(),'visibleSeconds':visible,'visiblePathPx':path,'minPawDistance':None if minPaw==math.inf else minPaw,'maxPawPenetration':0 if minPaw==math.inf else max(0,161.54-minPaw),'maxMouseOverlap':max(0,maxOverlap),'collisionImpulses':collisions,'maxBlockedSeconds':maxBlocked,'maxEmptySeconds':maxEmpty,'exits':exitCount,'maxActiveStepPx':maxStep,'finite':finite,'maxSegmentTurns':selected['segments'][0]['turn'],'maxWindowTurns':selected['windows'][0]['turns'],'rankedWindows':selected['windows'][:3]}
 if row['scenario']=='passive':assert out['before']['sha256']==out['after']['sha256'],name
 rows.append(out)
result={'changedRuntimeFiles':changes,'candidateContactHash':after['hashes']['contact.js'],'defaultsEqual':True,'allSixPassiveTracesByteIdentical':True,'rows':rows}
Path('/tmp/excursion-motion-after2-comparison.json').write_text(json.dumps(result,indent=2))
for r in rows:
 if r['name'].startswith('paw'):
  print(r['name'],json.dumps({k:[r['before'][k],r['after'][k]] for k in ['maxSegmentTurns','maxWindowTurns','maxPawPenetration','maxMouseOverlap','visibleSeconds','visiblePathPx','maxBlockedSeconds','maxEmptySeconds','exits','collisionImpulses']}))
print('hash',result['candidateContactHash'])

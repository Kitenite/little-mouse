from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
import json
import sys
root=Path(sys.argv[1]) # directory containing FFmpeg frame-0001.png etc; writes analysis beside them
rows=[]
for i,f in enumerate(sorted(root.glob('frame-*.png'))):
 a=np.asarray(Image.open(f)).astype(float);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 mask=(r>g*1.6)&(b>g*1.5)&(r>45)&(b>45)
 labels,n=ndimage.label(mask);sizes=np.bincount(labels.ravel());sizes[0]=0
 if n:
  idx=sizes.argmax();y,x=np.where(labels==idx);area=int(sizes[idx]);visible=area>50
  rows.append(dict(t=round(i/12,3),x=round(float(np.mean(x))/683,4) if visible else None,y=round(float(np.mean(y))/512,4) if visible else None,area=area,full=bool(area>2200)))
 else: rows.append(dict(t=round(i/12,3),x=None,y=None,area=0,full=False))
(root/'track.json').write_text(json.dumps(rows,indent=2))
# Six time-colored path panels: numbers mark one-second centers. Empty periods break lines.
out=Image.new('RGB',(1366,1536),'#eee');d=ImageDraw.Draw(out)
for panel in range(6):
 ox=(panel%2)*683;oy=(panel//2)*512
 d.rectangle((ox,oy,ox+682,oy+511),fill='#24211c');d.text((ox+12,oy+12),f'{panel*4}-{min(25,panel*4+4)} seconds',fill='white')
 prev=None
 for row in rows:
  if not panel*4<=row['t']<panel*4+4:continue
  if row['x'] is None:prev=None;continue
  pt=(ox+row['x']*683,oy+row['y']*512)
  if prev:d.line((prev,pt),fill='#ec66ff',width=3)
  if abs(row['t']-round(row['t']))<.01:d.ellipse((pt[0]-5,pt[1]-5,pt[0]+5,pt[1]+5),fill='#ffffaa');d.text(pt,str(round(row['t'])),fill='white')
  prev=pt
out.save(root/'paths.jpg')
# Speeds in viewport widths/s, excluding partial-body samples.
speeds=[]
for i in range(3,len(rows)-3):
 a,c,b=rows[i-3],rows[i],rows[i+3]
 if all(x['full'] for x in rows[i-3:i+4]):
  speed=np.hypot(b['x']-a['x'],(b['y']-a['y'])*512/683)/.5
  speeds.append((c['t'],float(speed)))
print('areas',np.percentile([r['area'] for r in rows],[25,50,75,95]))
print('speeds',np.percentile([s for t,s in speeds],[10,50,90]))
print('slow windows',[(t,round(s,2)) for t,s in speeds if s<.10])
print('absent', [r['t'] for r in rows if r['x'] is None])

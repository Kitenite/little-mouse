// Shared silhouette for render geometry and inverse contact tests. Shape-preserving
// cubic Hermite interpolation carries tangents through monotone landmarks rather
// than forcing a shelf at every sample. Values stay inside adjacent knot bounds.
export const BODY_PROFILE=Object.freeze([[-39,0,7],[-34,12,16],[-24,20,24],[-10,21,26],[4,18,25],[17,14,22],[27,12.5,19],[37,7.8,14],[48,2,9],[51,0,8]].map(Object.freeze));
function slopes(axis){const n=BODY_PROFILE.length,h=[],d=[],m=new Float64Array(n);
 for(let i=0;i<n-1;i++){h[i]=BODY_PROFILE[i+1][0]-BODY_PROFILE[i][0];d[i]=(BODY_PROFILE[i+1][axis]-BODY_PROFILE[i][axis])/h[i];}
 for(let i=1;i<n-1;i++){if(d[i-1]*d[i]<=0)m[i]=0;else{const a=2*h[i]+h[i-1],b=h[i]+2*h[i-1];m[i]=(a+b)/(a/d[i-1]+b/d[i]);}}
 const end=(h0,h1,d0,d1)=>{const v=((2*h0+h1)*d0-h0*d1)/(h0+h1);return v*d0<=0?0:d0*d1<0&&Math.abs(v)>3*Math.abs(d0)?3*d0:v;};
 m[0]=end(h[0],h[1],d[0],d[1]);m[n-1]=end(h[n-2],h[n-3],d[n-2],d[n-3]);return m;
}
const radiusSlopes=slopes(1),heightSlopes=slopes(2);
export function bodySection(x,out={r:0,z:0}){
 x=Math.max(BODY_PROFILE[0][0],Math.min(BODY_PROFILE.at(-1)[0],x));let i=0;while(i<BODY_PROFILE.length-2&&x>BODY_PROFILE[i+1][0])i++;
 const a=BODY_PROFILE[i],b=BODY_PROFILE[i+1],h=b[0]-a[0],t=(x-a[0])/h,t2=t*t,t3=t2*t;
 const value=(axis,m)=>(2*t3-3*t2+1)*a[axis]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*b[axis]+(t3-t2)*h*m[i+1];
 out.r=value(1,radiusSlopes);out.z=value(2,heightSlopes);return out;
}

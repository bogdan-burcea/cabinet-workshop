// Reserve the whole fixing/foot envelope behind the plinth's rear face.
export function minimumFootFront(c){if(!c.plinth||c.style==='Wall'||c.support==='floor'||c.feet==='none'||c.feetHeight-(c.bottomDado?c.bottomLift:0)<40)return 0;return (c.plinthSetback??60)+(c.plinthThickness??18)+Math.max(30,(c.feetPitchY??32)/2+(c.feetDiameter??2.5)/2)+2;}
export function normalizeFootPlacement(c){c.feetFront=Math.max(c.feetFront??80,minimumFootFront(c));return c;}

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
type Role='admin'|'customer';
export function sign(role:Role){const s=process.env.JWT_SECRET||'dev-secret';return jwt.sign({role},s,{expiresIn:'12h'});} 
export function verify(t:string){const s=process.env.JWT_SECRET||'dev-secret';return jwt.verify(t,s) as {role:Role};}
export function requireRole(role:Role){const token=cookies().get('auth')?.value;if(!token) throw new Error('Not authenticated');const p=verify(token);if(p.role!==role) throw new Error('Forbidden');return p;}

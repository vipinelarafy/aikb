import './globals.css';
export const metadata = { title: process.env.NEXT_PUBLIC_APP_NAME || 'Retell KB' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang='en'><body><div className='container'>{children}</div></body></html>); }

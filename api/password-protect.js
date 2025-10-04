// api/password-protect.js

export default function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).send('Method Not Allowed');
    }

    const { password } = request.body;
    const sitePassword = process.env.SITE_PASSWORD;

    if (password === sitePassword) {
        // 密码正确，设置 Cookie
        response.setHeader('Set-Cookie', `password_correct=true; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`);
        return response.status(200).json({ message: 'Success' });
    } else {
        // 密码错误
        return response.status(401).json({ message: 'Unauthorized' });
    }
}
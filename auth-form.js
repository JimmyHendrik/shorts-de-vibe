// Leitura e normalização dos campos de autenticação.
window.VibeAuthForm = {
    readCredentials(form, mode) {
        const values = new FormData(form);
        const credentials = {
            email: String(values.get('email') || '').trim(),
            password: String(values.get('password') || ''),
        };

        if (mode === 'register') {
            credentials.name = String(values.get('name') || '').trim();
            credentials.username = String(values.get('username') || '').trim();
            credentials.password_confirmation = String(values.get('password_confirmation') || '');
        }

        return credentials;
    },
};

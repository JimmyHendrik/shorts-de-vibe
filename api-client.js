// Cliente HTTP compartilhado pela autenticação e pelo feed.
(function () {
    window.VibeApiClient = function createApiClient({ baseUrl, getToken, getUserId }) {
        const pendingKey = 'vibe_pending_actions';
        const queueLifetime = 24 * 60 * 60 * 1000;
        const readPending = () => {
            try {
                const parsed = JSON.parse(localStorage.getItem(pendingKey) || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };
        const isQueueable = (method, path) => {
            if (!['PUT', 'DELETE'].includes(method)) return false;
            return /^\/videos\/\d+\/(?:like|favorite)$/.test(path)
                || /^\/users\/\d+\/(?:follow|hide)$/.test(path);
        };
        const queueAction = action => {
            const userId = getUserId?.();
            if (userId === null || userId === undefined) return;
            const now = Date.now();
            const queued = [
                ...readPending().filter(item => Number(item.expires_at) > now),
                {
                    ...action,
                    user_id: String(userId),
                    queued_at: now,
                    expires_at: now + queueLifetime,
                },
            ].slice(-50);
            localStorage.setItem(pendingKey, JSON.stringify(queued));
            window.dispatchEvent(new CustomEvent('vibe:offline-queued', { detail: { count: queued.length } }));
        };
        function apiUrl(path) {
            return new URL(`${baseUrl}${path}`, window.location.href).toString();
        }

        function getApiErrorMessage(payload, fallbackMessage) {
            const validationErrors = payload?.errors ? Object.values(payload.errors).flat() : [];
            return validationErrors[0] || payload?.message || fallbackMessage;
        }

        async function apiRequest(path, options = {}) {
            const { method = 'GET', body = null, includeAuth = true, queueIfDisconnected = true } = options;
            const headers = { Accept: 'application/json' };
            const token = getToken();
            const canQueue = queueIfDisconnected && Boolean(token) && Boolean(getUserId?.()) && isQueueable(method, path);
            const idempotencyKey = options.idempotencyKey || (
                canQueue
                    ? (crypto.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(16).slice(2))
                    : null
            );

            if (body) headers['Content-Type'] = 'application/json';
            if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
            if (includeAuth && token) headers.Authorization = `Bearer ${token}`;

            let response;
            try {
                if (!navigator.onLine && method !== 'GET' && token && canQueue) {
                    queueAction({ path, method, body, idempotencyKey });
                    const offlineError = new Error('offline');
                    offlineError.queued = true;
                    throw offlineError;
                }
                response = await fetch(apiUrl(path), {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : null,
                });
            } catch (error) {
                if (canQueue && !error.queued) queueAction({ path, method, body, idempotencyKey });
                const connectionError = new Error('Não foi possível conectar ao servidor. Verifique se a API está em execução.');
                connectionError.cause = error;
                throw connectionError;
            }

            const payload = response.status === 204 ? null : await response.json().catch(() => null);
            if (!response.ok) {
                const error = new Error(getApiErrorMessage(payload, 'Não foi possível concluir esta ação.'));
                error.status = response.status;
                throw error;
            }

            return payload;
        }

        async function flushPendingActions() {
            const userId = getUserId?.();
            const token = getToken();
            if (!userId || !token) return;
            const now = Date.now();
            const actions = readPending().filter(action => Number(action.expires_at) > now);
            const currentUserActions = actions.filter(action => action.user_id === String(userId));
            const otherUserActions = actions.filter(action => action.user_id !== String(userId));
            if (!currentUserActions.length) {
                localStorage.setItem(pendingKey, JSON.stringify(otherUserActions));
                return;
            }
            const remaining = [];
            for (const action of currentUserActions) {
                try {
                    await apiRequest(action.path, { ...action, queueIfDisconnected: false });
                } catch {
                    remaining.push(action);
                }
            }
            const pending = [...otherUserActions, ...remaining].slice(-50);
            localStorage.setItem(pendingKey, JSON.stringify(pending));
            window.dispatchEvent(new CustomEvent('vibe:offline-sync', {
                detail: { synced: currentUserActions.length - remaining.length, pending: pending.length },
            }));
        }
        window.addEventListener('online', flushPendingActions);
        setTimeout(flushPendingActions, 1000);

        return { apiUrl, apiRequest, getApiErrorMessage, flushPendingActions };
    };
})();

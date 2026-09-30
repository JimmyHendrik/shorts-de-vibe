// Utilidades visuais compartilhadas pelo feed e pelos modais.
(function () {
    function formatCount(num) {
        const count = Math.max(0, Number(num) || 0);
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
        return count;
    }

    function formatTime(seconds) {
        if (!isFinite(seconds)) return '00:00';
        const minutos = Math.floor(seconds / 60);
        const segundos = Math.floor(seconds % 60);
        return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }

    function safeMediaUrl(value) {
        if (typeof value !== 'string' || value.trim() === '') return '';
        try {
            const url = new URL(value, window.location.href);
            const isLocalDevelopment =
                url.protocol === 'http:' &&
                ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
            const isSecureRemote = url.protocol === 'https:';
            return isSecureRemote || isLocalDevelopment ? url.href : '';
        } catch {
            return '';
        }
    }

    function createIcon(className) {
        const icon = document.createElement('i');
        icon.className = className;
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function createSidebarAction(type, iconClass, count, label, isActive = false) {
        const action = document.createElement('button');
        action.type = 'button';
        action.className = `sidebar-icon ${type}`;
        action.setAttribute('aria-label', label);
        if (type === 'like' || type === 'favorite') action.setAttribute('aria-pressed', String(isActive));

        const icon = createIcon(iconClass);
        if (isActive) icon.classList.add('liked');
        action.appendChild(icon);
        if (count !== null && count !== undefined) {
            const normalizedCount = Math.max(0, Math.floor(Number(count) || 0));
            const counter = document.createElement('span');
            counter.dataset.count = String(normalizedCount);
            counter.textContent = formatCount(normalizedCount);
            action.appendChild(counter);
        }
        return action;
    }

    window.VibeUiHelpers = { formatCount, formatTime, safeMediaUrl, createIcon, createSidebarAction };
})();

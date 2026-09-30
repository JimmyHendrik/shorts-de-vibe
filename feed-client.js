// Normalização e paginação dos vídeos vindos da API.
(function () {
    window.VibeFeedClient = function createFeedClient({ baseUrl, pageSize, getToken }) {
        function apiPageUrl(pageUrl = null, params = {}) {
            const url = new URL(`${baseUrl}/videos`, window.location.href);

            if (pageUrl) {
                const paginationUrl = new URL(pageUrl, window.location.href);
                paginationUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
            } else {
                url.searchParams.set('per_page', String(pageSize));
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
                });
            }

            return url.toString();
        }

        function normalizeApiVideo(video) {
            const username = video.author?.username || video.author?.name || 'vibe';

            return {
                id: video.id,
                src: video.video_url,
                user: username.startsWith('@') ? username : `@${username}`,
                authorId: video.author?.id || null,
                author: video.author || null,
                isFollowing: Boolean(video.author?.is_following),
                description: video.description || '',
                location: video.location || '',
                thumbnail_url: video.thumbnail_url || '',
                likes: video.likes_count || 0,
                comments: video.comments_count || 0,
                shares: video.shares_count || 0,
                view_count: video.view_count || 0,
                allowComments: video.allow_comments,
                isLiked: Boolean(video.liked_by_current_user),
                favorites: video.favorites_count || 0,
                isFavorite: Boolean(video.favorited_by_current_user),
                created_at: video.created_at || '',
                duration_seconds: Number(video.duration_seconds) || 0,
            };
        }

        async function fetchFeedPage(pageUrl = null, params = {}) {
            const token = getToken();
            const response = await fetch(apiPageUrl(pageUrl, params), {
                headers: {
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) {
                throw new Error(`Não foi possível carregar o feed (${response.status}).`);
            }

            const payload = await response.json();
            if (!Array.isArray(payload.data)) {
                throw new Error('A API retornou um formato de feed inválido.');
            }

            return payload;
        }

        return { fetchFeedPage, normalizeApiVideo };
    };
})();

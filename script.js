// --- 1. Dados ---
const videoData = window.vibeVideoData;
const demoCommentsData = window.vibeDemoCommentsData;

const INTEREST_GROUPS = {
    'Interesses gerais': ['Investimentos', 'Dividendos', 'Renda fixa', 'Empreendedorismo', 'Tecnologia', 'Esportes', 'Entretenimento', 'Educação'],
    'Esportes & Lazer': ['Futebol', 'Basquete', 'Fórmula 1 e automobilismo', 'Esportes radicais', 'Musculação e fitness', 'Lutas e artes marciais', 'Skate e patins', 'Vôlei', 'Corrida de rua', 'Ciclismo'],
    'Entretenimento & Cultura Pop': ['Música', 'Filmes e séries', 'Animes e mangás', 'Games e eSports', 'Celebridades e fofocas', 'Humor e memes', 'Dança e coreografias', 'Livros e literatura', 'Teatro e artes cênicas', 'Podcasts e talk shows'],
    'Estilo de Vida & Conhecimento': ['Finanças e investimentos', 'Tecnologia e gadgets', 'Ciência e curiosidades', 'Psicologia e autoconhecimento', 'Empreendedorismo', 'Educação e estudos', 'Marketing digital', 'Produtividade', 'Idiomas', 'Criptomoedas e Web3'],
    'Moda, Bem-estar & Casa': ['Viagens e turismo', 'Gastronomia e receitas', 'Moda e tendências', 'Maquiagem e skincare', 'Arquitetura e decoração', 'Sustentabilidade e meio ambiente', 'Pets e animais de estimação', 'Carros e motos', 'Jardinagem e plantas', 'Astrologia e horóscopo'],
    'Criatividade & Inspiração': ['Fotografia e vídeo', 'Design e ilustração', 'Artesanato e DIY', 'Culinária saudável', 'Vlogs do dia a dia', 'Histórias e relatos', 'Moda sustentável', 'Cinema independente', 'Colecionáveis e geek', 'Desenvolvimento pessoal'],
    'Inovação, Carreira & Negócios': ['Inteligência artificial', 'Mercado de trabalho e vagas', 'Liderança e gestão', 'Vendas e negociação', 'Direito e concursos públicos', 'Freelancers e autônomos', 'Startups e inovação', 'Gestão de tempo', 'Oratória e comunicação', 'Sustentabilidade corporativa'],
    'Saúde, Mente & Corpo': ['Saúde e bem-estar', 'Medicina e enfermagem', 'Nutrição e dietas', 'Yoga e meditação', 'Skincare avançado', 'Saúde mental', 'Sono e descanso', 'Terapias alternativas', 'Longevidade e qualidade de vida', 'Primeiros socorros'],
    'Curiosidades, Sociedade & Cultura': ['História e guerras', 'Geografia e geopolítica', 'Filosofia e pensamentos', 'Religiões e espiritualidade', 'Sustentabilidade urbana', 'Arqueologia e mistérios', 'Biografias famosas', 'Linguística e idiomas raros', 'Causas sociais e voluntariado', 'Cultura internacional'],
    'Hobbies, DIY & Coleções': ['Marcenaria e carpintaria', 'Eletrônica e robótica', 'Cerveja artesanal e drinks', 'Churrasco e técnicas de fogo', 'Colecionismo de moedas e selos', 'Restauração de veículos antigos', 'Pesca e esportes náuticos', 'Acampamento e trilhas', 'Puzzles e jogos de tabuleiro', 'Modelismo e drones'],
    'Vida Urbana & Tendências': ['Vida noturna e festas', 'Cafeterias e cafés especiais', 'Arquitetura minimalista', 'Design de interiores', 'Moda streetwear', 'Tênis de coleção', 'Podcasts de true crime', 'Crônicas e poesias urbanas', 'Humor ácido e stand-up', 'Viagens econômicas e mochilão'],
    'Mais para você': ['Notícias e atualidades', 'Relacionamentos', 'Maternidade e família', 'Finanças pessoais', 'Receitas rápidas', 'Decoração sustentável', 'Fotografia mobile', 'Comunidades e voluntariado'],
};

let commentsData = [];
let commentReplyTarget = null;
let commentsRequestId = 0;
// Em um aparelho na rede local, `127.0.0.1` aponta para o próprio aparelho.
// Mantemos o loopback no computador e usamos o mesmo host da página no celular.
const DEFAULT_API_BASE_URL = window.location.protocol === 'https:'
    ? new URL('/api', window.location.origin).toString()
    : ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
        ? 'http://127.0.0.1:8000/api'
        : `http://${window.location.hostname}:8000/api`;
const FEED_PAGE_SIZE = 8;
const API_BASE_URL = (document.body.dataset.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
const useDemoFallback = document.body.dataset.demoFallback === 'true';

let feedVideos = [];
let nextFeedUrl = null;
let isLoadingFeed = false;
let isUsingDemoFeed = false;
let feedMode = 'discover';
let activeVideoId = null;
let activeVideoElement = null;
const viewedVideoIds = new Set();
let authToken = sessionStorage.getItem('vibe_auth_token');
let authenticatedUser = null;
let authMode = 'login';
const { apiUrl, apiRequest, getApiErrorMessage } = window.VibeApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => authToken,
    getUserId: () => authenticatedUser?.id ?? null,
});
const { fetchFeedPage, normalizeApiVideo } = window.VibeFeedClient({
    baseUrl: API_BASE_URL,
    pageSize: FEED_PAGE_SIZE,
    getToken: () => authToken,
});
const { formatCount, formatTime, safeMediaUrl, createIcon, createSidebarAction } = window.VibeUiHelpers;
const {
    getPlayIcon,
    getProgressBar,
    getProgressFill,
    bindProgressAnimation,
    getProgressTime,
    setPlayIconState,
    atualizarBarraProgresso,
} = window.VibeVideoUi(formatTime);

// --- 2. Renderização ---

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {}), { once: true });
}

function createVideoElement(data) {
    const videoContainer = document.createElement('article');
    videoContainer.className = 'video-container';

    const video = document.createElement('video');
    video.src = safeMediaUrl(data.src);
    video.poster = safeMediaUrl(data.thumbnail_url);
    video.loop = true;
    video.playsInline = true;
    video.muted = true;
    video.preload = 'metadata';
    video.dataset.videoId = String(data.id ?? '');
    video.dataset.authorId = String(data.authorId ?? '');
    video.dataset.isDemo = String(data.isDemo === true);
    video.dataset.allowComments = String(data.allowComments !== false);
    video.setAttribute('aria-label', `Vídeo de ${data.user || 'Vibe'}`);
    const ajustarFaixaDoVideo = () => {
        if (!videoContainer.classList.contains('landscape-video-container')) {
            videoContainer.style.removeProperty('--media-offset-bottom');
            return;
        }
        const containerRect = videoContainer.getBoundingClientRect();
        const mediaRect = video.getBoundingClientRect();
        const offsetBottom = Math.max(0, containerRect.bottom - mediaRect.bottom);
        videoContainer.style.setProperty('--media-offset-bottom', `${offsetBottom}px`);
    };

    video.addEventListener('loadedmetadata', () => {
        const ratio = video.videoWidth > 0 && video.videoHeight > 0
            ? video.videoWidth / video.videoHeight
            : 1;
        const isLandscape = ratio >= 1.35;
        videoContainer.classList.toggle('landscape-video-container', isLandscape);
        videoContainer.classList.toggle('portrait-video-container', !isLandscape);
        if (isLandscape) {
            requestAnimationFrame(ajustarFaixaDoVideo);
        } else {
            videoContainer.style.removeProperty('--media-offset-bottom');
        }
    });
    video.addEventListener('error', () => marcarVideoIndisponivel(video));

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.setAttribute('aria-label', 'Progresso do vídeo');

    const progress = document.createElement('div');
    progress.className = 'progress';

    const progressTime = document.createElement('div');
    progressTime.className = 'progress-time';
    progressTime.textContent = '00:00 / 00:00';
    const progressThumb = document.createElement('span');
    progressThumb.className = 'progress-thumb';
    progressThumb.setAttribute('aria-hidden', 'true');
    progressBar.append(progress, progressThumb);

    const videoInfo = document.createElement('div');
    videoInfo.className = 'video-info';
    const videoUser = document.createElement('div');
    videoUser.className = 'video-user';
    const user = document.createElement('h3');
    user.textContent = data.user || '@vibe';
    user.dataset.userId = String(data.authorId || '');
    user.classList.toggle('profile-link', Boolean(data.authorId));
    if (data.authorId && !data.isDemo) {
        const follow = document.createElement('button');
        follow.type = 'button';
        follow.className = 'video-follow';
        follow.dataset.userId = String(data.authorId);
        follow.textContent = data.isFollowing ? 'Seguindo' : 'Seguir';
        follow.setAttribute('aria-label', `${data.isFollowing ? 'Deixar de seguir' : 'Seguir'} ${data.user || 'usuário'}`);
        videoUser.append(user, follow);
    } else {
        videoUser.appendChild(user);
    }
    const description = document.createElement('p');
    renderizarTextoComHashtags(description, data.description || '');
    videoUser.appendChild(description);
    const views = document.createElement('small');
    views.className = 'video-views';
    views.textContent = `${formatCount(data.view_count)} visualizações`;
    videoUser.appendChild(views);
    if (data.location) {
        const location = document.createElement('small');
        location.className = 'video-location';
        location.textContent = `📍 ${data.location}`;
        videoUser.appendChild(location);
    }
    videoInfo.appendChild(videoUser);

    const playIcon = document.createElement('div');
    playIcon.className = 'play-icon active';
    playIcon.setAttribute('aria-hidden', 'true');
    playIcon.appendChild(createIcon('ri-play-fill'));

    const sidebar = document.createElement('div');
    sidebar.className = 'video-sidebar';
    sidebar.append(
        createSidebarAction('like', 'ri-poker-hearts-fill', data.likes, 'Curtir vídeo', data.isLiked),
        createSidebarAction('comment', 'ri-chat-1-fill', data.comments, 'Abrir comentários'),
        createSidebarAction('favorite', 'ri-bookmark-fill', data.favorites, 'Salvar vídeo', data.isFavorite),
        createSidebarAction('share', 'ri-share-forward-fill', data.shares, 'Compartilhar vídeo'),
        createSidebarAction('more', 'ri-more-2-fill', null, 'Mais opções do vídeo'),
    );

    videoContainer.append(video, progressBar, progressTime, videoInfo, playIcon, sidebar);
    return videoContainer;
}

function renderizarTextoComHashtags(element, text) {
    element.replaceChildren();
    const parts = String(text).split(/(#[\p{L}\p{N}_-]+)/gu);
    parts.forEach(part => {
        if (/^#[\p{L}\p{N}_-]+$/u.test(part)) {
            const link = document.createElement('button');
            link.type = 'button';
            link.className = 'hashtag-link';
            link.textContent = part;
            link.setAttribute('aria-label', `Ver vídeos da hashtag ${part}`);
            link.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                abrirHashtag(part);
            });
            element.appendChild(link);
        } else if (part) {
            element.appendChild(document.createTextNode(part));
        }
    });
}

function renderVideos(videosToRender, append = false) {
    if (!append) container.replaceChildren();

    const fragment = document.createDocumentFragment();
    videosToRender.forEach(data => fragment.appendChild(createVideoElement(data)));
    container.appendChild(fragment);
}

function renderComments() {
    commentsList.replaceChildren();

    commentsData.forEach(comment => {
        const commentItem = document.createElement('article');
        commentItem.className = 'comment-item';

        const avatar = document.createElement('img');
        avatar.src = safeMediaUrl(comment.avatar) || 'img/vibe-mark.png';
        avatar.alt = `Avatar de ${comment.user}`;

        const content = document.createElement('div');
        content.className = 'comment-content';
        const user = document.createElement('h4');
        user.textContent = comment.user;
        const text = document.createElement('p');
        text.textContent = comment.text;
        content.append(user, text);

        const actions = document.createElement('div');
        actions.className = 'comment-actions';
        const replies = document.createElement('div');
        replies.className = 'comment-replies';
        replies.hidden = true;
        if (comment.repliesCount > 0) {
            const viewReplies = document.createElement('button');
            viewReplies.type = 'button';
            viewReplies.textContent = `Ver ${comment.repliesCount} resposta${comment.repliesCount === 1 ? '' : 's'}`;
            viewReplies.addEventListener('click', () => void carregarRespostas(comment, replies, viewReplies));
            actions.appendChild(viewReplies);
        }
        const reply = document.createElement('button');
        reply.type = 'button';
        reply.textContent = comment.repliesCount ? `Responder (${comment.repliesCount})` : 'Responder';
        reply.addEventListener('click', () => {
            commentReplyTarget = comment.id;
            commentInput.placeholder = `Responder a ${comment.user}`;
            commentInput.focus();
        });
        actions.appendChild(reply);
        const isCommentAuthor = comentarioPertenceAoUsuario(comment);
        const isVideoOwner = usuarioEhDonoDoVideo();
        if (isCommentAuthor) {
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Editar';
            edit.addEventListener('click', () => void editarComentario(comment));
            actions.appendChild(edit);

        }
        if (isCommentAuthor || isVideoOwner) {
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'comment-delete';
            remove.textContent = 'Excluir';
            remove.addEventListener('click', () => void excluirComentario(comment));
            actions.appendChild(remove);
        }
        content.append(actions, replies);

        commentItem.append(avatar, content);
        commentsList.appendChild(commentItem);
    });
}

// --- 3. Seleção dos elementos ---
const container = document.querySelector('.videos-container');
const commentsModal = document.querySelector('.comments-modal');
const commentsContent = document.querySelector('.comments-content');
const commentsList = document.querySelector('.comments-list');
const closeComments = document.querySelector('.close-comments');
const commentInput = document.querySelector('.comment-input input');
const sendComment = document.querySelector('.comment-input button');
const btnInicio = document.getElementById('btnInicio');
const btnDiscover = document.getElementById('btnDiscover');
const btnProfile = document.getElementById('btnProfile');
const btnUpload = document.getElementById('btnUpload');
const btnInbox = document.getElementById('btnInbox');
const videoFileInput = document.getElementById('video-file-input');
const publishModal = document.getElementById('publish-modal');
const publishContent = document.querySelector('.publish-content');
const closePublish = document.querySelector('.close-publish');
const publishFile = document.getElementById('publish-file');
const publishRecord = document.getElementById('publish-record');
const publishStop = document.getElementById('publish-stop');
const publishPreview = document.getElementById('publish-preview');
const publishStatus = document.getElementById('publish-status');
const publishActions = document.querySelector('.publish-actions');
const publishEditor = document.getElementById('publish-editor');
const publishDetailPreview = document.getElementById('publish-detail-preview');
const publishCoverCanvas = document.getElementById('publish-cover-canvas');
const publishCoverRange = document.getElementById('publish-cover-range');
const publishTrimStart = document.getElementById('publish-trim-start');
const publishTrimEnd = document.getElementById('publish-trim-end');
const publishTrimTime = document.getElementById('publish-trim-time');
const publishTrimVideo = document.getElementById('publish-trim-video');
const publishTrimTimeline = document.getElementById('publish-trim-timeline');
const publishTrimStrip = document.getElementById('publish-trim-strip');
const publishTrimSelection = document.getElementById('publish-trim-selection');
const publishTrimStartRange = document.getElementById('publish-trim-start-range');
const publishTrimEndRange = document.getElementById('publish-trim-end-range');
const publishDescription = document.getElementById('publish-description');
const publishDescriptionCount = document.getElementById('publish-description-count');
const publishLocation = document.getElementById('publish-location');
const publishVisibility = document.getElementById('publish-visibility');
const publishSchedule = document.getElementById('publish-schedule');
const publishAllowComments = document.getElementById('publish-allow-comments');
const publishAllowReuse = document.getElementById('publish-allow-reuse');
const publishAiGenerated = document.getElementById('publish-ai-generated');
const publishAgeRestricted = document.getElementById('publish-age-restricted');
const publishHighQuality = document.getElementById('publish-high-quality');
const publishBack = document.getElementById('publish-back');
const publishSubmit = document.getElementById('publish-submit');
const publishProgress = document.getElementById('publish-progress');
const publishProgressCircle = document.getElementById('publish-progress-circle');
const publishProgressValue = document.getElementById('publish-progress-value');
const publishProgressLabel = document.getElementById('publish-progress-label');
const welcomeGate = document.getElementById('welcome-gate');
const welcomeLogin = document.getElementById('welcome-login');
const welcomeVisitor = document.getElementById('welcome-visitor');
const headerItems = document.querySelectorAll('.header-item');
const btnFollowing = document.getElementById('btnFollowing');
const btnSearch = document.getElementById('btnSearch');
const searchToolbar = document.getElementById('search-toolbar');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchClose = document.getElementById('search-close');
const searchStatus = document.getElementById('search-status');
const searchRecentList = document.getElementById('search-recent-list');
const searchSort = document.getElementById('search-sort');
const searchPage = document.getElementById('search-page');
const searchResultsGrid = document.getElementById('search-results-grid');
const discoverSuggestions = document.getElementById('discover-suggestions');
const discoverSuggestionsList = document.getElementById('discover-suggestions-list');
const discoverSuggestionsRefresh = document.getElementById('discover-suggestions-refresh');
const feedStatus = document.getElementById('feed-status');
const feedNotice = document.getElementById('feed-notice');
const feedNoticeText = document.getElementById('feed-notice-text');
const dismissFeedNotice = document.getElementById('dismiss-feed-notice');
const retryFeed = document.getElementById('retry-feed');
const audioUnlockButton = document.getElementById('audio-unlock');
const audioControl = document.getElementById('audio-control');
const audioIcon = document.getElementById('audio-icon');
const volumeRange = document.getElementById('volume-range');
const commentsNotice = document.getElementById('comments-notice');
const videoOptionsModal = document.getElementById('video-options-modal');
const closeVideoOptions = document.querySelector('.close-video-options');
let optionsVideo = null;
let playlistVideoTarget = null;
const commentsTitle = document.getElementById('comments-title');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authError = document.getElementById('auth-error');
const authSubmit = document.getElementById('auth-submit');
const authForgot = document.getElementById('auth-forgot');
const authToggle = document.getElementById('auth-toggle');
const closeAuth = document.querySelector('.close-auth');
const authAccount = document.getElementById('auth-account');
const authUserName = document.getElementById('auth-user-name');
const logoutButton = document.getElementById('logout-button');

document.querySelectorAll('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.passwordToggle);
        if (!input) return;
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        button.setAttribute('aria-pressed', String(!visible));
        button.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha');
        const icon = button.querySelector('i');
        icon?.classList.toggle('ri-eye-line', visible);
        icon?.classList.toggle('ri-eye-off-line', !visible);
    });
});
const profileModal = document.getElementById('profile-modal');
const closeProfile = document.querySelector('.close-profile');
const profileAvatar = document.getElementById('profile-avatar');
const profileCover = document.getElementById('profile-cover');
const profileAvatarUpload = document.getElementById('profile-avatar-upload');
const profileImageInput = document.getElementById('profile-image-input');
const profileCoverUpload = document.getElementById('profile-cover-upload');
const profileBack = document.getElementById('profile-back');
const profileImageViewer = document.getElementById('profile-image-viewer');
const profileImageViewerMedia = document.getElementById('profile-image-viewer-media');
const profileImageViewerTitle = document.getElementById('profile-image-viewer-title');
const profileImageViewerClose = document.getElementById('profile-image-viewer-close');
const profileImageViewerChange = document.getElementById('profile-image-viewer-change');
const profileTitle = document.getElementById('profile-title');
const profileName = document.getElementById('profile-name');
const profileUsername = document.getElementById('profile-username');
const profileBio = document.getElementById('profile-bio');
const profileVideoCount = document.getElementById('profile-video-count');
const profileViewCount = document.getElementById('profile-view-count');
const profileFollowerCount = document.getElementById('profile-follower-count');
const profileFollowingCount = document.getElementById('profile-following-count');
const profileVideos = document.getElementById('profile-videos');
const profileVideoViewer = document.getElementById('profile-video-viewer');
const profileVideoViewerMedia = document.getElementById('profile-video-viewer-media');
const profileVideoViewerClose = document.getElementById('profile-video-viewer-close');
const profileVideosTitle = document.querySelector('.profile-videos-title');
const profileEdit = document.getElementById('profile-edit');
const profileFollow = document.getElementById('profile-follow');
const profileShare = document.getElementById('profile-share');
const profilePlaylists = document.getElementById('profile-playlists');
const profileHiddenUsers = document.getElementById('profile-hidden-users');
const profileLogout = document.getElementById('profile-logout');
const profileForm = document.getElementById('profile-form');
const profileError = document.getElementById('profile-error');
const profileAnalytics = document.getElementById('profile-analytics');
const profileStatLikes = document.getElementById('profile-stat-likes');
const profileStatComments = document.getElementById('profile-stat-comments');
const profileStatShares = document.getElementById('profile-stat-shares');
const profileStatAverageViews = document.getElementById('profile-stat-average-views');
const peopleModal = document.getElementById('people-modal');
const peopleList = document.getElementById('people-list');
const peopleTitle = document.getElementById('people-title');
const playlistsModal = document.getElementById('playlists-modal');
const playlistsList = document.getElementById('playlists-list');
const playlistForm = document.getElementById('playlist-form');
const cropModal = document.getElementById('crop-modal');
const cropImage = document.getElementById('crop-image');
const cropX = document.getElementById('crop-x');
const cropY = document.getElementById('crop-y');
const cropZoom = document.getElementById('crop-zoom');
const confirmCrop = document.getElementById('confirm-crop');
let cropObjectUrl = null;
let cropFile = null;
let cropDragging = false;
let cropDragStart = null;
const notificationsModal = document.getElementById('notifications-modal');
const notificationsList = document.getElementById('notifications-list');
const notificationBadge = document.getElementById('notification-badge');
const closeNotifications = document.querySelector('.close-notifications');
const notificationTabAll = document.getElementById('notifications-tab-all');
const notificationTabMentions = document.getElementById('notifications-tab-mentions');
const notificationTabHistory = document.getElementById('notifications-tab-history');
const notificationTabModeration = document.getElementById('notifications-tab-moderation');
const profileTabs = document.querySelectorAll('.profile-tab');
const interestsModal = document.getElementById('interests-modal');
const interestOptions = document.getElementById('interest-options');
const saveInterestsButton = document.getElementById('save-interests');
const skipInterestsButton = document.getElementById('skip-interests');
const interestsError = document.getElementById('interests-error');

window.addEventListener('offline', () => setFeedStatus('Você está sem conexão. As ações serão sincronizadas quando a internet voltar.', { visible: true }));
window.addEventListener('online', () => setFeedStatus('Conexão restaurada. Sincronizando ações pendentes…'));
window.addEventListener('vibe:offline-queued', event => setFeedStatus(`${event.detail?.count || 1} ação(ões) aguardando sincronização.`, { visible: true }));
window.addEventListener('vibe:offline-sync', event => {
    const pending = Number(event.detail?.pending || 0);
    setFeedStatus(pending ? `${pending} ação(ões) ainda aguardam sincronização.` : 'Ações sincronizadas com sucesso.');
});

let videos = null;
let audioUnlocked = false;
let audioVolume = 0;
const playbackAttempts = new WeakMap();
const manuallyStartedVideos = new WeakSet();
const completedVideos = new WeakSet();
let activeVideoIndex = -1;
let searchMode = false;
let searchFilter = 'top';
const SEARCH_HISTORY_KEY = 'vibe_search_history';
let notificationPollTimer = null;

function carregarHistoricoPesquisa() {
    let terms = [];
    try { terms = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); } catch { terms = []; }
    if (searchRecentList) searchRecentList.replaceChildren(...terms.map(term => { const option = document.createElement('option'); option.value = term; return option; }));
    return terms;
}

function salvarHistoricoPesquisa(term) {
    const value = term.trim();
    if (!value) return;
    const terms = [value, ...carregarHistoricoPesquisa().filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, 8);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(terms));
    carregarHistoricoPesquisa();
}

carregarHistoricoPesquisa();
let publishRecorder = null;
let publishStream = null;
let publishChunks = [];
let pendingPublishFile = null;
let publishDetailUrl = null;
let publishCoverBlob = null;
const PUBLISH_DRAFT_KEY = 'vibe_publish_draft';

function interestOptionButtons() {
    return [...interestOptions.querySelectorAll('[data-interest]')];
}

async function carregarRespostas(comment, target, trigger) {
    if (!target.hidden) {
        target.hidden = true;
        trigger.textContent = `Ver ${comment.repliesCount} resposta${comment.repliesCount === 1 ? '' : 's'}`;
        return;
    }
    target.replaceChildren();
    target.hidden = false;
    trigger.textContent = 'Carregando…';
    try {
        let replies = [];
        if (activeVideoElement?.dataset.isDemo === 'true') {
            replies = commentsData.filter(item => String(item.parentId) === String(comment.id));
        } else {
            const payload = await apiRequest(`/comments/${comment.id}/replies`);
            replies = payload.data.map(normalizeApiComment);
        }
        if (!replies.length) target.textContent = 'Nenhuma resposta ainda.';
        replies.forEach(item => {
            const line = document.createElement('p');
            line.textContent = `${item.user}: ${item.text}`;
            target.appendChild(line);
        });
        trigger.textContent = 'Ocultar respostas';
    } catch {
        target.textContent = 'Não foi possível carregar as respostas.';
        trigger.textContent = `Ver ${comment.repliesCount} respostas`;
    }
}

function renderInterestOptions() {
    interestOptions.replaceChildren();
    Object.entries(INTEREST_GROUPS).forEach(([groupName, interests]) => {
        const group = document.createElement('section');
        group.className = 'interest-group';
        const title = document.createElement('h3');
        title.textContent = groupName;
        const options = document.createElement('div');
        options.className = 'interest-group-options';
        interests.forEach(interest => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.interest = interest.toLocaleLowerCase();
            button.textContent = interest;
            button.addEventListener('click', () => button.classList.toggle('selected'));
            options.appendChild(button);
        });
        group.append(title, options);
        interestOptions.appendChild(group);
    });
}

function mostrarControleDeSom(visible) {
    if (!audioUnlockButton || !audioIcon) return;
    const muted = !audioUnlocked || audioVolume <= 0;
    audioIcon.className = muted ? 'ri-volume-mute-line' : 'ri-volume-up-line';
    audioUnlockButton.setAttribute('aria-label', muted ? 'Ativar som' : 'Silenciar som');
    if (volumeRange && Number(volumeRange.value) !== audioVolume) volumeRange.value = String(audioVolume);
}

function marcarCabecalhoAtivo(activeItem) {
    headerItems.forEach(item => item.classList.toggle('active', item === activeItem));
}

function renderizarSugestoesPesquisa(items) {
    searchResultsGrid.replaceChildren();
    if (searchFilter === 'users') {
        const users = [...new Map(items.filter(item => item.authorId).map(item => [String(item.authorId), item])).values()];
        if (!users.length) {
            const empty = document.createElement('p');
            empty.className = 'feed-message';
            empty.textContent = 'Nenhum usuário encontrado.';
            searchResultsGrid.appendChild(empty);
            return;
        }
        users.slice(0, 30).forEach(videoData => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'search-user-card';
            const avatar = document.createElement('img');
            avatar.src = safeMediaUrl(videoData.author?.avatar_url) || 'img/vibe-mark.png';
            avatar.alt = '';
            const details = document.createElement('span');
            const name = document.createElement('strong');
            name.textContent = videoData.user || '@vibe';
            const description = document.createElement('small');
            description.textContent = videoData.description || 'Ver perfil';
            details.append(name, description);
            card.append(avatar, details);
            card.addEventListener('click', () => void abrirPerfil('videos', videoData.authorId));
            searchResultsGrid.appendChild(card);
        });
        return;
    }
    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'feed-message';
        empty.textContent = 'Nenhum vídeo encontrado.';
        searchResultsGrid.appendChild(empty);
        return;
    }

    const orderedItems = searchFilter === 'top'
        ? [...items].sort((a, b) => Number(b.likes ?? b.likes_count ?? 0) - Number(a.likes ?? a.likes_count ?? 0))
        : items;
    orderedItems.slice(0, 24).forEach((videoData, index) => {
        const card = document.createElement('article');
        card.className = 'search-video-card';
        const video = document.createElement('video');
        video.src = safeMediaUrl(videoData.src || videoData.video_url);
        video.poster = safeMediaUrl(videoData.thumbnail_url);
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        card.addEventListener('click', event => {
            if (event.target.closest('.hashtag-link')) return;
            abrirFeedDePesquisa(orderedItems.slice(0, 24), index);
        });
        const info = document.createElement('div');
        info.className = 'search-video-info';
        const description = document.createElement('strong');
        renderizarTextoComHashtags(description, videoData.description || 'Vídeo no Vibe');
        const meta = document.createElement('span');
        meta.textContent = `◉ ${formatCount(videoData.view_count)} visualizações · ${videoData.user || videoData.author?.username || '@vibe'}`;
        info.append(description, meta);
        card.append(video, info);
        searchResultsGrid.appendChild(card);
    });
}

function abrirHashtag(hashtag) {
    const normalized = String(hashtag).startsWith('#') ? String(hashtag) : `#${hashtag}`;
    if (!searchMode) abrirPesquisa();
    searchInput.value = normalized;
    searchFilter = 'videos';
    document.querySelectorAll('[data-search-filter]').forEach(item => item.classList.toggle('active', item.dataset.searchFilter === 'videos'));
    salvarHistoricoPesquisa(normalized);
    void executarPesquisa();
}

function renderizarUsuariosRecomendados(users) {
    if (!discoverSuggestions || !discoverSuggestionsList) return;
    discoverSuggestionsList.replaceChildren();
    if (!users.length) {
        discoverSuggestions.hidden = true;
        return;
    }
    users.slice(0, 8).forEach(user => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'discover-user-card';
        const avatar = document.createElement('img');
        avatar.src = safeMediaUrl(user.avatar_url) || 'img/vibe-mark.png';
        avatar.alt = '';
        const details = document.createElement('span');
        const name = document.createElement('strong');
        name.textContent = `@${user.username || 'vibe'}`;
        const reason = document.createElement('small');
        reason.textContent = user.shared_interests?.length ? `Interesse em ${user.shared_interests.slice(0, 2).join(', ')}` : `${formatCount(user.followers_count || 0)} seguidores`;
        details.append(name, reason);
        card.append(avatar, details);
        card.addEventListener('click', () => void abrirPerfil('videos', user.id));
        discoverSuggestionsList.appendChild(card);
    });
    discoverSuggestions.hidden = false;
}

async function carregarUsuariosRecomendados() {
    if (!discoverSuggestions) return;
    try {
        const payload = await apiRequest('/users/recommended', { includeAuth: Boolean(authToken) });
        renderizarUsuariosRecomendados(payload.data || []);
    } catch {
        const users = [...new Map(feedVideos.filter(item => item.authorId).map(item => [String(item.authorId), {
            id: item.authorId,
            username: String(item.user || '').replace(/^@/, ''),
            avatar_url: item.author?.avatar_url,
            followers_count: 0,
        }])).values()];
        renderizarUsuariosRecomendados(users);
    }
}

function abrirPesquisa() {
    searchMode = true;
    document.getElementById('top').classList.add('search-page-active');
    marcarCabecalhoAtivo(btnSearch);
    searchToolbar.hidden = false;
    searchPage.hidden = false;
    renderizarSugestoesPesquisa(feedVideos);
    searchInput.focus();
    searchStatus.textContent = 'Digite um termo para buscar vídeos, usuários ou hashtags.';
    void carregarUsuariosRecomendados();
}

function fecharPesquisa({ reloadFeed = true } = {}) {
    searchMode = false;
    document.getElementById('top').classList.remove('search-page-active');
    searchToolbar.hidden = true;
    searchPage.hidden = true;
    searchInput.value = '';
    searchStatus.textContent = '';
    marcarCabecalhoAtivo(btnFollowing);
    if (reloadFeed) void loadInitialFeed();
}

async function voltarParaInicio({ randomize = false } = {}) {
    fecharNotificacoes();
    if (document.getElementById('top').classList.contains('profile-page-active')) fecharPerfil();
    if (searchMode) fecharPesquisa({ reloadFeed: false });
    await loadInitialFeed('discover', { randomize });
}

function abrirFeedDePesquisa(items, selectedIndex = 0, { preserveOrder = false } = {}) {
    if (!items?.length) return;
    const orderedItems = preserveOrder
        ? [...items.slice(selectedIndex), ...items.slice(0, selectedIndex)]
        : items;
    const selected = orderedItems[0];
    const related = preserveOrder
        ? orderedItems.slice(1)
        : ordenarFeedPorInteresses(items.filter(item => item !== selected));
    feedVideos = [selected, ...related];
    nextFeedUrl = null;
    feedMode = 'search';
    searchMode = false;
    document.getElementById('top').classList.remove('search-page-active');
    searchToolbar.hidden = true;
    searchPage.hidden = true;
    marcarCabecalhoAtivo(btnSearch);
    renderVideos(feedVideos);
    refreshVideoBindings();
    const firstVideo = container.querySelector('video');
    if (firstVideo) {
        manuallyStartedVideos.add(firstVideo);
        firstVideo.dataset.userRequested = 'true';
    }
    requestAnimationFrame(() => container.scrollTo({ top: 0, behavior: 'auto' }));
}

async function executarPesquisa() {
    const query = searchInput.value.trim();
    if (!query) {
        searchStatus.textContent = 'Digite algo para pesquisar.';
        return;
    }

    searchStatus.textContent = 'Pesquisando…';
    registrarSinalTermos(query, 2);
    try {
        if (feedVideos.some(video => video.isDemo === true)) {
            const normalizedQuery = query.toLocaleLowerCase();
            feedVideos = feedVideos.filter(video => `${video.user} ${video.description}`.toLocaleLowerCase().includes(normalizedQuery));
            if (searchSort?.value === 'popular') feedVideos.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            if (searchSort?.value === 'recent') feedVideos.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
            if (searchSort?.value === 'longest') feedVideos.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0));
            nextFeedUrl = null;
            renderizarSugestoesPesquisa(feedVideos);
            searchStatus.textContent = `${feedVideos.length} resultado(s) encontrado(s).`;
            return;
        }

        const sort = searchSort?.value || 'relevance';
        const payload = await apiRequest(`/videos?search=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}&per_page=30`, { includeAuth: Boolean(authToken) });
        feedVideos = (payload.data || []).map(normalizeApiVideo);
        nextFeedUrl = null;
        renderizarSugestoesPesquisa(feedVideos);
        searchStatus.textContent = `${feedVideos.length} resultado(s) encontrado(s).`;
    } catch (error) {
        searchStatus.textContent = error.message || 'Não foi possível realizar a pesquisa.';
    }
}

// --- 4. Eventos ---
commentsContent.addEventListener('click', e => e.stopPropagation());
dismissFeedNotice.addEventListener('click', () => { feedNotice.hidden = true; });
retryFeed.addEventListener('click', () => {
    feedNotice.hidden = true;
    void loadInitialFeed(feedMode);
});
commentsNotice.addEventListener('click', () => {
    if (!authenticatedUser) solicitarAutenticacao('Entre para publicar um comentário.');
});
closeComments.addEventListener('click', fecharComentarios);
closeVideoOptions.addEventListener('click', fecharOpcoesVideo);
videoOptionsModal.addEventListener('click', event => { if (event.target === videoOptionsModal) fecharOpcoesVideo(); });
videoOptionsModal.querySelectorAll('[data-video-option]').forEach(button => button.addEventListener('click', () => void executarOpcaoVideo(button.dataset.videoOption)));
commentsModal.addEventListener('click', e => {
    if (!commentsContent.contains(e.target)) {
        fecharComentarios();
    }
});
document.addEventListener('click', e => {
    if (!commentsModal.classList.contains('active')) return;
    if (commentsContent.contains(e.target)) return;
    if (e.target.closest('.sidebar-icon.comment')) return;
    fecharComentarios();
});

btnSearch.addEventListener('click', () => {
    fecharNotificacoes();
    abrirPesquisa();
});
document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    void voltarParaInicio({ randomize: true });
});
btnFollowing.addEventListener('click', () => {
    fecharNotificacoes();
    if (searchMode) fecharPesquisa();
    void loadInitialFeed('following');
});
searchClose.addEventListener('click', fecharPesquisa);
searchForm.addEventListener('submit', event => {
    event.preventDefault();
    salvarHistoricoPesquisa(searchInput.value);
    void executarPesquisa();
});
document.querySelectorAll('[data-search-filter]').forEach(button => button.addEventListener('click', () => {
    searchFilter = button.dataset.searchFilter || 'top';
    document.querySelectorAll('[data-search-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderizarSugestoesPesquisa(feedVideos);
}));
renderInterestOptions();
saveInterestsButton.addEventListener('click', () => void salvarInteresses());
skipInterestsButton.addEventListener('click', () => void pularInteresses());

btnInicio.addEventListener('click', () => void voltarParaInicio());
btnDiscover.addEventListener('click', () => void voltarParaInicio());
btnProfile.addEventListener('click', () => {
    fecharNotificacoes();
    if (authenticatedUser) void abrirPerfil();
    else abrirAutenticacao();
});
btnInbox.addEventListener('click', () => {
    if (document.getElementById('top').classList.contains('profile-page-active')) fecharPerfil();
    abrirNotificacoes();
});
closeNotifications.addEventListener('click', fecharNotificacoes);
discoverSuggestionsRefresh?.addEventListener('click', () => void carregarUsuariosRecomendados());
notificationsModal.addEventListener('click', event => {
    if (event.target === notificationsModal) fecharNotificacoes();
});
welcomeLogin.addEventListener('click', () => {
    welcomeGate.hidden = true;
    abrirAutenticacao();
});
welcomeVisitor.addEventListener('click', () => { welcomeGate.hidden = true; });
function fecharPublicacao() {
    if (publishRecorder && publishRecorder.state !== 'inactive') publishRecorder.stop();
    publishStream?.getTracks().forEach(track => track.stop());
    publishStream = null;
    publishPreview.srcObject = null;
    publishPreview.hidden = true;
    publishStop.hidden = true;
    publishRecord.disabled = false;
    publishSubmit.disabled = false;
    publishBack.disabled = false;
    pendingPublishFile = null;
    if (publishDetailUrl) URL.revokeObjectURL(publishDetailUrl);
    publishDetailUrl = null;
    publishDetailPreview.removeAttribute('src');
    publishDetailPreview.load();
    publishTrimVideo.removeAttribute('src');
    publishTrimVideo.load();
    publishCoverRange.value = '0';
    publishCoverRange.max = '0';
    publishCoverBlob = null;
    publishTrimStart.value = '0';
    publishTrimEnd.value = '0';
    publishTrimStartRange.value = '0';
    publishTrimStartRange.max = '0';
    publishTrimEndRange.value = '0';
    publishTrimEndRange.max = '0';
    publishTrimTime.textContent = '0:00 – 0:00';
    publishTrimSelection.style.left = '0%';
    publishTrimSelection.style.right = '0%';
    publishCoverCanvas.getContext('2d')?.clearRect(0, 0, publishCoverCanvas.width, publishCoverCanvas.height);
    publishActions.hidden = false;
    publishEditor.hidden = true;
    publishDescription.value = '';
    publishDescriptionCount.textContent = '0/1000 · # 0/10';
    publishLocation.value = '';
    publishVisibility.value = 'public';
    publishSchedule.value = '';
    publishAllowComments.checked = true;
    publishAllowReuse.checked = true;
    publishAiGenerated.checked = false;
    publishAgeRestricted.checked = false;
    publishHighQuality.checked = true;
    atualizarProgressoPublicacao(0, false);
    publishStatus.textContent = 'Escolha uma opção para publicar no Vibe.';
    publishModal.classList.remove('active');
    publishModal.setAttribute('aria-hidden', 'true');
}

function abrirPublicacao() {
    videos?.forEach(video => video.pause());
    publishModal.classList.add('active');
    publishModal.setAttribute('aria-hidden', 'false');
}

function prepararPublicacao(file) {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
        setFeedStatus('Escolha um arquivo de vídeo válido.', { visible: true });
        return;
    }
    pendingPublishFile = file;
    if (publishDetailUrl) URL.revokeObjectURL(publishDetailUrl);
    publishDetailUrl = URL.createObjectURL(file);
    publishDetailPreview.src = publishDetailUrl;
    publishTrimVideo.src = publishDetailUrl;
    try {
        const draft = JSON.parse(localStorage.getItem(PUBLISH_DRAFT_KEY) || 'null');
        if (draft) {
            publishDescription.value = String(draft.description || '').slice(0, 1000);
            publishLocation.value = String(draft.location || '').slice(0, 120);
            publishVisibility.value = ['public', 'followers', 'private'].includes(draft.visibility) ? draft.visibility : 'public';
            publishAllowComments.checked = draft.allowComments !== false;
            publishSchedule.value = String(draft.scheduledAt || '');
            publishAllowReuse.checked = draft.allowReuse !== false;
            publishAiGenerated.checked = draft.aiGenerated === true;
            publishAgeRestricted.checked = draft.ageRestricted === true;
            publishHighQuality.checked = draft.highQuality !== false;
            atualizarContadorDescricao();
        }
    } catch { /* rascunho inválido é ignorado */ }
    publishActions.hidden = true;
    publishStop.hidden = true;
    publishPreview.hidden = true;
    publishEditor.hidden = false;
    publishStatus.textContent = 'Revise os detalhes antes de publicar.';
    publishModal.classList.add('active');
    publishModal.setAttribute('aria-hidden', 'false');
}

function atualizarProgressoPublicacao(percent, visible = true, label = 'Enviando vídeo…') {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    publishProgress.hidden = !visible;
    publishContent.inert = visible;
    publishProgressCircle.style.setProperty('--progress', `${value}%`);
    publishProgressValue.textContent = `${value}%`;
    publishProgressLabel.textContent = label;
}

function capturarCapaPublicacao() {
    const video = publishDetailPreview;
    const canvas = publishCoverCanvas;
    if (!video.videoWidth || !video.videoHeight) return;
    const ratio = video.videoWidth / video.videoHeight;
    canvas.width = 320;
    canvas.height = Math.max(180, Math.round(320 / ratio));
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => { publishCoverBlob = blob; }, 'image/jpeg', .86);
}

function desenharFaixaCorte() {
    if (!publishDetailPreview.videoWidth || !publishDetailPreview.videoHeight) return;
    const context = publishTrimStrip.getContext('2d');
    const width = publishTrimStrip.width;
    const height = publishTrimStrip.height;
    context.clearRect(0, 0, width, height);
    context.drawImage(publishDetailPreview, 0, 0, width, height);
}

function atualizarFaixaCorte(previewTime = null) {
    const duration = Number(publishDetailPreview.duration) || 0;
    if (!duration) return;
    let start = Math.max(0, Math.min(Number(publishTrimStartRange.value) || 0, duration));
    let end = Math.max(0, Math.min(Number(publishTrimEndRange.value) || duration, duration));
    if (end <= start) end = Math.min(duration, start + .1);
    publishTrimStartRange.value = String(start);
    publishTrimEndRange.value = String(end);
    publishTrimStart.value = start.toFixed(1);
    publishTrimEnd.value = end.toFixed(1);
    publishTrimSelection.style.left = `${(start / duration) * 100}%`;
    publishTrimSelection.style.right = `${100 - (end / duration) * 100}%`;
    publishTrimTime.textContent = `${formatTime(start)} – ${formatTime(end)}`;
    const nextPreviewTime = previewTime === null ? start : previewTime;
    if (publishTrimVideo.readyState >= 1) publishTrimVideo.currentTime = nextPreviewTime;
    if (publishDetailPreview.readyState >= 1) publishDetailPreview.currentTime = nextPreviewTime;
}

publishDetailPreview.addEventListener('loadedmetadata', () => {
    const duration = Number.isFinite(publishDetailPreview.duration) ? publishDetailPreview.duration : 0;
    publishCoverRange.max = String(duration);
    publishCoverRange.value = '0';
    publishTrimStart.value = '0';
    publishTrimEnd.value = duration.toFixed(1);
    publishTrimStartRange.max = String(duration);
    publishTrimEndRange.max = String(duration);
    publishTrimEndRange.value = String(duration);
    desenharFaixaCorte();
    atualizarFaixaCorte();
    capturarCapaPublicacao();
});
publishCoverRange.addEventListener('input', () => {
    const targetTime = Number(publishCoverRange.value) || 0;
    publishDetailPreview.currentTime = targetTime;
    publishDetailPreview.addEventListener('seeked', capturarCapaPublicacao, { once: true });
});
publishTrimStartRange.addEventListener('input', () => atualizarFaixaCorte(Number(publishTrimStartRange.value)));
publishTrimEndRange.addEventListener('input', () => atualizarFaixaCorte(Number(publishTrimEndRange.value)));
publishTrimStart.addEventListener('input', () => {
    publishTrimStartRange.value = publishTrimStart.value;
    atualizarFaixaCorte(Number(publishTrimStart.value));
});
publishTrimEnd.addEventListener('input', () => {
    publishTrimEndRange.value = publishTrimEnd.value;
    atualizarFaixaCorte(Number(publishTrimEnd.value));
});
let activeTrimHandle = null;
function atualizarCortePelaPosicao(clientX) {
    const duration = Number(publishDetailPreview.duration) || 0;
    if (!duration) return;
    const bounds = publishTrimTimeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const time = ratio * duration;
    if (activeTrimHandle === 'start') {
        publishTrimStartRange.value = String(Math.min(time, Number(publishTrimEndRange.value) - .1));
        atualizarFaixaCorte(Number(publishTrimStartRange.value));
    } else if (activeTrimHandle === 'end') {
        publishTrimEndRange.value = String(Math.max(time, Number(publishTrimStartRange.value) + .1));
        atualizarFaixaCorte(Number(publishTrimEndRange.value));
    }
}
publishTrimTimeline.addEventListener('pointerdown', event => {
    const bounds = publishTrimTimeline.getBoundingClientRect();
    const duration = Number(publishDetailPreview.duration) || 0;
    if (!duration) return;
    const time = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * duration;
    const start = Number(publishTrimStartRange.value) || 0;
    const end = Number(publishTrimEndRange.value) || duration;
    activeTrimHandle = Math.abs(time - start) <= Math.abs(time - end) ? 'start' : 'end';
    publishTrimTimeline.setPointerCapture(event.pointerId);
    atualizarCortePelaPosicao(event.clientX);
});
publishTrimTimeline.addEventListener('pointermove', event => {
    if (activeTrimHandle) atualizarCortePelaPosicao(event.clientX);
});
publishTrimTimeline.addEventListener('pointerup', event => {
    activeTrimHandle = null;
    if (publishTrimTimeline.hasPointerCapture(event.pointerId)) publishTrimTimeline.releasePointerCapture(event.pointerId);
});
publishTrimTimeline.addEventListener('pointercancel', () => { activeTrimHandle = null; });

btnUpload.addEventListener('click', () => {
    if (document.getElementById('top').classList.contains('profile-page-active')) fecharPerfil();
    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para publicar um vídeo.');
        return;
    }
    abrirPublicacao();
});
closePublish.addEventListener('click', fecharPublicacao);
publishModal.addEventListener('click', event => {
    if (event.target === publishModal) fecharPublicacao();
});
publishFile.addEventListener('click', () => {
    fecharPublicacao();
    videoFileInput.click();
});
publishRecord.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        publishStatus.textContent = 'Seu dispositivo não permite gravação pelo navegador.';
        return;
    }
    publishRecord.disabled = true;
    publishStatus.textContent = 'Solicitando acesso à câmera e ao microfone…';
    try {
        let audioAvailable = true;
        try {
            publishStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (permissionError) {
            if (permissionError.name !== 'NotAllowedError' && permissionError.name !== 'PermissionDeniedError') throw permissionError;
            publishStatus.textContent = 'Microfone bloqueado. Tentando iniciar somente a câmera…';
            publishStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            audioAvailable = false;
        }
        publishPreview.srcObject = publishStream;
        publishPreview.hidden = false;
        await publishPreview.play().catch(() => {});
        publishChunks = [];
        const supportedType = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
        ].find(type => MediaRecorder.isTypeSupported?.(type));
        publishRecorder = new MediaRecorder(publishStream, {
            ...(supportedType ? { mimeType: supportedType } : {}),
            videoBitsPerSecond: 2_500_000,
            audioBitsPerSecond: 128_000,
        });
        publishRecorder.addEventListener('dataavailable', event => {
            if (event.data.size) publishChunks.push(event.data);
        });
        publishRecorder.addEventListener('stop', () => {
            const type = publishRecorder?.mimeType || 'video/webm';
            const blob = new Blob(publishChunks, { type });
            if (!blob.size) {
                publishStatus.textContent = 'A gravação ficou vazia. Tente novamente.';
                fecharPublicacao();
                return;
            }
            const extension = type.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `vibe-gravacao-${Date.now()}.${extension}`, { type });
            publishStream?.getTracks().forEach(track => track.stop());
            publishStream = null;
            publishPreview.srcObject = null;
            prepararPublicacao(file);
        }, { once: true });
        publishRecorder.addEventListener('error', () => {
            publishStatus.textContent = 'O navegador interrompeu a gravação. Tente novamente.';
            fecharPublicacao();
        }, { once: true });
        publishRecorder.start(250);
        publishStop.hidden = false;
        publishStatus.textContent = audioAvailable
            ? 'Gravando… clique em parar quando terminar.'
            : 'Gravando sem áudio. Clique em parar quando terminar.';
    } catch (error) {
        console.error(error);
        publishStream?.getTracks().forEach(track => track.stop());
        publishStream = null;
        publishRecord.disabled = false;
        publishStatus.textContent = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
            ? 'Acesso bloqueado. No Chrome, clique no cadeado ao lado de localhost, permita câmera e microfone e tente novamente.'
            : 'Não foi possível acessar a câmera e o microfone.';
    }
});
publishStop.addEventListener('click', () => {
    if (publishRecorder && publishRecorder.state !== 'inactive') publishRecorder.stop();
});
publishBack.addEventListener('click', () => {
    fecharPublicacao();
    abrirPublicacao();
});
function contarHashtags(text) {
    return (text.match(/(^|\s)#([\p{L}\p{N}_]+)/gu) || []).length;
}
function atualizarContadorDescricao() {
    const hashtags = contarHashtags(publishDescription.value);
    publishDescriptionCount.textContent = `${publishDescription.value.length}/1000 · # ${hashtags}/10`;
    publishDescriptionCount.classList.toggle('hashtag-limit', hashtags > 10);
}
publishDescription.addEventListener('input', () => {
    atualizarContadorDescricao();
    salvarRascunhoPublicacao();
});
function salvarRascunhoPublicacao() {
    try {
        localStorage.setItem(PUBLISH_DRAFT_KEY, JSON.stringify({
            description: publishDescription.value,
            location: publishLocation.value,
            visibility: publishVisibility.value,
            scheduledAt: publishSchedule.value,
            allowComments: publishAllowComments.checked,
            allowReuse: publishAllowReuse.checked,
            aiGenerated: publishAiGenerated.checked,
            ageRestricted: publishAgeRestricted.checked,
            highQuality: publishHighQuality.checked,
        }));
    } catch { /* armazenamento indisponível não impede a publicação */ }
}
publishLocation.addEventListener('input', salvarRascunhoPublicacao);
publishVisibility.addEventListener('change', salvarRascunhoPublicacao);
publishAllowComments.addEventListener('change', salvarRascunhoPublicacao);
publishSchedule.addEventListener('change', salvarRascunhoPublicacao);
publishAllowReuse.addEventListener('change', salvarRascunhoPublicacao);
publishAiGenerated.addEventListener('change', salvarRascunhoPublicacao);
publishAgeRestricted.addEventListener('change', salvarRascunhoPublicacao);
publishHighQuality.addEventListener('change', salvarRascunhoPublicacao);
publishSubmit.addEventListener('click', async () => {
    if (!pendingPublishFile) return;
    const hashtagCount = contarHashtags(publishDescription.value);
    if (hashtagCount > 10) {
        publishStatus.textContent = 'Use no máximo 10 hashtags na descrição.';
        publishDescription.focus();
        return;
    }
    const originalFile = pendingPublishFile;
    const metadata = {
        description: publishDescription.value.trim(),
        location: publishLocation.value.trim(),
        visibility: publishVisibility.value,
        scheduled_at: publishSchedule.value || null,
        allow_comments: publishAllowComments.checked,
        allow_reuse: publishAllowReuse.checked,
        is_ai_generated: publishAiGenerated.checked,
        age_restricted: publishAgeRestricted.checked,
        high_quality: publishHighQuality.checked,
    };
    publishSubmit.disabled = true;
    publishStatus.textContent = 'Preparando o vídeo…';
    const file = await cortarVideoSeNecessario(originalFile);
    publishSubmit.disabled = false;
    void publicarVideo(file, metadata);
});
audioUnlockButton.addEventListener('click', () => {
    const target = activeVideoElement || videos?.[activeVideoIndex] || videos?.[0];
    if (!target) return;

    if (!audioUnlocked || audioVolume <= 0) {
        target.dataset.userRequested = 'true';
        manuallyStartedVideos.add(target);
        unlockAudio(target, 1);
        playVideo(target);
    } else {
        audioVolume = 0;
        target.muted = true;
        mostrarControleDeSom(true);
    }
});
volumeRange.addEventListener('input', () => {
    const target = activeVideoElement || videos?.[activeVideoIndex] || videos?.[0];
    audioVolume = Number(volumeRange.value);
    if (audioVolume > 0) {
        audioUnlocked = true;
        if (target) {
            target.dataset.userRequested = 'true';
            manuallyStartedVideos.add(target);
            target.muted = false;
            target.volume = audioVolume;
            void target.play().catch(() => {});
        }
    } else if (target) {
        target.muted = true;
    }
    mostrarControleDeSom(true);
});
videoFileInput.addEventListener('change', () => prepararPublicacao(videoFileInput.files?.[0]));
closeAuth.addEventListener('click', fecharAutenticacao);
authModal.addEventListener('click', event => {
    if (event.target === authModal) fecharAutenticacao();
});
authToggle.addEventListener('click', alternarModoAutenticacao);
authForgot.addEventListener('click', () => void solicitarRedefinicaoSenha());
authForm.addEventListener('submit', event => {
    event.preventDefault();
    void enviarAutenticacao();
});
logoutButton.addEventListener('click', () => void sairDaConta());
closeProfile.addEventListener('click', fecharPerfil);
profileModal.addEventListener('click', event => {
    if (event.target === profileModal) fecharPerfil();
});
profileBack.addEventListener('click', fecharPerfil);
profileAvatar.addEventListener('click', () => abrirVisualizadorImagemPerfil('avatar'));
profileCover.addEventListener('click', event => {
    if (!event.target.closest('.profile-cover-upload')) abrirVisualizadorImagemPerfil('cover');
});
profileImageViewerClose.addEventListener('click', fecharVisualizadorImagemPerfil);
profileImageViewer.addEventListener('click', event => {
    if (event.target === profileImageViewer) fecharVisualizadorImagemPerfil();
});
profileImageViewerChange.addEventListener('click', () => {
    profileImageInput.dataset.imageType = profileImageViewerChange.dataset.imageType || 'avatar';
    fecharVisualizadorImagemPerfil();
    profileImageInput.click();
});
profileVideoViewerClose.addEventListener('click', fecharVisualizadorVideoPerfil);
profileVideoViewer.addEventListener('click', event => {
    if (event.target === profileVideoViewer) fecharVisualizadorVideoPerfil();
});
profileEdit.addEventListener('click', () => {
    profileForm.hidden = !profileForm.hidden;
});
profileShare.addEventListener('click', compartilharPerfil);
profilePlaylists.addEventListener('click', () => void abrirPlaylists());
profileHiddenUsers.addEventListener('click', () => void abrirPessoas('hidden'));
profileFollow.addEventListener('click', () => void alternarSeguirPerfil());
profileAvatarUpload.addEventListener('click', () => {
    profileImageInput.dataset.imageType = 'avatar';
    profileImageInput.click();
});
profileImageInput.addEventListener('change', () => {
    const file = profileImageInput.files?.[0];
    if (!file) return;
    if (profileImageInput.dataset.imageType === 'cover') abrirEditorCapa(file);
    else void enviarImagemPerfil(file);
});
profileCoverUpload.addEventListener('click', () => {
    profileImageInput.dataset.imageType = 'cover';
    profileImageInput.click();
});
document.querySelectorAll('.close-crop').forEach(button => button.addEventListener('click', fecharEditorCapa));
cropX.addEventListener('input', atualizarPreviaCapa);
cropY.addEventListener('input', atualizarPreviaCapa);
cropZoom.addEventListener('input', atualizarPreviaCapa);
cropImage.addEventListener('pointerdown', iniciarArrasteCapa);
cropImage.addEventListener('pointermove', moverArrasteCapa);
cropImage.addEventListener('pointerup', finalizarArrasteCapa);
cropImage.addEventListener('pointercancel', finalizarArrasteCapa);
cropImage.addEventListener('dragstart', event => event.preventDefault());
confirmCrop.addEventListener('click', () => void confirmarCorteCapa());
profileForm.addEventListener('submit', event => {
    event.preventDefault();
    void salvarPerfil();
});
profileTabs.forEach(tab => {
    tab.addEventListener('click', () => void abrirPerfil(tab.dataset.profileTab || 'videos'));
});
profileLogout.addEventListener('click', () => void sairDaConta());
document.getElementById('profile-followers').addEventListener('click', () => void abrirPessoas('followers'));
document.getElementById('profile-following').addEventListener('click', () => void abrirPessoas('following'));
document.querySelector('.close-people').addEventListener('click', fecharPessoas);
document.querySelector('.close-playlists').addEventListener('click', fecharPlaylists);
playlistForm.addEventListener('submit', event => { event.preventDefault(); void criarPlaylist(); });
document.addEventListener('keydown', event => {
    if (!publishProgress.hidden) {
        event.preventDefault();
        return;
    }
    if (event.key !== 'Escape') return;
    if (authModal.classList.contains('active')) fecharAutenticacao();
    else if (profileModal.classList.contains('active')) fecharPerfil();
    else if (notificationsModal.classList.contains('active')) fecharNotificacoes();
    else if (videoOptionsModal.classList.contains('active')) fecharOpcoesVideo();
    else if (profileImageViewer.classList.contains('active')) fecharVisualizadorImagemPerfil();
    else if (peopleModal.classList.contains('active')) fecharPessoas();
    else if (playlistsModal.classList.contains('active')) fecharPlaylists();
    else if (commentsModal.classList.contains('active')) fecharComentarios();
});

sendComment.addEventListener('click', () => void adicionarComentario());
commentInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        void adicionarComentario();
    }
});

container.addEventListener('click', e => {
    const profileLink = e.target.closest('.profile-link');
    if (profileLink?.dataset.userId) {
        void abrirPerfil('videos', profileLink.dataset.userId);
        return;
    }
    const likeButton = e.target.closest('.sidebar-icon.like');
    const favoriteButton = e.target.closest('.sidebar-icon.favorite');
    const commentButton = e.target.closest('.sidebar-icon.comment');
    const shareButton = e.target.closest('.sidebar-icon.share');
    const moreButton = e.target.closest('.sidebar-icon.more');
    const followButton = e.target.closest('.video-follow');

    if (followButton) {
        e.stopPropagation();
        void alternarSeguirNoFeed(followButton);
        return;
    }
    if (moreButton) {
        optionsVideo = moreButton.closest('.video-container')?.querySelector('video') || null;
        videoOptionsModal.classList.add('active');
        videoOptionsModal.setAttribute('aria-hidden', 'false');
        return;
    }

    if (likeButton) {
        void toggleLike(likeButton);
        return;
    }

    if (favoriteButton) {
        void toggleFavorite(favoriteButton);
        return;
    }

    if (commentButton) {
        const video = e.target.closest('.video-container')?.querySelector('video');
        if (video) void abrirComentarios(video);
        return;
    }

    if (shareButton) {
        const video = e.target.closest('.video-container')?.querySelector('video');
        if (!video) return;
        compartilharVideo(video);
    }
});

// --- 5. Vídeos ---

function unlockAudio(video, volume = 1) {
    audioUnlocked = true;
    audioVolume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (typeof mostrarControleDeSom === 'function') mostrarControleDeSom(false);
    if (video) {
        video.muted = audioVolume <= 0;
        video.volume = audioVolume;
    }
}

function alternarReproducao(video) {
    video.dataset.userRequested = 'true';
    manuallyStartedVideos.add(video);
    if (!audioUnlocked || video.muted) {
        unlockAudio(video);
        playVideo(video);
        return;
    }

    if (video.paused) {
        playVideo(video);
    } else {
        video.pause();
        setPlayIconState(video, false);
    }
}

function configurarVideo(video) {
    if (video.dataset.eventsBound === 'true') return;
    video.dataset.eventsBound = 'true';
    const videoContainer = video.closest('.video-container');

    // Indica carregamento sem bloquear os controles e remove o estado assim
    // que o navegador tiver dados suficientes para continuar reproduzindo.
    const marcarBuffering = () => videoContainer?.classList.add('is-buffering');
    const removerBuffering = () => videoContainer?.classList.remove('is-buffering');
    video.addEventListener('waiting', marcarBuffering);
    video.addEventListener('stalled', marcarBuffering);
    video.addEventListener('canplay', removerBuffering);
    video.addEventListener('playing', removerBuffering);
    video.addEventListener('error', removerBuffering);

    let clickTimeout = null;
    let lastClickTime = 0;
    const doubleClickThreshold = 250;

    video.addEventListener('click', event => {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime;
        lastClickTime = now;

        // Inicia dentro do gesto do usuário, sem adiar a autorização de áudio.
        if (!audioUnlocked || (video === videos[0] && !manuallyStartedVideos.has(video))) {
            alternarReproducao(video);
            return;
        }

        if (timeSinceLastClick < doubleClickThreshold) {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            unlockAudio(video);
            const likeButton = video.parentElement.querySelector('.sidebar-icon.like');
            if (likeButton) void toggleLike(likeButton, true);
            return;
        }

        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }

        clickTimeout = setTimeout(() => {
            clickTimeout = null;
            alternarReproducao(video);
        }, doubleClickThreshold);
    });

    const progressBar = getProgressBar(video);
    if (progressBar) {
        let draggingProgress = false;
        const seekFromPointer = event => {
            // A primeira interação precisa ser registrada mesmo se o metadata
            // ainda estiver carregando; assim o guard inicial não reinicia o vídeo.
            manuallyStartedVideos.add(video);
            video.dataset.userRequested = 'true';
            if (!video.duration) return;
            const rect = progressBar.getBoundingClientRect();
            if (!rect.width) return;
            const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            video.currentTime = percentage * video.duration;
            atualizarBarraProgresso(video);
        };
        progressBar.addEventListener('pointerdown', event => {
            event.preventDefault();
            event.stopPropagation();
            draggingProgress = true;
            progressBar.setPointerCapture?.(event.pointerId);
            seekFromPointer(event);
        }, true);
        progressBar.addEventListener('pointermove', event => {
            if (!draggingProgress) return;
            event.preventDefault();
            event.stopPropagation();
            seekFromPointer(event);
        });
        const stopDragging = event => {
            if (!draggingProgress) return;
            event?.stopPropagation();
            draggingProgress = false;
            if (event?.pointerId !== undefined) progressBar.releasePointerCapture?.(event.pointerId);
        };
        progressBar.addEventListener('pointerup', stopDragging);
        progressBar.addEventListener('pointercancel', stopDragging);
        progressBar.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            seekFromPointer(event);
        });
    }

    video.addEventListener('dblclick', event => {
        event.preventDefault();
        clearTimeout(clickTimeout);
        clickTimeout = null;
        lastClickTime = 0;
        const likeButton = video.parentElement.querySelector('.sidebar-icon.like');
        if (likeButton && !likeButton.querySelector('i').classList.contains('liked')) {
            void toggleLike(likeButton, true);
        }

        const heart = document.createElement('i');
        heart.className = 'ri-heart-fill floating-heart';

        const rect = video.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;

        video.parentElement.appendChild(heart);
        setTimeout(() => heart.remove(), 800);
    });

    video.addEventListener('timeupdate', () => atualizarBarraProgresso(video));
    bindProgressAnimation(video);
    video.addEventListener('timeupdate', () => {
        const progress = video.duration ? video.currentTime / video.duration : 0;
        if (progress >= 0.5 && video.dataset.halfWatched !== 'true') {
            video.dataset.halfWatched = 'true';
            if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 1);
        }
        if (progress >= 0.9 && !completedVideos.has(video)) {
            completedVideos.add(video);
            if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 2);
        } else if (video.currentTime < 0.2 && completedVideos.has(video)) {
            completedVideos.delete(video);
            video.dataset.halfWatched = 'false';
        }
    });
}

function adicionarEventosVideos() {
    videos.forEach(video => configurarVideo(video));
}

function marcarVideoIndisponivel(video) {
    if (!video || video.dataset.unavailable === 'true') return;
    video.dataset.unavailable = 'true';
    video.pause();
    video.closest('.video-container')?.classList.add('media-unavailable');
    playbackAttempts.delete(video);
    if (activeVideoElement === video) activeVideoElement = null;
}

function playVideo(video) {
    if (video === videos[0] && !manuallyStartedVideos.has(video)) {
        pauseVideo(video);
        setPlayIconState(video, false);
        return;
    }
    const attempt = {};
    playbackAttempts.set(video, attempt);
    const currentVolume = typeof audioVolume === 'number' ? audioVolume : 1;
    video.muted = typeof audioVolume === 'number' ? (!audioUnlocked || currentVolume <= 0) : false;
    video.volume = currentVolume;
    video.play().then(() => {
        if (playbackAttempts.get(video) !== attempt) return;
        audioUnlocked = true;
        registrarVisualizacao(video);
        setPlayIconState(video, !video.paused);
    }).catch(error => {
        if (playbackAttempts.get(video) !== attempt) return;
        if (error.name === 'AbortError') return;
        if (video.error || error.name === 'NotSupportedError' || error.name === 'DecodeError') {
            marcarVideoIndisponivel(video);
            return;
        }
        setPlayIconState(video, false);
        if (error.name === 'NotAllowedError') {
            audioUnlocked = false;
            audioVolume = 0;
            setFeedStatus('O navegador bloqueou o som automático. Use o controle de áudio para liberar o som.');
            if (typeof mostrarControleDeSom === 'function') mostrarControleDeSom(true);
            video.muted = true;
            video.play().then(() => {
                if (playbackAttempts.get(video) === attempt) {
                    registrarVisualizacao(video);
                    setPlayIconState(video, !video.paused);
                }
            }).catch(() => {
                if (playbackAttempts.get(video) === attempt) setPlayIconState(video, false);
            });
        } else if (video.dataset.userRequested === 'true') {
            setFeedStatus('Não foi possível reproduzir este vídeo. Clique para tentar novamente.', { visible: true });
        }
    });
}

function pauseVideo(video) {
    if (!video) return;
    playbackAttempts.delete(video);
    const playIcon = getPlayIcon(video);
    video.pause();
    video.currentTime = 0;
    video.muted = true;
    if (playIcon) playIcon.classList.add('active');
}

function registrarVisualizacao(video) {
    const videoId = video?.dataset.videoId;
    if (!videoId || video.dataset.isDemo === 'true' || viewedVideoIds.has(videoId)) return;
    viewedVideoIds.add(videoId);
    void apiRequest(`/videos/${videoId}/view`, { method: 'POST' }).then(payload => {
        const count = Number(payload.data?.view_count) || 0;
        const feedVideo = feedVideos.find(item => String(item.id) === String(videoId));
        if (feedVideo) feedVideo.view_count = count;
    }).catch(() => {
        viewedVideoIds.delete(videoId);
    });
}

function posicionarControleAudio(videoContainer) {
    const videoInfo = videoContainer?.querySelector('.video-info');
    if (!videoInfo) return;
    const aplicar = () => {
        // O primeiro vídeo pode ainda estar calculando fontes e quebras de linha.
        // Medir em dois frames garante que o controle use a altura final do texto.
        // Mantém o ícone alinhado próximo ao início do nome, sem considerar o rodapé.
        videoContainer.style.setProperty('--audio-top-offset', `${Math.max(0, videoInfo.offsetTop - 40)}px`);
    };
    requestAnimationFrame(() => requestAnimationFrame(aplicar));
}

const observerOptions = {
    root: container,
    rootMargin: '0px',
    threshold: 0.6
};

const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;

        const videoIndex = Array.from(videos).indexOf(video);
        if (videoIndex < 0) return;

        if (entry.isIntersecting) {
            const videoContainer = video.closest('.video-container');
            if (videoContainer) {
                videoContainer.appendChild(audioControl);
                audioControl.classList.remove('is-hidden', 'expanded');
                posicionarControleAudio(videoContainer);
            }
            if (commentsModal.classList.contains('active') && activeVideoElement && activeVideoElement !== video) {
                void abrirComentarios(video);
            }
            if (activeVideoIndex >= 0 && activeVideoIndex !== videoIndex) {
                const previousVideo = videos[activeVideoIndex];
                if (previousVideo && previousVideo !== video) {
                    pauseVideo(previousVideo);
                }
            }
            activeVideoIndex = videoIndex;
            activeVideoElement = video;
            video.preload = 'auto';
            const nextVideo = videos[videoIndex + 1];
            if (nextVideo && nextVideo.preload === 'metadata') nextVideo.preload = 'auto';
            const visitCount = Number(video.dataset.visitCount) || 0;
            video.dataset.visitCount = String(visitCount + 1);
            if (visitCount > 0 && typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 2);
            playVideo(video);
        } else if (activeVideoIndex === videoIndex) {
            pauseVideo(video);
            activeVideoIndex = -1;
        }
    });
}, observerOptions);

const audioInfoObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(entries => entries.forEach(entry => posicionarControleAudio(entry.target.closest('.video-container'))))
    : null;

function ativarObservador() {
    const videoContainers = document.querySelectorAll('.video-container');
    videoObserver.disconnect();
    audioInfoObserver?.disconnect();
    videoContainers.forEach(videoContainer => {
        videoObserver.observe(videoContainer);
        const info = videoContainer.querySelector('.video-info');
        if (info) audioInfoObserver?.observe(info);
    });
}

function setFeedStatus(message, { visible = false } = {}) {
    feedStatus.textContent = visible ? '' : message;
    if (visible) {
        feedNoticeText.textContent = message;
        feedNotice.hidden = false;
    }
}

function refreshVideoBindings() {
    videos = container.querySelectorAll('video');
    adicionarEventosVideos();
    ativarObservador();
}

function showEmptyFeed(message) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'feed-message';
    emptyMessage.textContent = message;
    container.replaceChildren(emptyMessage);
}

function showTextMessage(target, message) {
    const messageElement = document.createElement('p');
    messageElement.className = 'notifications-empty';
    messageElement.textContent = message;
    target.replaceChildren(messageElement);
}

function embaralharFeed(items) {
    const shuffledItems = [...items];
    for (let currentIndex = shuffledItems.length - 1; currentIndex > 0; currentIndex -= 1) {
        const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
        [shuffledItems[currentIndex], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[currentIndex]];
    }
    return shuffledItems;
}

function loadDemoFeed(statusMessage, { randomize = false } = {}) {
    isUsingDemoFeed = true;
    nextFeedUrl = null;
    feedVideos = randomize ? embaralharFeed(getDemoVideos()) : ordenarFeedPorInteresses(getDemoVideos());
    renderVideos(feedVideos);
    refreshVideoBindings();
    setFeedStatus(statusMessage);
}

function getDemoVideos() {
    let savedLikes = {};
    let savedFavorites = {};
    let savedShares = {};
    try {
        savedLikes = JSON.parse(localStorage.getItem('vibe_demo_likes') || '{}') || {};
        savedFavorites = JSON.parse(localStorage.getItem('vibe_demo_favorites') || '{}') || {};
        savedShares = JSON.parse(localStorage.getItem('vibe_demo_shares') || '{}') || {};
    } catch { /* O feed continua disponível se o armazenamento estiver bloqueado. */ }
    return videoData.map((video, index) => ({
        ...video,
        id: `demo-${index}`,
        isDemo: true,
        isLiked: savedLikes[video.src] === true,
        likes: video.likes + (savedLikes[video.src] === true ? 1 : 0),
        isFavorite: savedFavorites[video.src] === true,
        favorites: savedFavorites[video.src] === true ? 1 : 0,
        shares: Number(savedShares[video.src]) || 0,
        view_count: Number(video.view_count) || 0,
    }));
}

async function loadInitialFeed(mode = feedMode, { randomize = false } = {}) {
    feedMode = mode;
    isLoadingFeed = true;
    setFeedStatus('Carregando vídeos.');

    try {
        const payload = await fetchFeedPage(null, { feed: feedMode });
        const apiVideos = payload.data.map(normalizeApiVideo);
        nextFeedUrl = payload.links?.next || null;
        isUsingDemoFeed = false;

        if (apiVideos.length === 0 && useDemoFallback) {
            loadDemoFeed('Nenhum vídeo publicado ainda. Exibindo vídeos de demonstração.', { randomize });
            return;
        }

        feedVideos = randomize ? embaralharFeed(apiVideos) : ordenarFeedPorInteresses(apiVideos);
        if (useDemoFallback && apiVideos.length < FEED_PAGE_SIZE) {
            const apiSources = new Set(apiVideos.map(video => video.src));
            feedVideos.push(...getDemoVideos().filter(video => !apiSources.has(video.src)));
            feedVideos = randomize ? embaralharFeed(feedVideos) : ordenarFeedPorInteresses(feedVideos);
            nextFeedUrl = null;
            setFeedStatus(`${apiVideos.length} vídeo(s) da API e demonstrações locais carregados.`);
        }
        if (feedVideos.length === 0) {
            showEmptyFeed('Ainda não há vídeos publicados.');
            setFeedStatus('Ainda não há vídeos publicados.');
            return;
        }

        renderVideos(feedVideos);
        refreshVideoBindings();
    if (randomize) container.scrollTo({ top: 0, behavior: 'auto' });
        if (feedMode === 'following' && !authenticatedUser) {
            setFeedStatus('Entre para ver vídeos de quem você segue.', { visible: true });
        } else {
            setFeedStatus(`${feedVideos.length} vídeos carregados.`);
        }
    } catch (error) {
        console.error(error);

        if (useDemoFallback) {
            loadDemoFeed('Não foi possível conectar à API. Exibindo vídeos de demonstração.', { randomize });
            return;
        }

        showEmptyFeed('Não foi possível carregar o feed. Tente novamente em instantes.');
    setFeedStatus('Não foi possível carregar o feed.', { visible: true });
    } finally {
        isLoadingFeed = false;
    }
}

async function loadMoreFeed() {
    if (isLoadingFeed || isUsingDemoFeed || !nextFeedUrl) return;

    isLoadingFeed = true;
    setFeedStatus('Carregando mais vídeos.');

    try {
        const payload = await fetchFeedPage(nextFeedUrl);
        const moreVideos = payload.data.map(normalizeApiVideo);
        nextFeedUrl = payload.links?.next || null;

        if (moreVideos.length === 0) {
            setFeedStatus('Você chegou ao fim do feed.');
            return;
        }

        feedVideos.push(...moreVideos);
        renderVideos(moreVideos, true);
        refreshVideoBindings();
        setFeedStatus(`${moreVideos.length} vídeos adicionais carregados.`);
    } catch (error) {
        console.error(error);
        setFeedStatus('Não foi possível carregar mais vídeos.', { visible: true });
    } finally {
        isLoadingFeed = false;
    }
}

function handleFeedScroll() {
    const remainingScroll = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remainingScroll < container.clientHeight * 2) {
        void loadMoreFeed();
    }
}

async function initVideos() {
    container.addEventListener('scroll', handleFeedScroll, { passive: true });
    await loadInitialFeed();
}

function setAuthError(message = '') {
    authError.textContent = message;
    authError.hidden = message === '';
}

function atualizarInterfaceAutenticacao() {
    const isAuthenticated = Boolean(authenticatedUser);
    btnProfile.querySelector('span').textContent = isAuthenticated ? 'EU' : 'Entrar';
    authAccount.hidden = !isAuthenticated;
    authForm.hidden = isAuthenticated;
    if (notificationTabModeration) notificationTabModeration.hidden = !isAuthenticated || authenticatedUser.is_moderator !== true;

    if (isAuthenticated) {
        const username = authenticatedUser.username || authenticatedUser.name;
        authUserName.textContent = username.startsWith('@') ? username : `@${username}`;
    }
}

let profileTargetUserId = null;
let viewingOwnProfile = true;
let profileActiveTab = 'videos';

function renderizarPerfil(data) {
    const user = data.user;
    profileModal.classList.toggle('viewing-other-profile', !viewingOwnProfile);
    profileBack.hidden = viewingOwnProfile;
    profileAvatarUpload.hidden = !viewingOwnProfile;
    profileCoverUpload.hidden = !viewingOwnProfile;
    profileTabs.forEach(tab => {
        tab.hidden = !viewingOwnProfile && tab.dataset.profileTab !== 'videos';
    });
    profileAvatar.src = safeMediaUrl(user.avatar_url) || 'img/vibe-mark.png';
    profileCover.src = safeMediaUrl(user.cover_url) || '';
    profileCover.parentElement.classList.toggle('has-image', Boolean(user.cover_url));
    profileName.textContent = user.name || 'Vibe';
    profileUsername.textContent = `@${String(user.username || 'vibe').replace(/^@/, '')}`;
    profileBio.textContent = user.bio || 'Adicione uma descrição ao seu perfil.';
    profileVideoCount.textContent = formatCount(user.videos_count);
    profileViewCount.textContent = formatCount(user.views_count);
    profileFollowerCount.textContent = formatCount(user.followers_count);
    profileFollowingCount.textContent = formatCount(user.following_count);
    const stats = user.stats || {};
    profileStatLikes.textContent = formatCount(stats.likes || 0);
    profileStatComments.textContent = formatCount(stats.comments || 0);
    profileStatShares.textContent = formatCount(stats.shares || 0);
    profileStatAverageViews.textContent = formatCount(stats.average_views || 0);
    profileEdit.hidden = !viewingOwnProfile;
    profileLogout.hidden = !viewingOwnProfile;
    profileHiddenUsers.hidden = !viewingOwnProfile;
    profileAnalytics.hidden = !viewingOwnProfile;
    profileFollow.hidden = viewingOwnProfile;
    profileFollow.textContent = user.is_following ? 'Seguindo' : 'Seguir';
    profileShare.hidden = false;
    profileTitle.textContent = viewingOwnProfile ? 'Meu perfil' : 'Perfil';
    profileTargetUserId = user.id;
    document.getElementById('profile-edit-name').value = user.name || '';
    document.getElementById('profile-edit-username').value = user.username || '';
    document.getElementById('profile-edit-bio').value = user.bio || '';
    document.getElementById('profile-edit-avatar').value = user.avatar_url || '';
    document.getElementById('profile-edit-cover').value = user.cover_url || '';
    document.getElementById('profile-edit-private').checked = Boolean(user.is_private);
    document.getElementById('profile-edit-show-liked').checked = Boolean(user.show_liked_videos);
    document.getElementById('profile-edit-following').checked = user.allow_following !== false;
    document.getElementById('profile-edit-comments').checked = user.allow_comments !== false;

    profileVideos.replaceChildren();
    if (!data.videos?.length) {
        const empty = document.createElement('p');
        empty.className = 'profile-empty';
        empty.textContent = 'Você ainda não publicou vídeos.';
        profileVideos.appendChild(empty);
        return;
    }

    data.videos.forEach(videoData => {
        const card = document.createElement('div');
        card.className = 'profile-video-card';
        if (videoData.pinned_at) card.classList.add('pinned');
        const video = document.createElement('video');
        video.src = safeMediaUrl(videoData.video_url);
        video.poster = safeMediaUrl(videoData.thumbnail_url);
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('aria-label', videoData.description || 'Vídeo publicado');
        video.addEventListener('click', () => abrirVisualizadorVideoPerfil(videoData));
        card.appendChild(video);
        if (viewingOwnProfile) {
            const actions = document.createElement('div');
            actions.className = 'profile-video-actions';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Editar';
            edit.addEventListener('click', () => void editarVideoPerfil(videoData));
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Excluir';
            remove.addEventListener('click', () => void excluirVideoPerfil(videoData));
            const pin = document.createElement('button');
            pin.type = 'button';
            pin.textContent = videoData.pinned_at ? 'Desafixar' : 'Fixar';
            pin.addEventListener('click', () => void alternarVideoFixado(videoData));
            actions.append(edit, remove, pin);
            card.appendChild(actions);
        }
        const meta = document.createElement('span');
        meta.className = 'profile-video-meta';
        const privacyLabel = videoData.visibility && videoData.visibility !== 'public' ? ' · privado' : '';
        const durationLabel = videoData.duration_seconds ? ` · ${formatTime(videoData.duration_seconds)}` : '';
        meta.textContent = `${formatCount(videoData.view_count)} visualizações · ${formatCount(videoData.likes_count)} curtidas · ${formatCount(videoData.comments_count)} comentários${durationLabel}${privacyLabel}`;
        card.appendChild(meta);
        profileVideos.appendChild(card);
    });
}

function abrirVisualizadorImagemPerfil(type) {
    const source = type === 'cover'
        ? profileCover.getAttribute('src') || ''
        : profileAvatar.getAttribute('src') || '';
    if (!source) return;
    profileImageViewerMedia.src = source;
    profileImageViewerMedia.classList.toggle('is-cover', type === 'cover');
    profileImageViewerMedia.classList.toggle('is-avatar', type === 'avatar');
    profileImageViewerMedia.alt = type === 'cover' ? 'Capa ampliada do perfil' : 'Foto de perfil ampliada';
    profileImageViewerTitle.textContent = type === 'cover' ? 'Capa do perfil' : 'Foto de perfil';
    profileImageViewerChange.dataset.imageType = type;
    profileImageViewerChange.hidden = !viewingOwnProfile;
    profileImageViewer.classList.add('active');
    profileImageViewer.setAttribute('aria-hidden', 'false');
}

function fecharVisualizadorImagemPerfil() {
    profileImageViewer.classList.remove('active');
    profileImageViewer.setAttribute('aria-hidden', 'true');
    profileImageViewerMedia.removeAttribute('src');
}

function abrirVisualizadorVideoPerfil(videoData) {
    const source = safeMediaUrl(videoData.video_url || videoData.src);
    if (!source) return;
    profileVideoViewerMedia.src = source;
    profileVideoViewer.classList.add('active');
    profileVideoViewer.setAttribute('aria-hidden', 'false');
    profileVideoViewerMedia.play().catch(() => {});
}

function fecharVisualizadorVideoPerfil() {
    profileVideoViewerMedia.pause();
    profileVideoViewerMedia.removeAttribute('src');
    profileVideoViewerMedia.load();
    profileVideoViewer.classList.remove('active');
    profileVideoViewer.setAttribute('aria-hidden', 'true');
}

async function abrirPerfil(tab = 'videos', userId = null) {
    if (!authenticatedUser && !userId) {
        abrirAutenticacao();
        return;
    }
    viewingOwnProfile = !userId || String(userId) === String(authenticatedUser?.id);
    profileActiveTab = tab;

    profileModal.classList.add('active');
    profileModal.setAttribute('aria-hidden', 'false');
    document.getElementById('top').classList.add('profile-page-active');
    profileError.hidden = true;
    profileTabs.forEach(button => {
        const isActive = button.dataset.profileTab === tab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });
    profileVideosTitle.textContent = tab === 'liked' ? 'Vídeos curtidos' : tab === 'favorites' ? 'Vídeos favoritos' : 'Meus vídeos';
    try {
        const endpoint = viewingOwnProfile ? '/auth/profile' : `/users/${encodeURIComponent(userId)}`;
        const payload = await apiRequest(`${endpoint}?tab=${encodeURIComponent(tab)}`, { includeAuth: Boolean(authToken) });
        renderizarPerfil(payload);
    } catch (error) {
        if (error.status === 401) {
            limparSessao();
            fecharPerfil();
            solicitarAutenticacao('Sua sessão expirou. Entre novamente.');
        } else {
            profileError.textContent = error.message || 'Não foi possível carregar o perfil.';
            profileError.hidden = false;
        }
    }
}

async function editarVideoPerfil(videoData) {
    const description = window.prompt('Atualize a descrição do vídeo:', videoData.description || '');
    if (description === null) return;
    try {
        await apiRequest(`/videos/${videoData.id}`, { method: 'PATCH', body: { description } });
        await abrirPerfil(profileActiveTab);
    } catch (error) {
        profileError.textContent = error.message || 'Não foi possível editar o vídeo.';
        profileError.hidden = false;
    }
}

async function excluirVideoPerfil(videoData) {
    if (!window.confirm('Excluir este vídeo? Esta ação não pode ser desfeita.')) return;
    try {
        await apiRequest(`/videos/${videoData.id}`, { method: 'DELETE' });
        await abrirPerfil(profileActiveTab);
        await loadInitialFeed();
    } catch (error) {
        profileError.textContent = error.message || 'Não foi possível excluir o vídeo.';
        profileError.hidden = false;
    }
}

async function alternarVideoFixado(videoData) {
    try {
        await apiRequest(`/videos/${videoData.id}/pin`, { method: 'PATCH' });
        await abrirPerfil(profileActiveTab);
    } catch (error) {
        profileError.textContent = error.message || 'Não foi possível fixar o vídeo.';
        profileError.hidden = false;
    }
}

async function alternarSeguirPerfil() {
    if (!profileTargetUserId) return;
    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para seguir este perfil.');
        return;
    }
    const following = profileFollow.textContent === 'Seguindo';
    profileFollow.disabled = true;
    try {
        const payload = await apiRequest(`/users/${profileTargetUserId}/follow`, { method: following ? 'DELETE' : 'PUT' });
        profileFollow.textContent = payload.data.following ? 'Seguindo' : 'Seguir';
        profileFollowerCount.textContent = formatCount(payload.data.followers_count);
    } catch (error) {
        profileError.textContent = error.message || 'Não foi possível atualizar o perfil.';
        profileError.hidden = false;
    } finally {
        profileFollow.disabled = false;
    }
}

async function alternarSeguirNoFeed(button) {
    if (!button?.dataset.userId) return;
    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para seguir este usuário.');
        return;
    }
    const seguindo = button.textContent === 'Seguindo';
    button.disabled = true;
    try {
        const payload = await apiRequest(`/users/${button.dataset.userId}/follow`, { method: seguindo ? 'DELETE' : 'PUT' });
        const novoEstado = Boolean(payload.data?.following);
        button.textContent = novoEstado ? 'Seguindo' : 'Seguir';
        button.setAttribute('aria-label', `${novoEstado ? 'Deixar de seguir' : 'Seguir'} usuário`);
        const video = button.closest('.video-container')?.querySelector('video');
        const item = feedVideos.find(videoData => String(videoData.id) === String(video?.dataset.videoId));
        if (item) item.isFollowing = novoEstado;
    } catch (error) {
        if (error.status === 401) {
            limparSessao();
            solicitarAutenticacao('Sua sessão expirou. Entre novamente para seguir.');
        } else {
            setFeedStatus(error.message || 'Não foi possível atualizar o seguimento.', { visible: true });
        }
    } finally {
        button.disabled = false;
    }
}

function compartilharPerfil() {
    const username = profileUsername.textContent || '@vibe';
    const url = new URL(`?profile=${encodeURIComponent(username.replace('@', ''))}`, window.location.href).toString();
    if (navigator.share) navigator.share({ title: `Perfil ${username}`, url });
    else navigator.clipboard?.writeText(url).then(() => setFeedStatus('Link do perfil copiado.'));
}

async function abrirPessoas(type) {
    if (!profileTargetUserId) return;
    const isHiddenUsers = type === 'hidden';
    peopleTitle.textContent = isHiddenUsers ? 'Usuários ocultados' : type === 'followers' ? 'Seguidores' : 'Seguindo';
    peopleList.replaceChildren();
    peopleModal.classList.add('active');
    peopleModal.setAttribute('aria-hidden', 'false');
    try {
        const endpoint = isHiddenUsers ? '/hidden-users' : `/users/${profileTargetUserId}/${type}`;
        const payload = await apiRequest(endpoint, { includeAuth: Boolean(authToken) });
        if (!payload.data.length) {
            peopleList.innerHTML = '<p class="notifications-empty">Nenhuma pessoa encontrada.</p>';
            return;
        }
        payload.data.forEach(person => {
            const item = document.createElement('button');
            item.className = 'person-item';
            item.type = 'button';
            const name = document.createElement('strong');
            name.textContent = person.name || 'Vibe';
            const username = document.createElement('span');
            username.textContent = `@${person.username || 'vibe'}`;
            item.append(name, username);
            if (isHiddenUsers) {
                const restore = document.createElement('span');
                restore.textContent = 'Desocultar';
                item.appendChild(restore);
                item.addEventListener('click', async () => {
                    item.disabled = true;
                    try {
                        await apiRequest(`/users/${person.id}/hide`, { method: 'DELETE' });
                        item.remove();
                        if (!peopleList.children.length) peopleList.innerHTML = '<p class="notifications-empty">Nenhum usuário ocultado.</p>';
                    } catch (error) { item.disabled = false; setFeedStatus(error.message || 'Não foi possível desocultar o usuário.', { visible: true }); }
                });
            } else {
                item.addEventListener('click', () => { fecharPessoas(); void abrirPerfil('videos', person.id); });
            }
            peopleList.appendChild(item);
        });
    } catch (error) {
        showTextMessage(peopleList, error.message || 'Não foi possível carregar a lista.');
    }
}

function fecharPessoas() {
    peopleModal.classList.remove('active');
    peopleModal.setAttribute('aria-hidden', 'true');
}

async function abrirPlaylists(video = null) {
    if (!authenticatedUser) return solicitarAutenticacao('Entre para gerenciar suas playlists.');
    playlistVideoTarget = video;
    playlistsModal.classList.add('active');
    playlistsModal.setAttribute('aria-hidden', 'false');
    await carregarPlaylists();
}

async function carregarPlaylists() {
    document.getElementById('playlists-title').textContent = 'Minhas playlists';
    playlistsList.replaceChildren();
    const payload = await apiRequest('/playlists');
    if (!payload.data.length) {
        playlistsList.innerHTML = '<p class="notifications-empty">Crie sua primeira playlist.</p>';
        return;
    }
    payload.data.forEach(playlist => {
        const item = document.createElement('div');
        item.className = `playlist-item${playlistVideoTarget ? '' : ' is-browseable'}`;
        const name = document.createElement('strong');
        name.textContent = playlist.name;
        const count = document.createElement('span');
        count.textContent = `${playlist.videos_count} vídeos`;
        item.append(name, count);
        if (!playlistVideoTarget) {
            item.addEventListener('click', () => void abrirDetalhePlaylist(playlist.id, playlist.name));
        }
        if (playlistVideoTarget) {
            const add = document.createElement('button');
            add.type = 'button';
            add.className = 'playlist-add-video';
            add.textContent = 'Adicionar';
            add.addEventListener('click', async () => {
                add.disabled = true;
                try {
                    await apiRequest(`/playlists/${playlist.id}/videos/${playlistVideoTarget.dataset.videoId}`, { method: 'PUT' });
                    add.textContent = 'Adicionado';
                    playlist.videos_count = Number(playlist.videos_count || 0) + 1;
                    count.textContent = `${playlist.videos_count} vídeos`;
                } catch (error) {
                    add.disabled = false;
                    setFeedStatus(error.message || 'Não foi possível adicionar o vídeo à playlist.', { visible: true });
                }
            });
            item.appendChild(add);
        }
        playlistsList.appendChild(item);
    });
}

async function abrirDetalhePlaylist(playlistId, playlistName) {
    playlistsList.innerHTML = '<p class="notifications-empty">Carregando vídeos...</p>';
    document.getElementById('playlists-title').textContent = playlistName;
    try {
        const payload = await apiRequest(`/playlists/${playlistId}`);
        const items = (payload.videos || []).map(normalizeApiVideo);
        playlistsList.replaceChildren();
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'playlist-back';
        back.textContent = '‹ Voltar às playlists';
        back.addEventListener('click', () => void carregarPlaylists());
        playlistsList.appendChild(back);
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'notifications-empty';
            empty.textContent = 'Esta playlist ainda não tem vídeos.';
            playlistsList.appendChild(empty);
            return;
        }
        const grid = document.createElement('div');
        grid.className = 'playlist-video-grid';
        items.forEach((video, index) => {
            const item = document.createElement('article');
            item.className = 'search-video-card playlist-video-card';
            const preview = document.createElement('video');
            preview.src = safeMediaUrl(video.src || video.video_url);
            preview.poster = safeMediaUrl(video.thumbnail_url);
            preview.muted = true;
            preview.playsInline = true;
            preview.preload = 'metadata';
            const info = document.createElement('div');
            info.className = 'search-video-info';
            const description = document.createElement('strong');
            description.textContent = `${index + 1}. ${video.description || 'Vídeo sem descrição'}`;
            const meta = document.createElement('span');
            meta.textContent = `◉ ${formatCount(video.view_count)} visualizações`;
            info.append(description, meta);
            item.append(preview, info);
            item.addEventListener('click', () => {
                fecharPlaylists();
                fecharPerfil();
                abrirFeedDePesquisa(items, index, { preserveOrder: true });
            });
            grid.appendChild(item);
        });
        playlistsList.appendChild(grid);
    } catch (error) {
        showTextMessage(playlistsList, error.message || 'Não foi possível abrir a playlist.');
    }
}

function fecharPlaylists() {
    playlistsModal.classList.remove('active');
    playlistsModal.setAttribute('aria-hidden', 'true');
    playlistVideoTarget = null;
}

async function criarPlaylist() {
    const form = new FormData(playlistForm);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    try {
        await apiRequest('/playlists', { method: 'POST', body: { name } });
        playlistForm.reset();
        await carregarPlaylists();
    } catch (error) {
        setFeedStatus(error.message || 'Não foi possível criar a playlist.', { visible: true });
    }
}

function fecharPerfil() {
    profileModal.classList.remove('active');
    profileModal.setAttribute('aria-hidden', 'true');
    document.getElementById('top').classList.remove('profile-page-active');
    profileForm.hidden = true;
}

async function abrirNotificacoes(onlyMentions = false) {
    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para ver suas notificações.');
        return;
    }
    videos?.forEach(video => video.pause());
    document.getElementById('top').classList.add('notifications-page-active');
    notificationsModal.classList.add('active');
    notificationsModal.setAttribute('aria-hidden', 'false');
    notificationsList.innerHTML = '<p class="notifications-empty">Carregando notificações...</p>';
    try {
        const payload = await apiRequest('/notifications');
        notificationsList.replaceChildren();
        if (!payload.data?.length) {
            notificationsList.innerHTML = '<p class="notifications-empty">Nenhuma notificação ainda.</p>';
        } else {
            payload.data.filter(notification => !onlyMentions || notification.type === 'mention').forEach(notification => {
                const item = document.createElement('article');
                item.className = `notification-item${notification.read_at ? '' : ' unread'}`;
                const actor = notification.actor?.username ? `@${notification.actor.username}` : 'Alguém';
                const messages = { like: 'curtiu seu vídeo.', comment: 'comentou no seu vídeo.', reply: 'respondeu ao seu comentário.', follow: 'começou a seguir você.' };
                item.textContent = `${actor} ${notification.type === 'mention' ? 'mencionou você em um comentário.' : messages[notification.type] || 'interagiu com você.'}`;
                if (notification.video?.id) item.dataset.videoId = notification.video.id;
                item.dataset.notificationId = notification.id;
                item.setAttribute('role', 'button');
                item.tabIndex = 0;
                notificationsList.appendChild(item);
            });
        }
        await apiRequest('/notifications/read-all', { method: 'POST' });
        atualizarBadgeNotificacoes(0);
    } catch (error) {
        showTextMessage(notificationsList, error.message || 'Não foi possível carregar as notificações.');
    }
}

notificationsList.addEventListener('click', event => {
    const item = event.target.closest('.notification-item');
    if (!item) return;
    if (item.dataset.notificationId) void apiRequest(`/notifications/${item.dataset.notificationId}/read`, { method: 'POST' }).catch(() => {});
    if (item.dataset.videoId) {
        fecharNotificacoes();
        const target = document.querySelector(`video[data-video-id="${CSS.escape(item.dataset.videoId)}"]`);
        target?.closest('.video-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

async function carregarHistoricoVisualizacoes() {
    notificationsList.innerHTML = '<p class="notifications-empty">Carregando histórico...</p>';
    try {
        const payload = await apiRequest('/history/videos');
        notificationsList.replaceChildren();
        const items = payload.data || [];
        if (!items.length) { notificationsList.innerHTML = '<p class="notifications-empty">Seu histórico aparecerá aqui.</p>'; return; }
        items.forEach(video => {
            const item = document.createElement('article');
            item.className = 'notification-item history-item';
            const author = document.createElement('strong');
            author.textContent = video.author?.name || 'Usuário';
            const description = document.createElement('span');
            description.textContent = video.description || 'Vídeo assistido';
            item.append(author, description);
            notificationsList.appendChild(item);
        });
    } catch (error) { showTextMessage(notificationsList, error.message || 'Não foi possível carregar o histórico.'); }
}

async function carregarModeracao() {
    notificationsList.innerHTML = '<p class="notifications-empty">Carregando denúncias...</p>';
    try {
        const payload = await apiRequest('/moderation/reports');
        notificationsList.replaceChildren();
        const reports = payload.data?.data || [];
        if (!reports.length) { notificationsList.innerHTML = '<p class="notifications-empty">Nenhuma denúncia pendente.</p>'; return; }
        reports.forEach(report => {
            const item = document.createElement('article');
            item.className = 'notification-item moderation-item';
            const video = report.video || {};
            const description = document.createElement('strong');
            description.textContent = video.description || 'Vídeo sem descrição';
            const details = document.createElement('span');
            details.textContent = `Motivo: ${report.reason} · Status: ${report.status}`;
            item.append(description, details);
            const resolve = document.createElement('button');
            resolve.type = 'button'; resolve.textContent = 'Marcar como resolvida';
            resolve.addEventListener('click', async () => {
                resolve.disabled = true;
                await apiRequest(`/moderation/reports/${report.id}`, { method: 'PATCH', body: { status: 'resolved' } });
                await carregarModeracao();
            });
            item.appendChild(resolve);
            notificationsList.appendChild(item);
        });
    } catch (error) { showTextMessage(notificationsList, error.message || 'Não foi possível carregar a moderação.'); }
}

function selecionarAbaNotificacoes(tab) {
    [notificationTabAll, notificationTabMentions, notificationTabHistory].forEach(button => button?.classList.toggle('active', button === tab));
    if (tab === notificationTabHistory) void carregarHistoricoVisualizacoes();
    else if (tab === notificationTabModeration) void carregarModeracao();
    else void abrirNotificacoes(tab === notificationTabMentions);
}

notificationTabAll?.addEventListener('click', () => selecionarAbaNotificacoes(notificationTabAll));
notificationTabMentions?.addEventListener('click', () => selecionarAbaNotificacoes(notificationTabMentions));
notificationTabHistory?.addEventListener('click', () => selecionarAbaNotificacoes(notificationTabHistory));
notificationTabModeration?.addEventListener('click', () => selecionarAbaNotificacoes(notificationTabModeration));

async function atualizarBadgeNotificacoes(forcedCount = null) {
    if (!notificationBadge) return;
    if (!authenticatedUser) {
        notificationBadge.hidden = true;
        return;
    }
    try {
        const count = forcedCount === null
            ? (await apiRequest('/notifications/unread-count')).data?.count || 0
            : forcedCount;
        notificationBadge.textContent = count > 99 ? '99+' : String(count);
        notificationBadge.hidden = count < 1;
    } catch {
        notificationBadge.hidden = true;
    }
}

function iniciarAtualizacaoNotificacoes() {
    if (notificationPollTimer || !authenticatedUser) return;
    notificationPollTimer = window.setInterval(() => {
        void atualizarBadgeNotificacoes();
        if (notificationsModal.classList.contains('active') && notificationTabAll?.classList.contains('active')) void abrirNotificacoes();
    }, 20000);
}

function pararAtualizacaoNotificacoes() {
    if (notificationPollTimer) window.clearInterval(notificationPollTimer);
    notificationPollTimer = null;
}

function fecharNotificacoes() {
    notificationsModal.classList.remove('active');
    notificationsModal.setAttribute('aria-hidden', 'true');
    document.getElementById('top').classList.remove('notifications-page-active');
}

async function salvarPerfil() {
    const form = new FormData(profileForm);
    profileError.hidden = true;
    try {
        const payload = await apiRequest('/auth/profile', {
            method: 'PATCH',
            body: {
                name: String(form.get('name') || '').trim(),
                username: String(form.get('username') || '').trim(),
                bio: String(form.get('bio') || '').trim() || null,
                avatar_url: String(form.get('avatar_url') || '').trim() || null,
                cover_url: String(form.get('cover_url') || '').trim() || null,
                is_private: form.get('is_private') === 'on',
                show_liked_videos: form.get('show_liked_videos') === 'on',
                allow_following: form.get('allow_following') === 'on',
                allow_comments: form.get('allow_comments') === 'on',
            },
        });
        authenticatedUser = { ...authenticatedUser, ...payload.user };
        atualizarInterfaceAutenticacao();
        profileForm.hidden = true;
        await abrirPerfil();
    } catch (error) {
        profileError.textContent = error.message || 'Não foi possível salvar o perfil.';
        profileError.hidden = false;
    }
}

async function enviarImagemPerfil(file) {
    if (!file || !viewingOwnProfile) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', profileImageInput.dataset.imageType || 'avatar');
    try {
        const response = await fetch(apiUrl('/auth/profile/image'), {
            method: 'POST',
            headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
            body: formData,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(getApiErrorMessage(payload, 'Não foi possível enviar o avatar.'));
        if (payload?.user) {
            authenticatedUser = { ...authenticatedUser, ...payload.user };
            atualizarInterfaceAutenticacao();
        }
        await abrirPerfil(profileActiveTab);
    } catch (error) {
        profileError.textContent = error.message;
        profileError.hidden = false;
    } finally {
        profileImageInput.value = '';
        profileImageInput.dataset.imageType = 'avatar';
    }
}

function abrirEditorCapa(file) {
    cropFile = file;
    if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
    cropObjectUrl = URL.createObjectURL(file);
    cropImage.src = cropObjectUrl;
    cropX.value = '50';
    cropY.value = '50';
    cropZoom.value = '100';
    atualizarPreviaCapa();
    cropModal.classList.add('active');
    cropModal.setAttribute('aria-hidden', 'false');
}

function atualizarPreviaCapa() {
    cropImage.style.objectPosition = `${cropX.value}% ${cropY.value}%`;
    cropImage.style.transform = `scale(${Number(cropZoom.value) / 100})`;
}

function iniciarArrasteCapa(event) {
    event.preventDefault();
    cropDragging = true;
    cropDragStart = { x: event.clientX, y: event.clientY, cropX: Number(cropX.value), cropY: Number(cropY.value) };
    cropImage.setPointerCapture(event.pointerId);
}

function moverArrasteCapa(event) {
    if (!cropDragging || !cropDragStart) return;
    const rect = cropImage.parentElement.getBoundingClientRect();
    cropX.value = String(Math.max(0, Math.min(100, cropDragStart.cropX - ((event.clientX - cropDragStart.x) / rect.width) * 100)));
    cropY.value = String(Math.max(0, Math.min(100, cropDragStart.cropY - ((event.clientY - cropDragStart.y) / rect.height) * 100)));
    atualizarPreviaCapa();
}

function finalizarArrasteCapa() {
    cropDragging = false;
    cropDragStart = null;
}

function fecharEditorCapa() {
    cropModal.classList.remove('active');
    cropModal.setAttribute('aria-hidden', 'true');
    cropFile = null;
    profileImageInput.value = '';
}

async function confirmarCorteCapa() {
    if (!cropFile || !cropImage.naturalWidth) return;
    const ratio = 3;
    const imageWidth = cropImage.naturalWidth;
    const imageHeight = cropImage.naturalHeight;
    const zoom = Number(cropZoom.value) / 100;
    const cropWidth = Math.min(imageWidth, (imageHeight * ratio) / zoom);
    const cropHeight = cropWidth / ratio;
    const x = (imageWidth - cropWidth) * (Number(cropX.value) / 100);
    const y = (imageHeight - cropHeight) * (Number(cropY.value) / 100);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 400;
    const context = canvas.getContext('2d');
    context.drawImage(cropImage, x, y, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
        if (!blob) return;
        const croppedFile = new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
        fecharEditorCapa();
        profileImageInput.dataset.imageType = 'cover';
        void enviarImagemPerfil(croppedFile);
    }, 'image/jpeg', 0.9);
}

function abrirEscolhaInteresses() {
    if (!authenticatedUser || authenticatedUser.onboarding_completed) return;
    const selected = new Set(authenticatedUser.interests || []);
    interestOptionButtons().forEach(button => button.classList.toggle('selected', selected.has(button.dataset.interest)));
    interestsError.hidden = true;
    interestsModal.classList.add('active');
    interestsModal.setAttribute('aria-hidden', 'false');
}

function fecharEscolhaInteresses() {
    interestsModal.classList.remove('active');
    interestsModal.setAttribute('aria-hidden', 'true');
}

async function salvarInteresses() {
    const interests = [...new Set(interestOptionButtons().filter(button => button.classList.contains('selected')).map(button => button.dataset.interest))];
    if (interests.length < 5) {
        interestsError.textContent = `Escolha pelo menos 5 assuntos para continuar. Você selecionou ${interests.length}.`;
        interestsError.hidden = false;
        return;
    }
    saveInterestsButton.disabled = true;
    interestsError.hidden = true;
    try {
        const payload = await apiRequest('/auth/profile', {
            method: 'PATCH',
            body: { interests, onboarding_completed: true },
        });
        authenticatedUser = { ...authenticatedUser, ...payload.user };
        fecharEscolhaInteresses();
        await loadInitialFeed();
    } catch (error) {
        interestsError.textContent = error.message || 'Não foi possível salvar suas preferências.';
        interestsError.hidden = false;
    } finally {
        saveInterestsButton.disabled = false;
    }
}

async function pularInteresses() {
    skipInterestsButton.disabled = true;
    interestsError.hidden = true;
    try {
        const payload = await apiRequest('/auth/profile', {
            method: 'PATCH',
            body: { interests: [], onboarding_completed: true },
        });
        authenticatedUser = { ...authenticatedUser, ...payload.user };
        fecharEscolhaInteresses();
        await loadInitialFeed();
    } catch (error) {
        interestsError.textContent = error.message || 'Não foi possível pular esta etapa.';
        interestsError.hidden = false;
    } finally {
        skipInterestsButton.disabled = false;
    }
}

function ordenarFeedPorInteresses(items) {
    const interests = (authenticatedUser?.interests || []).map(value => String(value).toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    let signals = {};
    try {
        signals = JSON.parse(localStorage.getItem(`vibe_interest_signals_${authenticatedUser?.id || 'guest'}`) || '{}') || {};
    } catch { /* segue com o feed em ordem padrão */ }
    if (!interests.length && !Object.keys(signals).length) return [...items].sort(() => Math.random() - 0.5);
    return [...items].sort((a, b) => {
        const score = item => {
            const text = `${item.description || ''} ${item.user || ''}`.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const explicit = interests.reduce((total, interest) => total + (text.includes(interest) ? 3 : 0), 0);
            const learned = Object.entries(signals).reduce((total, [term, weight]) => total + (text.includes(term) ? Number(weight) : 0), 0);
            const popularity = Math.min(8, Number(item.likes || 0) * 0.5 + Number(item.view_count || 0) * 0.05);
            return explicit + learned + popularity;
        };
        return score(b) - score(a);
    });
}

function registrarSinalTermos(terms, weight = 1) {
    const key = `vibe_interest_signals_${authenticatedUser?.id || 'guest'}`;
    const words = String(terms).toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(word => word.length >= 4);
    try {
        const signals = JSON.parse(localStorage.getItem(key) || '{}') || {};
        [...new Set(words)].forEach(word => { signals[word] = Math.max(-100, Math.min(100, (Number(signals[word]) || 0) + weight)); });
        localStorage.setItem(key, JSON.stringify(signals));
    } catch { /* preferência continua apenas nesta sessão */ }
}

function registrarSinalVideo(video, weight = 1) {
    const item = feedVideos.find(candidate => String(candidate.id) === String(video?.dataset.videoId));
    if (item) registrarSinalTermos(`${item.description || ''} ${item.user || ''}`, weight);
}

function definirModoAutenticacao(mode) {
    authMode = mode;
    const isRegistering = authMode === 'register';
    authForm.classList.toggle('register-mode', isRegistering);
    authTitle.textContent = isRegistering ? 'Criar conta' : 'Entrar no Vibe';
    authSubmit.textContent = isRegistering ? 'Criar conta' : 'Entrar';
    authToggle.textContent = isRegistering ? 'Já tenho uma conta' : 'Criar uma conta';
    authForgot.hidden = isRegistering;
    document.getElementById('auth-name').required = isRegistering;
    document.getElementById('auth-username').required = isRegistering;
    document.getElementById('auth-password-confirmation').required = isRegistering;
    document.getElementById('auth-password').autocomplete = isRegistering ? 'new-password' : 'current-password';
    setAuthError();
}

async function solicitarRedefinicaoSenha() {
    const email = window.prompt('Digite o e-mail da sua conta:');
    if (!email) return;
    authForgot.disabled = true;
    try {
        const payload = await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: { email: email.trim() },
            includeAuth: false,
        });
        setAuthError(payload.message || 'Confira seu e-mail para redefinir a senha.');
    } catch (error) {
        setAuthError(error.message);
    } finally {
        authForgot.disabled = false;
    }
}

function abrirAutenticacao() {
    atualizarInterfaceAutenticacao();
    if (!authenticatedUser) definirModoAutenticacao(authMode);
    authModal.classList.add('active');
    authModal.setAttribute('aria-hidden', 'false');
    if (!authenticatedUser) document.getElementById('auth-email').focus();
}

function fecharAutenticacao() {
    authModal.classList.remove('active');
    authModal.setAttribute('aria-hidden', 'true');
    setAuthError();
}

function alternarModoAutenticacao() {
    definirModoAutenticacao(authMode === 'login' ? 'register' : 'login');
}

async function enviarAutenticacao() {
    const credentials = window.VibeAuthForm.readCredentials(authForm, authMode);

    authSubmit.disabled = true;
    setAuthError();

    try {
        const payload = await apiRequest(`/auth/${authMode === 'register' ? 'register' : 'login'}`, {
            method: 'POST',
            body: credentials,
            includeAuth: false,
        });

        authToken = payload.token;
        authenticatedUser = payload.user;
        sessionStorage.setItem('vibe_auth_token', authToken);
        if (authMode === 'register' && payload.email_verification_required) {
            setFeedStatus('Conta criada! Enviamos um link para confirmar seu e-mail.', { visible: true });
        }
        welcomeGate.hidden = true;
        atualizarInterfaceAutenticacao();
        void atualizarBadgeNotificacoes();
        iniciarAtualizacaoNotificacoes();
        fecharAutenticacao();
        await loadInitialFeed();
        abrirEscolhaInteresses();
    } catch (error) {
        setAuthError(error.message);
    } finally {
        authSubmit.disabled = false;
    }
}

function limparSessao() {
    authToken = null;
    authenticatedUser = null;
    sessionStorage.removeItem('vibe_auth_token');
    welcomeGate.hidden = false;
    atualizarInterfaceAutenticacao();
    void atualizarBadgeNotificacoes();
    pararAtualizacaoNotificacoes();
}

async function restaurarSessao() {
    if (!authToken) {
        atualizarInterfaceAutenticacao();
        welcomeGate.hidden = false;
        return;
    }

    try {
        authenticatedUser = await apiRequest('/auth/me');
        welcomeGate.hidden = true;
        iniciarAtualizacaoNotificacoes();
    } catch {
        limparSessao();
        welcomeGate.hidden = false;
    }

    atualizarInterfaceAutenticacao();
}

async function sairDaConta() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn(error);
    } finally {
        limparSessao();
        fecharAutenticacao();
        fecharPerfil();
        await loadInitialFeed();
    }
}

function solicitarAutenticacao(message) {
    abrirAutenticacao();
    setAuthError(message);
}

function normalizeApiComment(comment) {
    const username = comment.author?.username || comment.author?.name || 'vibe';

    return {
        id: comment.id,
        authorId: comment.author?.id || null,
        user: username.startsWith('@') ? username : `@${username}`,
        avatar: comment.author?.avatar_url || '',
        text: comment.body || '',
        parentId: comment.parent_id || null,
        repliesCount: Number(comment.replies_count) || 0,
    };
}

function updateCommentsCounter(videoElement, count) {
    const counter = videoElement?.parentElement.querySelector('.sidebar-icon.comment span');
    if (!counter) return;

    const normalizedCount = Math.max(0, Number(count) || 0);
    counter.dataset.count = String(normalizedCount);
    counter.textContent = formatCount(normalizedCount);

    const video = feedVideos.find(item => String(item.id) === String(activeVideoId));
    if (video) video.comments = normalizedCount;
}

function updateCommentsTitle() {
    const count = commentsData.length;
    commentsTitle.textContent = `${count} ${count === 1 ? 'comentário' : 'comentários'}`;
}

async function carregarComentarios(videoId, requestId) {
    const payload = await apiRequest(`/videos/${videoId}/comments?per_page=20`);
    if (requestId !== commentsRequestId) return;
    commentsData = payload.data.map(normalizeApiComment);
    renderComments();
    updateCommentsTitle();
}

// --- 6. Comentários ---
async function abrirComentarios(video) {
    const requestId = ++commentsRequestId;
    activeVideoElement = video;
    activeVideoId = video.dataset.videoId || null;
    commentsModal.classList.add('active');
    document.getElementById('top').classList.add('comments-open');
    setTimeout(() => {
        commentsContent.style.transform = 'translateY(0)';
    }, 10);

    const isDemo = video.dataset.isDemo === 'true';
    const canComment = (isDemo ? Boolean(authenticatedUser) : video.dataset.allowComments === 'true') && Boolean(activeVideoId);
    commentInput.disabled = !canComment || !activeVideoId;
    sendComment.disabled = !canComment || !activeVideoId;
    commentsData = [];
    renderComments();
    commentsNotice.hidden = true;

    if (isDemo) {
        commentsData = carregarComentariosDemo(video.dataset.videoId || video.currentSrc || video.src);
        commentsTitle.textContent = `${commentsData.length} ${commentsData.length === 1 ? 'comentário' : 'comentários'}`;
        if (!authenticatedUser) {
            commentsNotice.textContent = 'Entre para publicar um comentário.';
            commentsNotice.hidden = false;
        }
        renderComments();
        return;
    }

    if (!activeVideoId) {
        commentsTitle.textContent = 'Comentários indisponíveis';
        return;
    }

    commentsTitle.textContent = 'Carregando comentários...';
    try {
        await carregarComentarios(activeVideoId, requestId);
    } catch (error) {
        if (requestId !== commentsRequestId) return;
        commentsData = [];
        renderComments();
        commentsTitle.textContent = 'Não foi possível carregar comentários';
        commentsNotice.textContent = 'Não foi possível carregar os comentários. Feche e abra novamente para tentar de novo.';
        commentsNotice.hidden = false;
        console.error(error);
    }
}

function fecharComentarios() {
    commentsRequestId++;
    commentsContent.style.transform = 'translateY(100%)';
    document.getElementById('top').classList.remove('comments-open');
    setTimeout(() => commentsModal.classList.remove('active'), 300);
}

function comentarioPertenceAoUsuario(comment) {
    if (!authenticatedUser) return false;
    if (comment.authorId && authenticatedUser.id) {
        return String(comment.authorId) === String(authenticatedUser.id);
    }
    if (activeVideoElement?.dataset.isDemo !== 'true') return false;
    const username = authenticatedUser.username || authenticatedUser.name || '';
    const normalized = username.startsWith('@') ? username : `@${username}`;
    return Boolean(normalized && comment.user === normalized);
}

function usuarioEhDonoDoVideo() {
    return Boolean(
        authenticatedUser?.id
        && activeVideoElement?.dataset.authorId
        && String(authenticatedUser.id) === String(activeVideoElement.dataset.authorId),
    );
}

async function editarComentario(comment) {
    const value = window.prompt('Edite seu comentário:', comment.text);
    if (value === null) return;
    const body = value.trim();
    if (!body) {
        setFeedStatus('O comentário não pode ficar vazio.', { visible: true });
        return;
    }
    if (body.length > 1000) {
        setFeedStatus('O comentário pode ter no máximo 1000 caracteres.', { visible: true });
        return;
    }

    if (activeVideoElement?.dataset.isDemo === 'true') {
        const target = commentsData.find(item => String(item.id) === String(comment.id));
        if (target) target.text = body;
        salvarComentariosDemo(activeVideoElement.dataset.videoId || activeVideoElement.currentSrc || activeVideoElement.src, commentsData);
        renderComments();
        return;
    }

    try {
        const payload = await apiRequest(`/comments/${comment.id}`, { method: 'PATCH', body: { body } });
        const index = commentsData.findIndex(item => String(item.id) === String(comment.id));
        if (index !== -1) commentsData[index] = normalizeApiComment(payload.data);
        renderComments();
    } catch (error) {
        setFeedStatus(error.message || 'Não foi possível editar o comentário.', { visible: true });
    }
}

async function excluirComentario(comment) {
    if (!window.confirm('Excluir este comentário?')) return;

    if (activeVideoElement?.dataset.isDemo === 'true') {
        commentsData = commentsData.filter(item => String(item.id) !== String(comment.id));
        salvarComentariosDemo(activeVideoElement.dataset.videoId || activeVideoElement.currentSrc || activeVideoElement.src, commentsData);
        renderComments();
        updateCommentsTitle();
        return;
    }

    try {
        await apiRequest(`/comments/${comment.id}`, { method: 'DELETE' });
        commentsData = commentsData.filter(item => String(item.id) !== String(comment.id));
        renderComments();
        updateCommentsTitle();
        if (activeVideoElement) {
            const count = Number(activeVideoElement.parentElement.querySelector('.sidebar-icon.comment span')?.dataset.count) || 0;
            updateCommentsCounter(activeVideoElement, count - 1);
        }
    } catch (error) {
        setFeedStatus(error.message || 'Não foi possível excluir o comentário.', { visible: true });
    }
}

function fecharOpcoesVideo() {
    videoOptionsModal.classList.remove('active');
    videoOptionsModal.setAttribute('aria-hidden', 'true');
    optionsVideo = null;
}

async function executarOpcaoVideo(option) {
    const video = optionsVideo;
    if (!video) return;
    if (option === 'playlist') {
        if (!authenticatedUser) {
            solicitarAutenticacao('Entre para adicionar vídeos a uma playlist.');
        } else if (!video.dataset.videoId || video.dataset.isDemo === 'true') {
            setFeedStatus('Este vídeo demo não pode ser adicionado a uma playlist.', { visible: true });
        } else {
            fecharOpcoesVideo();
            await abrirPlaylists(video);
            return;
        }
    } else if (option === 'download') {
        const source = video.currentSrc || video.src;
        if (!source) return;
        const downloadUrl = source.includes('res.cloudinary.com')
            ? source.replace('/video/upload/', '/video/upload/fl_attachment:vibe-video/')
            : source;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `vibe-video-${video.closest('.video-container')?.dataset.videoId || Date.now()}.mp4`;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setFeedStatus('Download iniciado.');
    } else if (option === 'copy') {
        await navigator.clipboard?.writeText(video.src);
        setFeedStatus('Link do vídeo copiado.');
    } else if (option === 'hide' || option === 'user') {
        const card = video.closest('.video-container');
        const authorId = video.closest('.video-container')?.querySelector('.video-follow')?.dataset.userId;
        if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, option === 'user' ? -8 : -5);
        if (authenticatedUser && !video.dataset.isDemo) {
            await apiRequest(option === 'user' ? `/users/${authorId}/hide` : `/videos/${video.dataset.videoId}/hide`, { method: 'POST' });
        }
        if (option === 'user' && authorId) {
            [...container.querySelectorAll('.video-container')].forEach(item => {
                if (item.querySelector(`.video-follow[data-user-id="${CSS.escape(authorId)}"]`)) item.remove();
            });
        } else {
            card?.remove();
        }
        refreshVideoBindings();
        setFeedStatus('Vídeo ocultado.');
    } else if (option === 'report') {
        if (authenticatedUser && !video.dataset.isDemo) {
            await apiRequest(`/videos/${video.dataset.videoId}/report`, { method: 'POST', body: { reason: 'other' } });
        } else if (!authenticatedUser) {
            solicitarAutenticacao('Entre para denunciar um vídeo.');
            return;
        }
        setFeedStatus('Denúncia enviada para análise.');
    }
    fecharOpcoesVideo();
}

async function adicionarComentario() {
    const texto = commentInput.value.trim();
    if (texto === '' || sendComment.disabled) return;

    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para publicar um comentário.');
        return;
    }

    if (!activeVideoId) return;

    if (activeVideoElement?.dataset.isDemo === 'true') {
        const username = authenticatedUser.username || authenticatedUser.name || 'vibe';
        const comment = {
            id: `demo-comment-${Date.now()}`,
            authorId: authenticatedUser.id || null,
            user: username.startsWith('@') ? username : `@${username}`,
            avatar: authenticatedUser.avatar_url || '',
            text: texto,
            parentId: commentReplyTarget,
        };
        commentsData.unshift(comment);
        salvarComentariosDemo(activeVideoElement.dataset.videoId || activeVideoElement.currentSrc || activeVideoElement.src, commentsData);
        renderComments();
        updateCommentsTitle();
        const currentCount = Number(activeVideoElement.parentElement.querySelector('.sidebar-icon.comment span')?.dataset.count) || 0;
        updateCommentsCounter(activeVideoElement, currentCount + 1);
        commentInput.value = '';
        commentReplyTarget = null;
        commentInput.placeholder = 'Adicionar comentário';
        commentsList.scrollTop = 0;
        return;
    }

    sendComment.disabled = true;
    try {
        const payload = await apiRequest(`/videos/${activeVideoId}/comments`, {
            method: 'POST',
            body: { body: texto, parent_id: commentReplyTarget },
        });
        commentsData.unshift(normalizeApiComment(payload.data));
        renderComments();
        updateCommentsTitle();
        updateCommentsCounter(activeVideoElement, Number(
            activeVideoElement.parentElement.querySelector('.sidebar-icon.comment span').dataset.count,
        ) + 1);
        commentInput.value = '';
        commentReplyTarget = null;
        commentInput.placeholder = 'Adicionar comentário';
        commentsList.scrollTop = 0;
    } catch (error) {
        if (error.status === 401) {
            limparSessao();
            solicitarAutenticacao('Sua sessão expirou. Entre novamente para comentar.');
        }
        else {
            console.error(error);
            setFeedStatus('Não foi possível publicar o comentário. Tente novamente.', { visible: true });
        }
    } finally {
        sendComment.disabled = false;
    }
}

// --- 7. Likes ---
async function toggleLike(button, onlyLike = false) {
    if (!button || button.disabled) return;
    const video = button?.closest('.video-container')?.querySelector('video');
    const videoId = video?.dataset.videoId;
    if (!video || !videoId) return;

    const icon = button.querySelector('i');
    const isLiked = icon.classList.contains('liked');
    if (onlyLike && isLiked) return;
    const counter = button.querySelector('span');
    const previousCount = Number(counter.dataset.count) || 0;
    const feedVideo = feedVideos.find(item => String(item.id) === String(videoId));
    const applyStatus = (liked, count) => {
        icon.classList.toggle('liked', liked);
        button.setAttribute('aria-pressed', String(liked));
        button.setAttribute('aria-label', liked ? 'Descurtir vídeo' : 'Curtir vídeo');
        counter.dataset.count = String(count);
        counter.textContent = formatCount(count);
        if (feedVideo) {
            feedVideo.likes = count;
            feedVideo.isLiked = liked;
        }
    };

    if (isUsingDemoFeed || video.dataset.isDemo === 'true') {
        applyStatus(!isLiked, Math.max(0, previousCount + (isLiked ? -1 : 1)));
        if (!isLiked) if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 3);
        try {
            const savedLikes = Object.fromEntries(feedVideos.filter(item => item.isLiked).map(item => [item.src, true]));
            localStorage.setItem('vibe_demo_likes', JSON.stringify(savedLikes));
        } catch {
            setFeedStatus('Curtida atualizada, mas o navegador não permitiu salvá-la neste dispositivo.', { visible: true });
        }
        return;
    }

    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para curtir vídeos.');
        return;
    }

    button.disabled = true;
    applyStatus(!isLiked, Math.max(0, previousCount + (isLiked ? -1 : 1)));

    try {
        const payload = await apiRequest(`/videos/${videoId}/like`, {
            method: isLiked ? 'DELETE' : 'PUT',
        });
        const likeStatus = payload.data;
        applyStatus(likeStatus.liked, likeStatus.likes_count);
        if (likeStatus.liked) if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 3);
    } catch (error) {
        applyStatus(isLiked, previousCount);
        if (error.status === 401) {
            limparSessao();
            solicitarAutenticacao('Sua sessão expirou. Entre novamente para curtir.');
        }
        else {
            console.error(error);
            setFeedStatus('Não foi possível salvar a curtida. Tente novamente.', { visible: true });
        }
    } finally {
        button.disabled = false;
    }
}

function carregarComentariosDemo(videoKey) {
    try {
        const saved = JSON.parse(localStorage.getItem('vibe_demo_comments') || '{}') || {};
        return Array.isArray(saved[videoKey]) ? saved[videoKey] : [];
    } catch {
        return [];
    }
}

function salvarComentariosDemo(videoKey, comments) {
    try {
        const saved = JSON.parse(localStorage.getItem('vibe_demo_comments') || '{}') || {};
        saved[videoKey] = comments;
        localStorage.setItem('vibe_demo_comments', JSON.stringify(saved));
    } catch {
        setFeedStatus('Comentário adicionado, mas não foi possível salvá-lo neste dispositivo.', { visible: true });
    }
}

async function toggleFavorite(button) {
    if (!button || button.disabled) return;
    const video = button.closest('.video-container')?.querySelector('video');
    const videoId = video?.dataset.videoId;
    if (!video || !videoId) return;

    const icon = button.querySelector('i');
    const isFavorite = icon.classList.contains('liked');
    const counter = button.querySelector('span');
    const previousCount = Number(counter.dataset.count) || 0;
    const feedVideo = feedVideos.find(item => String(item.id) === String(videoId));
    const applyStatus = (favorited, count) => {
        icon.classList.toggle('liked', favorited);
        button.setAttribute('aria-pressed', String(favorited));
        button.setAttribute('aria-label', favorited ? 'Remover dos favoritos' : 'Salvar vídeo');
        counter.dataset.count = String(count);
        counter.textContent = formatCount(count);
        if (feedVideo) {
            feedVideo.favorites = count;
            feedVideo.isFavorite = favorited;
        }
    };

    if (video.dataset.isDemo === 'true') {
        applyStatus(!isFavorite, isFavorite ? 0 : 1);
        if (!isFavorite) if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 2);
        try {
            const saved = Object.fromEntries(feedVideos.filter(item => item.isFavorite).map(item => [item.src, true]));
            localStorage.setItem('vibe_demo_favorites', JSON.stringify(saved));
        } catch {
            setFeedStatus('Favorito atualizado, mas não foi possível salvar neste dispositivo.', { visible: true });
        }
        return;
    }

    if (!authenticatedUser) {
        solicitarAutenticacao('Entre para salvar vídeos nos favoritos.');
        return;
    }

    button.disabled = true;
    applyStatus(!isFavorite, Math.max(0, previousCount + (isFavorite ? -1 : 1)));
    try {
        const payload = await apiRequest(`/videos/${videoId}/favorite`, {
            method: isFavorite ? 'DELETE' : 'PUT',
        });
        applyStatus(payload.data.favorited, payload.data.favorites_count);
        if (payload.data.favorited) if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 2);
    } catch (error) {
        applyStatus(isFavorite, previousCount);
        if (error.status === 401) {
            limparSessao();
            solicitarAutenticacao('Sua sessão expirou. Entre novamente para salvar vídeos.');
        } else {
            setFeedStatus('Não foi possível atualizar os favoritos.', { visible: true });
        }
    } finally {
        button.disabled = false;
    }
}

async function cortarVideoSeNecessario(file) {
    const start = Math.max(0, Number(publishTrimStart.value) || 0);
    const end = Number(publishTrimEnd.value) || 0;
    const duration = publishDetailPreview.duration || 0;
    if (!duration || start <= 0 && (!end || end >= duration) || end <= start) return file;
    if (!HTMLVideoElement.prototype.captureStream || typeof MediaRecorder === 'undefined') return file;

    const sourceUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = sourceUrl;
    video.muted = false;
    video.playsInline = true;
    try {
        await new Promise((resolve, reject) => {
            video.addEventListener('loadedmetadata', resolve, { once: true });
            video.addEventListener('error', reject, { once: true });
        });
        const safeStart = Math.min(start, Math.max(0, video.duration - .1));
        const safeEnd = Math.min(end > safeStart ? end : video.duration, video.duration);
        video.currentTime = safeStart;
        await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
        const stream = video.captureStream();
        const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
            .find(type => MediaRecorder.isTypeSupported?.(type));
        const recorder = new MediaRecorder(stream, {
            ...(mimeType ? { mimeType } : {}),
            videoBitsPerSecond: 2_500_000,
            audioBitsPerSecond: 128_000,
        });
        const chunks = [];
        recorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
        const result = new Promise(resolve => recorder.addEventListener('stop', () => {
            const type = recorder.mimeType || 'video/webm';
            resolve(chunks.length ? new File([new Blob(chunks, { type })], `vibe-corte-${Date.now()}.webm`, { type }) : file);
        }, { once: true }));
        recorder.start(200);
        await video.play();
        await new Promise(resolve => {
            const check = () => video.currentTime >= safeEnd ? resolve() : requestAnimationFrame(check);
            check();
        });
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
        return await result;
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(sourceUrl);
    }
}

function enviarArquivoComProgresso(formData) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', apiUrl('/videos/upload'));
        request.setRequestHeader('Accept', 'application/json');
        if (authToken) request.setRequestHeader('Authorization', `Bearer ${authToken}`);
        request.upload.addEventListener('progress', event => {
            if (event.lengthComputable) atualizarProgressoPublicacao((event.loaded / event.total) * 100);
        });
        request.addEventListener('error', () => reject(new Error('Não foi possível enviar o vídeo.')));
        request.addEventListener('abort', () => reject(new Error('Envio cancelado.')));
        request.addEventListener('load', () => {
            let payload = null;
            try { payload = JSON.parse(request.responseText || 'null'); } catch { /* resposta inválida tratada abaixo */ }
            if (request.status < 200 || request.status >= 300) {
                const error = new Error(getApiErrorMessage(payload, 'Não foi possível enviar o vídeo.'));
                error.status = request.status;
                reject(error);
                return;
            }
            resolve(payload);
        });
        request.send(formData);
    });
}

// --- 8. Compartilhar ---
async function publicarVideo(file, metadata = {}) {
    if (!file) return;
    videoFileInput.value = '';
    if (!file.type.startsWith('video/')) {
        setFeedStatus('Escolha um arquivo de vídeo válido.', { visible: true });
        return;
    }

    const formData = new FormData();
    formData.append('video', file);
    if (publishCoverBlob) formData.append('thumbnail', publishCoverBlob, `vibe-capa-${Date.now()}.jpg`);
    setFeedStatus('Enviando vídeo…');
    btnUpload.disabled = true;
    publishSubmit.disabled = true;
    publishBack.disabled = true;
    atualizarProgressoPublicacao(0, true, 'Enviando vídeo…');
    let uploadedAssets = null;

    try {
        const uploadPayload = await enviarArquivoComProgresso(formData);
        uploadedAssets = {
            cloudinary_public_id: uploadPayload.data.cloudinary_public_id,
            thumbnail_public_id: uploadPayload.data.thumbnail_public_id || null,
        };
        atualizarProgressoPublicacao(100, true, 'Finalizando publicação…');

        await apiRequest('/videos', {
            method: 'POST',
            body: {
                description: metadata.description?.trim() || null,
                location: metadata.location?.trim() || null,
                video_url: uploadPayload.data.video_url,
                thumbnail_url: uploadPayload.data.thumbnail_url || null,
                cloudinary_public_id: uploadPayload.data.cloudinary_public_id,
                duration_seconds: uploadPayload.data.duration_seconds,
                visibility: metadata.visibility || 'public',
                allow_comments: metadata.allow_comments !== false,
                scheduled_at: metadata.scheduled_at || null,
                allow_reuse: metadata.allow_reuse !== false,
                is_ai_generated: metadata.is_ai_generated === true,
                age_restricted: metadata.age_restricted === true,
                high_quality: metadata.high_quality !== false,
            },
        });
        await loadInitialFeed();
        localStorage.removeItem(PUBLISH_DRAFT_KEY);
        fecharPublicacao();
        setFeedStatus('Vídeo publicado com sucesso.');
    } catch (error) {
        if (uploadedAssets) {
            try {
                await apiRequest('/videos/upload', {
                    method: 'DELETE',
                    body: uploadedAssets,
                });
            } catch (cleanupError) {
                console.warn(cleanupError);
            }
        }
        if (error.status === 401) {
            limparSessao();
            solicitarAutenticacao('Sua sessão expirou. Entre novamente para publicar.');
        } else {
            console.error(error);
            setFeedStatus(error.message || 'Não foi possível publicar o vídeo.', { visible: true });
        }
    } finally {
        btnUpload.disabled = false;
        publishSubmit.disabled = false;
        publishBack.disabled = false;
    }
}

async function compartilharVideo(video) {
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Vídeo', url: video.src });
        } else {
            await navigator.clipboard.writeText(video.src);
            alert('Link copiado para a área de transferência');
        }
    } catch (error) {
        if (error?.name === 'AbortError') return;
        setFeedStatus('Não foi possível compartilhar este vídeo.', { visible: true });
        return;
    }

    const button = video.parentElement?.querySelector('.sidebar-icon.share');
    const counter = button?.querySelector('span');
    if (!button || !counter) return;
    const count = (Number(counter.dataset.count) || 0) + 1;
    counter.dataset.count = String(count);
    counter.textContent = formatCount(count);
    const feedVideo = feedVideos.find(item => String(item.id) === String(video.dataset.videoId));
    if (feedVideo) feedVideo.shares = count;
    if (video.dataset.isDemo !== 'true' && video.dataset.videoId) {
        try {
            const payload = await apiRequest(`/videos/${video.dataset.videoId}/share`, { method: 'POST' });
            const persistedCount = Number(payload.data?.shares_count);
            if (Number.isFinite(persistedCount)) {
                counter.dataset.count = String(persistedCount);
                counter.textContent = formatCount(persistedCount);
                if (feedVideo) feedVideo.shares = persistedCount;
            }
        } catch (error) {
            console.error(error);
        }
    }
    if (typeof registrarSinalVideo === 'function') registrarSinalVideo(video, 3);
    if (video.dataset.isDemo === 'true') {
        try {
            const saved = Object.fromEntries(feedVideos.filter(item => item.isDemo && item.shares > 0).map(item => [item.src, item.shares]));
            localStorage.setItem('vibe_demo_shares', JSON.stringify(saved));
        } catch {
            setFeedStatus('Compartilhamento concluído, mas não foi possível salvá-lo neste dispositivo.', { visible: true });
        }
    }
}


// --- 10. Interações externas ---
window.setupCommentDrag({
    content: commentsContent,
    list: commentsList,
    onClose: fecharComentarios,
});

async function iniciarAplicacao() {
    await restaurarSessao();
    await initVideos();
    abrirEscolhaInteresses();
}

void iniciarAplicacao();

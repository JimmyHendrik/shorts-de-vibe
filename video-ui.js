// Elementos visuais e progresso dos vídeos.
(function () {
    window.VibeVideoUi = function createVideoUi(formatTime) {
        const getPlayIcon = video => video.parentElement.querySelector('.play-icon');
        const getProgressBar = video => video.parentElement.querySelector('.progress-bar');
        const getProgressFill = video => video.parentElement.querySelector('.progress');
        const getProgressThumb = video => video.parentElement.querySelector('.progress-thumb');
        const getProgressTime = video => video.parentElement.querySelector('.progress-time');

        function setPlayIconState(video, isPlaying) {
            const playIcon = getPlayIcon(video);
            if (playIcon) playIcon.classList.toggle('active', !isPlaying);
        }

        function atualizarBarraProgresso(video) {
            const progress = getProgressFill(video);
            if (!progress || !isFinite(video.duration) || video.duration === 0) return;

            const percentage = Math.max(0, Math.min(100, (video.currentTime / video.duration) * 100));
            progress.style.width = `${percentage}%`;
            const thumb = getProgressThumb(video);
            if (thumb) thumb.style.left = `${percentage}%`;
            const time = getProgressTime(video);
            if (time) {
                const nextLabel = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
                // Evita reescrever o texto em todos os frames quando o segundo
                // exibido ainda não mudou.
                if (time.textContent !== nextLabel) time.textContent = nextLabel;
            }
        }

        function animateProgress(video) {
            let frame = 0;
            const update = () => {
                atualizarBarraProgresso(video);
                if (!video.paused && !video.ended) frame = requestAnimationFrame(update);
            };
            if (video.dataset.progressFrame) cancelAnimationFrame(Number(video.dataset.progressFrame));
            update();
            video.dataset.progressFrame = String(frame);
        }

        function stopProgressAnimation(video) {
            if (video.dataset.progressFrame) cancelAnimationFrame(Number(video.dataset.progressFrame));
            video.dataset.progressFrame = '';
        }

        function bindProgressAnimation(video) {
            video.addEventListener('play', () => animateProgress(video));
            video.addEventListener('pause', () => {
                stopProgressAnimation(video);
                atualizarBarraProgresso(video);
            });
            video.addEventListener('ended', () => stopProgressAnimation(video));
        }

        return { getPlayIcon, getProgressBar, getProgressFill, getProgressThumb, getProgressTime, setPlayIconState, atualizarBarraProgresso, bindProgressAnimation };
    };
})();

// Interações de arraste do painel de comentários.
(function () {
    function getPointerY(event) {
        return event.touches?.[0]?.clientY ?? event.clientY;
    }

    window.setupCommentDrag = function setupCommentDrag({ content, list, onClose }) {
        let startY = 0;
        let deltaY = 0;
        let dragging = false;

        function iniciarArrasto(event) {
            if (list.scrollTop > 0) return;
            dragging = true;
            startY = getPointerY(event);
            deltaY = 0;
            content.style.transition = 'none';
        }

        function moverArrasto(event) {
            if (!dragging) return;
            deltaY = Math.max(0, getPointerY(event) - startY);
            content.style.transform = `translateY(${deltaY}px)`;
        }

        function finalizarArrasto() {
            if (!dragging) return;
            dragging = false;
            content.style.transition = '.3s';
            if (deltaY > 150) {
                onClose();
            } else {
                content.style.transform = 'translateY(0)';
            }
        }

        content.addEventListener('touchstart', iniciarArrasto);
        content.addEventListener('touchmove', moverArrasto);
        content.addEventListener('touchend', finalizarArrasto);
        content.addEventListener('mousedown', iniciarArrasto);
        window.addEventListener('mousemove', moverArrasto);
        window.addEventListener('mouseup', finalizarArrasto);
    };
})();

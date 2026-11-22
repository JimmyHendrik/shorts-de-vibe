import './vendor/index.js';
import portuguese from './i18n/pt_BR.js';

const picker = document.getElementById('comment-emoji-picker');
picker.i18n = {
    ...portuguese,
    favoritesLabel: 'Recentes',
    categories: {
        ...portuguese.categories,
        'smileys-emotion': 'Rostos e emoções',
        'people-body': 'Pessoas e gestos',
        'animals-nature': 'Animais e natureza',
        'food-drink': 'Comidas e bebidas',
        'travel-places': 'Viagens e lugares',
        activities: 'Atividades e esportes',
        objects: 'Objetos',
        symbols: 'Símbolos e corações',
    },
};

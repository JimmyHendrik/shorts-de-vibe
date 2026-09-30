// Dados compactos dos vídeos de demonstração.
const demoVideoRows = [
    ["videos/A Diferença Brutal de Reinvestir Dividendos no Seu Dinheiro.mp4","Projeto Vibe criado com HTML, CSS e JavaScript #Vibe",0,0,0],
    ["videos/A importância do reinvestimento dos dividendos para acelerar o patrimônio.mp4","Vídeos curtos no Vibe #Vibe",0,0,0],
    ["videos/Brasil é o país dos rentistas_ renda fixa e CDI são poderosos aliados.mp4","Entenda a renda fixa e CDI #hendrikHS",0,0,0],
    ["videos/Cinco formas de usar o lucro de uma empresa.mp4","Conheça as 5 formas de usar o lucro #hendrikHS",0,0,0],
    ["videos/Como calcular o preço ideal para um dividend yield desejado.mp4","Aprenda a calcular o dividend yield perfeito #hendrikHS",0,0,0],
    ["videos/Como calcular o valor da empresa com base no lucro líquido anual.mp4","Cálculo de valor da empresa #hendrikHS",0,0,0],
    ["videos/Como filtrar ações para montar uma carteira de dividendos.mp4","Montando carteira de dividendos #hendrikHS",0,0,0],
    ["videos/Como identificar boas empresas pagadoras de dividendos_ 3 critérios essenciais.mp4","3 critérios para identificar boas pagadoras #hendrikHS",0,0,0],
    ["videos/Como montar uma carteira para receber dividendos todos os meses.mp4","Carteira mensal de dividendos #hendrikHS",0,0,0],
    ["videos/Como o lucro líquido da padaria do Seu Joca gera dividendos para investidores.mp4","Exemplo prático com a padaria do Seu Joca #hendrikHS",0,0,0],
    ["videos/Como o preço do aço impacta o dividend yield da Gerdau.mp4","Entenda o impacto do aço na Gerdau #hendrikHS",0,0,0],
    ["videos/Como os dividendos criam um efeito bola de neve para aumentar seu patrimônio.mp4","O efeito bola de neve dos dividendos #hendrikHS",0,0,0],
    ["videos/Disciplina no investimento é como ir à academia_ mesmo sem vontade_ é essencial.mp4","Disciplina é a chave #hendrikHS",0,0,0],
    ["videos/Diversificando para receber dividendos todos os meses.mp4","Diversificação de dividendos #hendrikHS",0,0,0],
    ["videos/Dividend Yield explicado com exemplo da padaria do Seu Joca.mp4","Entenda Dividend Yield #hendrikHS",0,0,0],
    ["videos/Dividendos da Gerdau e a volatilidade do preço do aço.mp4","Gerdau: dividendos e volatilidade #hendrikHS",0,0,0],
    ["videos/Download.mp4","Vídeo importante de download #hendrikHS",0,0,0],
    ["videos/Exemplo da padaria do Seu Joca para entender dividendos e lucro líquido.mp4","Padaria do Seu Joca: um exemplo prático #hendrikHS",0,0,0],
    ["videos/Exemplos de empresas brasileiras com altos dividend yields.mp4","Empresas brasileiras com altos yields #hendrikHS",0,0,0],
    ["videos/Importância do payout estável para dividendos saudáveis.mp4","Payout estável = dividendos saudáveis #hendrikHS",0,0,0],
    ["videos/Indicadores essenciais para escolher ações que pagam dividendos.mp4","Indicadores para escolher ações #hendrikHS",0,0,0],
    ["videos/Investir em boas ações com dividendos supera CDI e inflação no longo prazo.mp4","Ações com dividendos superam CDI #hendrikHS",0,0,0],
    ["videos/Lançamento exclusivo_ mentoria Do Mil ao Viver de Renda com Bruno Perini.mp4","Mentoria exclusiva com Bruno Perini #hendrikHS",0,0,0],
    ["videos/Nem todo dividendo alto garante rentabilidade sólida no longo prazo.mp4","Cuidado com dividendos altos #hendrikHS",0,0,0],
    ["videos/O preço é o único fator que você controla no investimento.mp4","O preço como fator de controle #hendrikHS",0,0,0],
    ["videos/O que são dividendos e por que são essenciais para sua renda passiva.mp4","Dividendos: essenciais para renda passiva #hendrikHS",0,0,0],
];

window.vibeVideoData = demoVideoRows.map(([src, description, likes, comments, shares]) => ({
    src,
    user: '@Hendrik HS',
    description,
    likes,
    comments,
    shares,
}));

window.vibeDemoCommentsData = [];

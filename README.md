# Vibe

Plataforma local de vídeos curtos, com feed, perfis, busca, comentários,
notificações e autenticação.

## Ambiente recomendado: WAMP

O projeto roda localmente sem Docker usando:

- WAMP com Apache e MySQL ativos;
- PHP compatível com o Laravel instalado pelo WAMP;
- Node.js para validações do frontend;
- navegador com o Live Server do VS Code (ou outro servidor de arquivos).

O Docker continua disponível como alternativa, mas não é necessário para o uso diário.

## Primeira configuração

1. Inicie **Apache** e **MySQL** no WAMP.
2. Crie um banco chamado `vibe` no phpMyAdmin.
3. Copie `backend/.env.example` para `backend/.env`.
4. Ajuste `DB_USERNAME` e `DB_PASSWORD` conforme o MySQL do seu WAMP.
5. Dentro de `backend`, gere a chave e crie as tabelas:

```powershell
php artisan key:generate
php artisan migrate
```

### Certificado TLS do PHP no Windows

Se o login com Google voltar com o erro `cURL error 60: SSL certificate problem`, configure um bundle de certificados confiável para as chamadas OAuth do backend. No terminal da raiz do projeto:

```powershell
New-Item -ItemType Directory -Force backend\storage\app\certs
curl.exe --fail --location https://curl.se/ca/cacert.pem --output backend\storage\app\certs\cacert.pem
```

No `backend/.env`, defina:

```dotenv
GOOGLE_CA_BUNDLE=storage/app/certs/cacert.pem
```

Reinicie `php artisan serve` para carregar a configuração. A verificação TLS permanece habilitada; não a desative.

### Limite de tamanho para upload de vídeos no PHP

O projeto aceita vídeos de até 50 MB. Se a publicação retornar `413` ou `The POST data is too large`, os limites do PHP estão menores que o arquivo. Confira o `php.ini` ativo com `php --ini` e ajuste:

```ini
upload_max_filesize = 50M
post_max_size = 64M
```

`post_max_size` deve ser maior que `upload_max_filesize` para incluir os campos multipart e a capa. Reinicie `php artisan serve` após alterar o `php.ini`.

## Iniciar o projeto

Em um terminal, inicie a API:

```powershell
cd "D:\programação\cursos\Projeto vibe\vibe-2\backend"
php artisan serve --host=0.0.0.0 --port=8000
```

Em outro terminal, abra a pasta raiz no VS Code e inicie o **Live Server**. Depois, acesse:

```text
http://localhost:5500
```

## Testar no celular ou tablet

Deixe o aparelho na mesma rede Wi-Fi do computador. Use o IPv4 local do computador no navegador, por exemplo:

```text
http://192.168.0.8:5500
```

O frontend identifica esse endereço e usa automaticamente a API na porta 8000. Se o Windows solicitar, permita o acesso do PHP e do Live Server na rede privada.

## Testes locais

Validação do JavaScript:

```powershell
node --check script.js
node --check api-client.js
```

Testes do backend:

```powershell
cd backend
php artisan test --do-not-cache-result
```

## Docker (alternativo)

Se preferir usar um banco isolado em container, execute na raiz:

```powershell
docker compose up -d
```

Nesse caso, mantenha as credenciais do serviço `mysql` do `docker-compose.yml` no arquivo `backend/.env`.

# YouTube Remote Control

Extensão de navegador que força o `youtube.com/tv` a se identificar como uma
smart TV, permitindo controlar o YouTube do desktop pelo app do celular
(cast / "assistir na TV").

## Como funciona

O YouTube só libera o pareamento com o celular quando a página é aberta como
`youtube.com/tv`. O site detecta navegadores comuns pelo cabeçalho
`User-Agent`, então a extensão reescreve esse cabeçalho nas requisições para
`youtube.com/tv`:

- **Firefox (MV3):** `src/background.js` usa `webRequest` com bloqueio, que
  continua disponível no Firefox.
- **Chrome (MV3):** o Chrome removeu o `webRequest` bloqueante; a mesma troca é
  feita declarativamente em `src/rules.json` via `declarativeNetRequest`.

## Estrutura

```
manifests/
  firefox.json          # manifest MV3 do Firefox
  chrome.json           # manifest MV3 do Chrome
scripts/
  build.mjs             # build sem dependências, gera dist/<navegador>/
src/
  background.js         # reescrita de User-Agent (somente Firefox)
  rules.json            # regras declarativas de User-Agent (somente Chrome)
  popup/
    popup.html
    popup.css
    popup.js
  assets/
    icons/              # ícones da extensão
    images/             # imagens usadas pelo popup
```

Fontes ficam em `src/` e `manifests/`; `dist/` é sempre gerado e não é
versionado. Nenhum arquivo de build assinado (`META-INF/`) fica no repositório.

## Desenvolvimento

Requisitos: Node.js 18+ (apenas para o build; a extensão não usa bundler) e
Firefox 140+ / Firefox para Android 142+ (mínimos definidos no manifest por
causa de `data_collection_permissions`).

```bash
npm run build     # gera dist/firefox e dist/chrome
npm run check     # checagem de sintaxe dos scripts
npm run clean     # remove dist/
```

O build valida os manifests e falha se algum arquivo referenciado (ícones,
popup, background, rules) não existir.

## Carregar a extensão

**Firefox**

1. `npm run build`
2. Abra `about:debugging#/runtime/this-firefox`
3. "Carregar complemento temporário" e selecione `dist/firefox/manifest.json`

Para distribuir, empacote o conteúdo de `dist/firefox/` como `.xpi` (o `id` em
`browser_specific_settings.gecko` já está definido).

**Chrome**

1. `npm run build`
2. Abra `chrome://extensions`, ative o modo desenvolvedor
3. "Carregar sem compactação" e selecione `dist/chrome/`

## Uso

1. Abra `https://youtube.com/tv` e clique no ícone de configurações, depois em
   "Vincular com código da TV".
2. No app do YouTube do celular: Configurações > Assistir na TV > Inserir
   código da TV.
3. O que tocar no celular passa a tocar na janela do navegador.

Se parar de funcionar: em `youtube.com/tv` vá em Configurações > Dispositivos
vinculados e clique em "desvincular todos os dispositivos"; no celular, feche e
reabra o app do YouTube e repita o processo.

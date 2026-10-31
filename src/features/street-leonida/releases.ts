export interface LeonidaAtlasRelease {
  readonly version: `v${number}.${number}.${number}`;
  readonly date: string;
  readonly title: string;
  readonly summary: string;
  readonly status: 'public' | 'in-preparation';
  readonly highlights: readonly string[];
  readonly verification: readonly string[];
}

/**
 * Retained public history starts at v0.5.0; the newest release stays first.
 * Release notes are shown in the UI, so they are written in Brazilian Portuguese.
 */
export const LEONIDA_ATLAS_RELEASES: readonly LeonidaAtlasRelease[] = [
  {
    version: 'v0.8.0',
    date: '2026-09-06',
    title: 'Ruas mais detalhadas e cenas regionais pesquisadas',
    summary:
      'Quinze descobertas com fonte, seis chegadas regionais mais ricas, interiores profundos atrás das janelas, superfícies fotográficas e sombreamento de contato.',
    status: 'public',
    highlights: [
      'Descrições regionais oficiais da Rockstar e imagens públicas embasam quinze descobertas curtas nos detalhes dos locais, na busca e no painel de Evidências do explorador. Observações sem posição levam às chegadas regionais existentes, sem inventar marcadores exatos no mapa.',
      'Vice City ganha um pátio de padaria sombreado e um mercado; as Keys, uma marina em funcionamento; Grassrivers, estruturas sobre palafitas; Port Gellhorn, lojas desgastadas; Ambrosia, um pátio de serviço; e Kalaga, um abrigo de trilha e acesso ao riacho.',
      'Janelas recuadas, interiores de cômodos que mudam com o ângulo de visão, sacadas, recuos e fachadas de lojas trazem profundidade à arquitetura. Ruas mapeadas próximas ganham meio-fio, sarjetas e drenagem quando o contexto da fonte é urbano.',
      'Mapas fotográficos CC0 hospedados localmente de cor, normal e rugosidade cobrem asfalto, concreto, rocha, madeira e cascalho. O compartilhamento de texturas e os limites de detalhe espacial mantêm os recursos adicionados sob controle.',
      'Sombreamento de contato baseado em profundidade, sombras próximas mais nítidas e um brilho contido nos realces deixam tudo mais assentado no chão. Configurações de efeito sem suporte mantêm a renderização direta. As árvores nativas têm silhuetas mais finas e geometria de floresta mais eficiente.',
      'As coordenadas do GTADB, a atribuição CC BY 4.0 e as versões anteriores continuam disponíveis. Lotes decorativos e relevo não medido continuam APROXIMADOS; o material de origem não define dimensões nem posições exatas.',
    ],
    verification: [
      'Testes unitários e de integração cobrem afirmações das fontes, distância das fachadas, ocupação dos lotes, contexto das ruas, distância do terreno, compartilhamento de texturas, descarte assíncrono e fallback de renderização.',
      'Testes no Chromium cobrem vistas regionais, destinos selecionados, ativação nativa por teclado de Evidências e viagem, retorno ao mapa e controles de toque.',
      'Os testes de renderização usam o Chromium com renderização por software SwiftShader. Este ambiente não comprova taxas de quadros em hardware nem o desempenho gráfico real no iOS.',
    ],
  },
  {
    version: 'v0.7.0',
    date: '2026-09-06',
    title: 'Uma Leonida 3D mais completa e viva',
    summary:
      'Ruas e construções mapeadas restauradas, pedestres articulados e arquitetura, vegetação, terreno, água e iluminação mais ricos nas seis regiões.',
    status: 'public',
    highlights: [
      'As ruas da fonte continuam visíveis acima do terreno aproximado. A ocupação de construções mapeadas é preservada no computador e no celular, com bases rotacionadas, padrões regionais de andares e telhados e detalhes de fachada de perto.',
      'O Hotel Dixon, a arena Sahara, as torres da orla e o viaduto com mural ganharam volumes reconstruídos. Varandas, fachadas de lojas, telhados e detalhes de serviço regionais dão mais profundidade às chegadas existentes.',
      'Personagens articulados originais substituem as figuras em bloco e as colagens planas de pessoas. Os pés de quem caminha e os pneus dos veículos seguem as superfícies das ruas ativas; o trânsito de Vice City e Ambrosia usa os enquadramentos de chegada selecionados.',
      'Árvores próximas usam troncos e folhas tridimensionais, com vegetação fotográfica mantida ao fundo. Kalaga ganha cristas rochosas locais contínuas e floresta em altitude.',
      'Iluminação externa baseada em imagem, nuvens com sombreamento correto, normais de água em movimento e áreas delimitadas de luz dos postes melhoram a atmosfera das seis regiões.',
      'As posições e a atribuição do GTADB continuam intactas. Arquitetura e relevo local não medidos continuam APROXIMADOS; esta é uma reconstrução no navegador, não o mundo original do jogo nem seus arquivos.',
    ],
    verification: [
      '503 testes unitários e de integração passaram, incluindo verificações de streaming, geometria, contato, coordenadas da fonte, personagens e ciclo de vida da água. TypeScript, ESLint e o build de produção passaram.',
      'O Chromium renderizou as seis regiões e uma vista invertida de Vice City sem erros de aplicativo ou de shader. Capturas isoladas adicionais conferiram os pontos de referência reconstruídos, os personagens e as nuvens.',
      'Chamadas de desenho e triângulos foram registrados. A máquina de teste usa renderização por software SwiftShader, então esses testes não garantem a taxa de quadros em hardware.',
    ],
  },
  {
    version: 'v0.6.2',
    date: '2026-09-06',
    title: 'Colaboração pública e reforço de segurança',
    summary:
      'Fluxos de contribuição da comunidade, pull requests protegidos, atualizações de dependências validadas e varredura de segurança contínua.',
    status: 'public',
    highlights: [
      'O repositório público agora inclui diretrizes de contribuição, código de conduta, formulários de issues, modelo de pull request e canal privado para relatar vulnerabilidades.',
      'A branch principal exige uma verificação de Quality bem-sucedida e conversas resolvidas, mantém o histórico linear e bloqueia force push e exclusão da branch.',
      'O Dependabot agrupa atualizações compatíveis, mantém as definições de tipo do Node no Node 22 e evita downgrades de lockfile sem relação com a mudança.',
      'O GitHub Actions usa revisões fixadas e permissões padrão somente leitura. Varredura de segredos, proteção de push e CodeQL inspecionam o repositório continuamente.',
      'Os dados públicos do mapa, as coordenadas, o licenciamento, os limites de conta e o funcionamento local continuam iguais.',
    ],
    verification: [
      'Instalação congelada, TypeScript estrito, lint, 458 testes unitários e de integração e o build de produção passaram.',
      'A suíte de navegador no Chromium passou após as atualizações de colaboração pública e de dependências.',
      'O CodeQL concluiu as duas análises sem achados. O GitHub não relatou segredos nem vulnerabilidades de dependências pendentes, e as verificações de integridade do Git não encontraram corrupção.',
    ],
  },
  {
    version: 'v0.6.1',
    date: '2026-09-05',
    title: 'Medição de visitantes e histórico de versões',
    summary:
      'Medição de visitantes baseada em consentimento e uma página Sobre com todas as versões desde a v0.5.0.',
    status: 'public',
    highlights: [
      'Os visitantes podem permitir ou recusar a medição de audiência e mudar a escolha em Sobre. Visitas aceitas usam um identificador aleatório separado do navegador; os dados pessoais do mapa ficam isolados do Analytics.',
      'A página Sobre lista a versão atual e as anteriores, com datas e uma descrição curta de cada atualização.',
      'As notas de versão mantêm o histórico completo desde a v0.5.0, da mais recente para a mais antiga.',
      'A publicação no GitHub preserva as versões existentes e restaura entradas históricas ausentes sem substituir a versão mais recente.',
    ],
    verification: [
      'Os testes de TypeScript, lint, exibição do histórico de versões e ciclo de publicação passaram.',
      'Os links de Sobre e das notas de versão foram conferidos em navegadores de computador e de celular.',
      'O Google aceitou visitas de teste com consentimento e identificadores estáveis de navegador e sessão. A retirada do consentimento, o isolamento de origem e as mudanças entre abas foram verificados; o painel privado do Analytics fica fora desta verificação.',
    ],
  },
  {
    version: 'v0.6.0',
    date: '2026-09-05',
    title: 'Espaços de conta e destinos 3D selecionados',
    summary:
      'Espaços de trabalho isolados por conta e um serviço oficial de contas privado, com o destino selecionado no mapa preservado ao entrar no explorador 3D.',
    status: 'public',
    highlights: [
      'React, Vite e TypeScript estrito substituem a estrutura e o build em Astro. A hospedagem estática não exige CMS, site principal, conta nem API privada.',
      'O mapa calibrado em Leaflet CRS.Simple oferece busca, filtros combinados, camadas ordenadas, regras de zoom, agrupamento espacial limitado e detalhes da fonte.',
      'O Dexie / IndexedDB guarda favoritos, notas, coleções, marcadores e preferências com atualização de esquema, salvamento transacional, atualização entre abas e proteção contra rascunhos desatualizados.',
      'O editor de marcadores pessoais permite criar, editar, mover e excluir. Backups com versão são validados e mostrados em prévia antes de uma mesclagem atômica.',
      'O cache offline preserva a estrutura do app, o catálogo público e o mapa base após um carregamento online completo. Recursos 3D opcionais entram no cache conforme são visitados, com armazenamento limitado.',
      'As coordenadas selecionadas no mapa agora iniciam o mundo 3D. Ambrosia, Leonida Keys e locais individuais mantêm seus destinos; transições rápidas entre mapa e explorador limpam animações pendentes do mapa.',
      'Os espaços de visitante local e de conta ficam separados. Gravações na fila, leituras desatualizadas e operações de backup não atravessam silenciosamente uma troca de conta.',
      'A reconstrução existente em Three.js carrega sob demanda, com controles para computador e toque, viagem entre regiões, painéis de evidências e um fallback quando o WebGL não está disponível.',
      'A instância oficial oferece cadastro por e-mail ou nome de usuário, sessões seguras e backups explícitos no servidor por meio de um serviço privado separado. Forks públicos continuam totalmente usáveis como visitante; o Analytics fica isolado e configurado na implantação.',
      'A atribuição do GTADB / Map GTA e o licenciamento CC BY 4.0 dos dados são mantidos: 2.198 registros de fonte, sendo 2.091 com posição e 107 sem posição, além de seis regiões. A posição da comunidade continua APROXIMADA e áreas sem cobertura continuam DESCONHECIDAS.',
    ],
    verification: [
      'Instalação congelada, tipos estritos, lint, testes unitários e de integração, build estático e verificações isoladas de fork público passaram.',
      'O Chromium no computador e o WebKit no celular testam os fluxos do mapa e dos dados locais. A navegação offline no WebKit é explicitamente ignorada quando o ambiente de automação falha; o Chromium verifica a reabertura offline e o início no destino 3D selecionado.',
      'Um build isolado em subdiretório verificou os dados do mapa, os marcadores salvos, os links do projeto, as rotas históricas, os recursos 3D e o escopo do service worker. O contêiner Nginx independente passou na suíte de navegador.',
      'A auditoria de dependências e as verificações de peers passaram. O isolamento do Analytics e os limites do worker offline gerado foram verificados; o escopo completo e as limitações estão em docs/refactor/VERIFICATION.md.',
    ],
  },
  {
    version: 'v0.5.0',
    date: '2026-09-05',
    title: 'Mapa independente com dados locais',
    summary:
      'Um espaço de mapa independente com favoritos, notas, coleções, marcadores pessoais e backups portáteis guardados no navegador, além de um explorador 3D opcional.',
    status: 'public',
    highlights: [
      'React, Vite e TypeScript estrito substituem a estrutura e o build em Astro. A hospedagem estática não exige CMS, site principal, conta nem API privada.',
      'O mapa calibrado em Leaflet CRS.Simple oferece busca, filtros combinados, camadas ordenadas, regras de zoom, agrupamento espacial limitado e detalhes da fonte.',
      'O Dexie / IndexedDB guarda favoritos, notas, coleções, marcadores e preferências com atualização de esquema, salvamento transacional, atualização entre abas e proteção contra rascunhos desatualizados.',
      'O editor de marcadores pessoais permite criar, editar, mover e excluir. Backups com versão são validados e mostrados em prévia antes de uma mesclagem atômica.',
      'O cache offline preserva a estrutura do app, o catálogo público e o mapa base após um carregamento online completo. Recursos 3D opcionais entram no cache conforme são visitados, com armazenamento limitado.',
      'A reconstrução existente em Three.js carrega sob demanda, com controles para computador e toque, viagem entre regiões, painéis de evidências e um fallback quando o WebGL não está disponível.',
      'Forks públicos funcionam como visitante, sem credenciais. Os contratos de conta e de sincronização na nuvem continuam opcionais; o Analytics fica isolado e só é ativado pela configuração de implantação.',
      'A atribuição do GTADB / Map GTA e o licenciamento CC BY 4.0 dos dados são mantidos: 2.198 registros de fonte, sendo 2.091 com posição e 107 sem posição, além de seis regiões. A posição da comunidade continua APROXIMADA e áreas sem cobertura continuam DESCONHECIDAS.',
    ],
    verification: [
      'Instalação congelada, tipos estritos, lint, testes unitários e de integração, build estático e verificações isoladas de fork público passaram.',
      'O Chromium no computador e o WebKit no celular passaram em 17 casos de navegador; um caso de navegação offline no WebKit é explicitamente ignorado quando o ambiente de automação falha. O Chromium verifica a reabertura offline.',
      'Um build isolado em subdiretório verificou os dados do mapa, os marcadores salvos, os links do projeto, as rotas históricas, os recursos 3D e o escopo do service worker. O contêiner Nginx independente passou na suíte de navegador.',
      'A auditoria de dependências e as verificações de peers passaram. O isolamento do Analytics e os limites do worker offline gerado foram verificados; o escopo completo e as limitações estão em docs/refactor/VERIFICATION.md.',
    ],
  },
] as const;

export const latestLeonidaAtlasRelease = LEONIDA_ATLAS_RELEASES[0]!;

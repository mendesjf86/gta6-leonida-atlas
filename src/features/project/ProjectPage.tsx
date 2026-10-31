import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  GTADB_LICENSE_URL,
  GTADB_PINNED_DATA_URL,
  GTADB_PREFERRED_SOURCE,
  GTADB_REVISION,
  GTADB_SOURCE,
} from '../street-leonida/gtadb';
import { projectPath, publicPath } from '../explorer/public-path';
import { LEONIDA_ATLAS_RELEASES } from '../street-leonida/releases';
import { AnalyticsPreferences } from '../../app/AnalyticsConsent';
import { ATLAS_PROJECT_META } from '../../app/seo';
import './project.css';

export interface ProjectPageProps {
  page: string;
  onClose: () => void;
}

/** Upstream open-source project this fan edition is based on. */
const UPSTREAM_REPOSITORY = 'https://github.com/navanem/gta6-leonida-atlas';
/** Source code of this modified version (AGPL-3.0 §13). */
const MODIFIED_SOURCE_REPOSITORY = 'https://github.com/mendesjf86/gta6-leonida-atlas';

const pages = [
  ['about', 'Sobre o mapa'],
  ['documentation', 'Como usar'],
  ['credits', 'Créditos e fontes'],
  ['contributing', 'Como contribuir'],
  ['changelog', 'Notas de versão'],
  ['licenses', 'Licenças'],
] as const;

function formatReleaseDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="project-section" id={id} tabIndex={id ? -1 : undefined}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function About() {
  return (
    <>
      <p className="project-lead">
        O Mapa de Leonida é o mapa da comunidade de GTA 6 do Mundo Vice: um atlas independente que
        organiza as evidências de locais de GTA VI de um jeito claro, fácil de explorar e honesto
        sobre seus limites.
      </p>
      <p className="project-release-version">
        Versão atual: <a href="#release-history">{LEONIDA_ATLAS_RELEASES[0]!.version}</a>
      </p>
      <Section title="Por que este mapa existe">
        <p>
          Trailers, capturas de tela, páginas oficiais e pesquisas da comunidade revelam pedaços de
          Leonida. O mapa reúne esses pedaços em uma base comum para você comparar as relações entre
          eles sem confundir uma estimativa com geografia confirmada.
        </p>
        <p>
          Este é um projeto da comunidade. Não é um mapa oficial, nem um arquivo vazado do jogo, nem
          uma promessa de que cada rua e ponto de referência vai aparecer no jogo lançado.
        </p>
      </Section>
      <Section title="O que significa aproximado">
        <p>
          Litorais, rotas e posições definidos pela comunidade podem mudar quando surgirem
          evidências melhores. A incerteza fica sempre visível: áreas sem fonte continuam
          desconhecidas em vez de serem completadas no chute.
        </p>
      </Section>
      <Section title="Seu mapa pessoal">
        <p>
          Explore o mapa como visitante, guarde favoritos e notas, organize coleções e adicione
          marcadores pessoais. Suas edições ficam salvas no armazenamento IndexedDB deste navegador.
          Exporte um backup para ter uma cópia portátil ou levar seu trabalho para outro navegador.
        </p>
        <p>
          Suas anotações pessoais ficam separadas do catálogo de fontes. Elas nunca transformam uma
          estimativa da comunidade em um local confirmado.
        </p>
      </Section>
      <AnalyticsPreferences />
      <Section title="Independente por natureza">
        <p>
          O aplicativo público é gerado como arquivos estáticos e funciona sem CMS, servidor privado
          ou conta. O código-fonte é licenciado sob AGPL-3.0-only. O explorador 3D opcional usa a
          mesma base de coordenadas da comunidade.
        </p>
      </Section>
      <Section title="Baseado no Leonida Atlas">
        <p>
          Esta edição do Mundo Vice é uma versão modificada do{' '}
          <a href={UPSTREAM_REPOSITORY} target="_blank" rel="noreferrer">
            Leonida Atlas
          </a>
          , projeto de código aberto criado por navanem e licenciado sob AGPL-3.0. O código-fonte
          desta versão modificada está disponível em{' '}
          <a href={MODIFIED_SOURCE_REPOSITORY} target="_blank" rel="noreferrer">
            github.com/mendesjf86/gta6-leonida-atlas
          </a>
          .
        </p>
      </Section>
      <Section title="Histórico de versões" id="release-history">
        <p>
          Todas as versões do Leonida Atlas desde a v0.5.0, da mais recente para a mais antiga.
        </p>
        <ol className="project-release-history">
          {LEONIDA_ATLAS_RELEASES.map((release, index) => (
            <li key={release.version} className="project-release-card">
              <div className="project-release-meta">
                <a
                  href={`https://github.com/navanem/gta6-leonida-atlas/releases/tag/${release.version}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {release.version}
                </a>
                {index === 0 && <span className="project-release-current">Atual</span>}
                <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>
              </div>
              <h3>{release.title}</h3>
              <p>{release.summary}</p>
            </li>
          ))}
        </ol>
        <a href={projectPath('changelog')}>Ver todas as notas de versão</a>
      </Section>
    </>
  );
}

function Documentation() {
  return (
    <>
      <p className="project-lead">
        Como os registros de fontes, os níveis de evidência e o seu trabalho local se encaixam.
      </p>
      <Section title="Explore e organize">
        <p>
          Pesquise por nome, tag ou identificador da fonte. Use camadas e filtros para refinar o
          mapa e selecione um local para ver a fonte, as coordenadas e o grau de incerteza. Salve
          como favorito, adicione uma nota ou inclua o local em uma coleção.
        </p>
        <p>
          Marcadores pessoais registram as suas próprias observações. As posições deles usam a mesma
          base de coordenadas do jogo que o catálogo e continuam claramente identificadas como dados
          pessoais.
        </p>
      </Section>
      <Section title="Coordenadas compartilhadas">
        <p>
          O plano de coordenadas representa unidades do jogo em Leonida, nunca latitude e longitude
          do mundo real. A transformação calibrada é <code>world x = GTADB x × 2</code> e{' '}
          <code>world z = −GTADB y × 2</code>. O mapa SVG antigo usa esse valor de world z no eixo
          vertical. O mapa principal e a reconstrução 3D ficam alinhados com os mesmos registros de
          fonte.
        </p>
        <p>
          Coordenadas ausentes continuam ausentes: zero é uma coordenada válida e nunca substitui
          uma posição desconhecida. Coordenadas de lugares equivalentes no mundo real servem só como
          referência de origem.
        </p>
      </Section>
      <Section title="Evidência e incerteza">
        <dl className="project-definitions">
          <dt>CONFIRMADO (CONFIRMED)</dt>
          <dd>
            Identidade visual ou existência comprovada por mídia oficial da Rockstar. Isso não
            confirma uma posição mapeada pela comunidade.
          </dd>
          <dt>EMBASADO (SUPPORTED)</dt>
          <dd>Uma identificação da comunidade com contexto de fonte utilizável.</dd>
          <dt>APROXIMADO (APPROXIMATE)</dt>
          <dd>Posição estimada pela comunidade, cartografia generalizada ou geometria reconstruída.</dd>
          <dt>DESCONHECIDO (UNKNOWN)</dt>
          <dd>
            Nomes desconhecidos, áreas sem cobertura, posições ausentes ou incerteza sinalizada pela
            fonte.
          </dd>
        </dl>
        <p>
          Marcações da fonte como não confirmado, pode não existir, cancelado, fictício, demolido e
          duplicado são mantidas. Elas não são notas de confiança intercambiáveis.
        </p>
      </Section>
      <Section title="Cartografia">
        <p>
          O mapa base vem dos tiles raster Yanis v16 do GTADB, em uma revisão fixa. Terra, água,
          vegetação, ruas e marcas de construções são generalizadas e recoloridas. A proximidade de
          pontos de referência nunca é usada para inventar ruas. O brilho no litoral é decorativo,
          não batimetria, e o sombreamento do terreno não é uma medição de altitude validada.
        </p>
        <p>
          As colunas de legenda e de capturas de tela ficam de fora. Margens sem mapeamento indicam
          ausência de cobertura na fonte, não evidência de mar. Anotações da fonte podem deixar
          marcas residuais onde as cores não podem ser separadas com segurança dos detalhes das
          ruas.
        </p>
      </Section>
      <Section title="Dados locais e backups">
        <p>
          Favoritos, notas, coleções, marcadores e preferências ficam salvos localmente no
          IndexedDB. Para salvar, o armazenamento do navegador precisa estar disponível. Limpar os
          dados do site apaga esses registros locais, e a navegação privada e os limites de
          armazenamento podem afetar o que fica salvo.
        </p>
        <p>
          Use a exportação para salvar um backup JSON com versão. A importação valida o conteúdo e
          mostra uma prévia antes de mesclar com os dados existentes. Um backup contém suas notas e
          marcadores pessoais, então compartilhe com cuidado.
        </p>
      </Section>
      <Section title="Explorador 3D opcional">
        <p>
          A visão 3D só carrega quando você abre. Ande com WASD ou as setas, segure Shift para
          correr, clique na cena para olhar com o mouse, aperte E para inspecionar evidências
          próximas e M para abrir o mapa de viagem. Esc libera o ponteiro. Em telas de toque, há um
          controle analógico de movimento, uma área para olhar e botões.
        </p>
        <p>
          Um toque intencional no mapa de viagem leva você até aquela coordenada. Arrastar, fazer
          pinça e gestos cancelados não acionam a viagem. Ajustes de chegada para evitar colisões
          são informados. Se o WebGL não estiver disponível, o mapa principal e o seu trabalho salvo
          continuam acessíveis.
        </p>
      </Section>
    </>
  );
}

function Credits() {
  return (
    <>
      <p className="project-lead">
        A cartografia da comunidade e as referências oficiais mantêm suas próprias fontes e
        direitos.
      </p>
      <Section title="Leonida Atlas">
        <p>
          O Mapa de Leonida do Mundo Vice é baseado no{' '}
          <a href={UPSTREAM_REPOSITORY} target="_blank" rel="noreferrer">
            Leonida Atlas
          </a>
          , projeto de código aberto de navanem distribuído sob a licença AGPL-3.0. Esta versão foi
          modificada (tradução para português do Brasil e identidade do Mundo Vice) e o código-fonte
          dela está em{' '}
          <a href={MODIFIED_SOURCE_REPOSITORY} target="_blank" rel="noreferrer">
            github.com/mendesjf86/gta6-leonida-atlas
          </a>
          .
        </p>
      </Section>
      <Section title="GTADB / Map GTA">
        <p>
          Os dados GTA VI Landmarks Data e GTA VI Map Tiles são fornecidos por{' '}
          <a href={GTADB_PREFERRED_SOURCE} target="_blank" rel="noreferrer">
            GTADB / Map GTA
          </a>{' '}
          e seus colaboradores. A arte do mapa da comunidade é o Yanis v16, distribuído pelo GTADB.
        </p>
        <p>
          A revisão fixada é <code className="project-revision">{GTADB_REVISION}</code>. O catálogo
          tem 2.198 registros: 2.091 com posição e 107 sem coordenadas.
        </p>
        <p>
          <a href={`${GTADB_SOURCE}/tree/${GTADB_REVISION}/maps`} target="_blank" rel="noreferrer">
            Fonte do mapa (revisão fixada)
          </a>{' '}
          ·{' '}
          <a href={GTADB_PINNED_DATA_URL} target="_blank" rel="noreferrer">
            Fonte dos pontos de referência (revisão fixada)
          </a>{' '}
          ·{' '}
          <a href={GTADB_LICENSE_URL} rel="license noreferrer" target="_blank">
            Creative Commons Attribution 4.0 International
          </a>
          .
        </p>
        <p>
          Nossa apresentação recolore e generaliza os pixels da fonte, remove as áreas de legenda e
          de capturas de tela que não são geográficas e adiciona um destaque decorativo no litoral.
          O brilho na água não é batimetria. Isso não implica nenhum endosso dos autores da fonte.
        </p>
        <p>
          <a href={publicPath('assets/gta6-leonida-atlas/ATTRIBUTION.md')}>
            Atribuição completa do mapa base
          </a>{' '}
          · <a href={publicPath('assets/gta6-leonida-atlas/metadata.json')}>Manifesto de geração</a>.
        </p>
      </Section>
      <Section title="Referências da Rockstar Games">
        <p>
          Trailers, capturas de tela e páginas oficiais da Rockstar embasam a identidade visual e a
          existência dos lugares. Eles não definem a precisão das posições mapeadas pela comunidade.
          Citar uma fonte não concede licença de reutilização.
        </p>
        <p>
          Grand Theft Auto, GTA, Rockstar Games, suas marcas e mídias oficiais pertencem aos
          respectivos detentores de direitos. Este projeto independente não é afiliado, endossado
          nem patrocinado pela Rockstar Games ou pela Take-Two Interactive.
        </p>
        <p>
          <a href="https://www.rockstargames.com/VI" target="_blank" rel="noreferrer">
            Site oficial de Grand Theft Auto VI
          </a>
          .
        </p>
      </Section>
      <Section title="Direção visual e reconstrução">
        <p>
          Um mapa ilustrado inspirou apenas a hierarquia original, o traço contido e a linguagem
          geral de cores. O litoral, os rótulos e a geometria dele não foram reaproveitados. A
          geometria procedural e os estudos gerados de materiais e vegetação são recursos de
          reconstrução, não arquivos extraídos do jogo GTA VI. Os direitos sobre eles são separados
          dos dados do mapa sob CC BY 4.0.
        </p>
      </Section>
      <Section title="Feito com">
        <p>
          React e TypeScript formam o aplicativo, o Vite gera os arquivos estáticos, o Leaflet cuida
          das interações do mapa principal, o Dexie gerencia o armazenamento IndexedDB e o Three.js
          renderiza a reconstrução opcional. O mapa de viagem mantém sua camada nativa de
          coordenadas em SVG. A tipografia da interface usa Inter e Oswald. As dependências mantêm
          suas próprias licenças.
        </p>
      </Section>
    </>
  );
}

function Contributing() {
  return (
    <>
      <p className="project-lead">
        Ajude a deixar as evidências mais fáceis de conferir, sem exagerar no que elas provam.
      </p>
      <Section title="Contribuições de evidências">
        <p>
          Uma boa correção inclui o local ou ponto de vista proposto, um link público e estável da
          fonte, quem publicou, o que a fonte mostra de fato e um nível de evidência compatível com
          a afirmação. Proximidade, memória ou boatos repetidos pela comunidade não bastam.
        </p>
        <ul>
          <li>Separe a referência visual oficial da posição estimada pela comunidade.</li>
          <li>Mantenha coordenadas ausentes como desconhecidas; nunca use zero no lugar.</li>
          <li>Não deduza ruas, limites ou nomes a partir de pontos de referência vizinhos.</li>
          <li>Inclua a atribuição e as informações de direitos do material enviado.</li>
          <li>Mantenha os identificadores da fonte e explique as mudanças em registros importados.</li>
        </ul>
      </Section>
      <Section title="Contribuições de código e forks">
        <p>
          Siga as instruções de contribuição e use o rastreador de issues do repositório ou fork em
          que você está trabalhando. Inclua uma descrição objetiva, o comportamento esperado e a
          verificação relevante. As transformações de coordenadas, os níveis de evidência e a
          separação entre dados da fonte e edições pessoais precisam continuar intactos.
        </p>
        <p>
          O aplicativo público deve ser gerado e funcionar como visitante, sem credenciais privadas.
          Deixe credenciais e configurações locais fora das mudanças no código. Integrações
          opcionais devem continuar explícitas e configuráveis de forma independente.
        </p>
      </Section>
      <Section title="Anotações pessoais">
        <p>
          Notas e marcadores locais são um bom lugar para juntar observações antes de propor uma
          correção de fonte. Exportar um backup compartilha essas anotações, mas não envia nada ao
          projeto nem publica mudanças no catálogo de fontes.
        </p>
      </Section>
    </>
  );
}

function Changelog() {
  return (
    <>
      <p className="project-lead">
        Histórico de versões do Leonida Atlas, a partir da v0.5.0.
      </p>
      {LEONIDA_ATLAS_RELEASES.map((release) => (
        <Section key={release.version} title={release.title}>
          <p className="project-release-version">
            {release.version} ·{' '}
            <time dateTime={release.date}>{formatReleaseDate(release.date)}</time>{' '}
            · {release.status === 'public' ? 'Publicada' : 'Em preparação'}
          </p>
          <p>{release.summary}</p>
          <h3>O que mudou</h3>
          <ul>
            {release.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Verificação</h3>
          <ul>
            {release.verification.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ))}
      <p>
        O escopo detalhado da verificação e as limitações de navegador estão registrados na
        documentação de versões do repositório.
      </p>
    </>
  );
}

function Licenses() {
  return (
    <>
      <p className="project-lead">
        O código do projeto, os dados da comunidade e as referências de terceiros têm direitos
        separados.
      </p>
      <Section title="Código do projeto">
        <p>
          O código-fonte original do GTA6 Leonida Atlas neste repositório é licenciado sob a GNU
          Affero General Public License v3.0 only (<code>AGPL-3.0-only</code>). O arquivo LICENSE do
          repositório traz os termos completos. Veja THIRD_PARTY_LICENSES.md para os avisos de
          terceiros.
        </p>
        <p>
          Esta é uma versão modificada do{' '}
          <a href={UPSTREAM_REPOSITORY} target="_blank" rel="noreferrer">
            Leonida Atlas
          </a>{' '}
          de navanem, publicada pelo Mundo Vice sob a mesma licença AGPL-3.0. O código-fonte
          correspondente desta versão está em{' '}
          <a href={MODIFIED_SOURCE_REPOSITORY} target="_blank" rel="noreferrer">
            github.com/mendesjf86/gta6-leonida-atlas
          </a>
          .
        </p>
      </Section>
      <Section title="Dados e cartografia derivados do GTADB">
        <p>
          Os dados de pontos de referência do GTADB e o material cartográfico de origem Yanis v16
          continuam sob a licença{' '}
          <a href={GTADB_LICENSE_URL} rel="license noreferrer" target="_blank">
            Creative Commons Attribution 4.0 International
          </a>
          . Mantenha a atribuição ao GTADB e a seus colaboradores, inclua o link para a licença e
          identifique as adaptações.
        </p>
        <p>
          As adaptações incluem transformações de coordenadas, filtragem, janelas de renderização,
          apresentação generalizada e recolorida do mapa base e metadados derivados. A{' '}
          <a href={projectPath('credits')}>página de créditos</a> identifica a fonte fixada e o
          manifesto local de geração.
        </p>
        <p>
          Qualquer código copiado diretamente do GTADB continua sujeito à licença MIT original e aos
          avisos de copyright, quando aplicável.
        </p>
      </Section>
      <Section title="Material da Rockstar e de outros terceiros">
        <p>
          O material da Rockstar Games é citado como evidência de referência e continua sendo
          propriedade dos detentores de direitos. Ele não é licenciado junto com o código deste
          projeto nem com a camada cartográfica. Uma citação não concede direitos de reutilização.
          Outros recursos de terceiros mantêm as licenças indicadas pelos seus donos.
        </p>
        <p>
          Os estudos de reconstrução procedurais e gerados são distintos dos dados de origem do
          GTADB. Consulte os avisos de recursos do repositório para saber como podem ser
          reutilizados.
        </p>
      </Section>
    </>
  );
}

const content: Record<string, () => ReactNode> = {
  about: About,
  documentation: Documentation,
  credits: Credits,
  contributing: Contributing,
  changelog: Changelog,
  licenses: Licenses,
};

export default function ProjectPage({ page, onClose }: ProjectPageProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const selected = content[page] ? page : 'about';
  const Content = content[selected]!;
  const title = ATLAS_PROJECT_META[selected]!.heading;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const fragment = window.location.hash.slice(1);
    const destination = ['analytics-preferences', 'release-history'].includes(fragment)
      ? document.getElementById(fragment)
      : null;
    if (destination) {
      destination.scrollIntoView({ block: 'start' });
      destination.focus({ preventScroll: true });
    } else closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onClose]);
  return (
    <main className="project-page" aria-label={title}>
      <header className="project-header">
        <a href={publicPath('')} className="project-brand">
          MAPA DE <span>LEONIDA</span>
        </a>
        <button ref={closeRef} type="button" onClick={onClose}>
          Voltar ao mapa
        </button>
      </header>
      <div className="project-layout">
        <nav className="project-navigation" aria-label="Páginas do projeto">
          {pages.map(([key, label]) => (
            <a
              key={key}
              href={projectPath(key)}
              aria-current={selected === key ? 'page' : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
        <article className="project-article">
          <p className="project-eyebrow">MUNDO VICE · MAPA DA COMUNIDADE DE GTA 6</p>
          <h1>{title}</h1>
          <Content />
          <footer>
            Geografia estimada pela comunidade · Não é um mapa oficial da Rockstar · Baseado no
            Leonida Atlas (AGPL-3.0)
          </footer>
        </article>
      </div>
    </main>
  );
}

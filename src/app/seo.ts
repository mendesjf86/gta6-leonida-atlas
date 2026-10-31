/** Public route subjects shared by the static HTML build and client navigation. */
export const ATLAS_PROJECT_META: Record<
  string,
  { title: string; heading: string; description: string }
> = {
  about: {
    title: "Sobre o projeto: fontes e métodos | Mapa de Leonida · Mundo Vice",
    heading: "Sobre o Mapa de Leonida",
    description:
      "Conheça o Mapa de Leonida do Mundo Vice, sua geografia aproximada feita pela comunidade, os dados locais e o histórico público de versões.",
  },
  documentation: {
    title: "Guia do mapa de GTA 6: Yanis v16, fontes e controles | Mapa de Leonida · Mundo Vice",
    heading: "Como usar o Mapa de Leonida",
    description:
      "Aprenda a explorar o Mapa de Leonida, usar o mapa base Yanis v16 e diferenciar informações confirmadas do mapeamento aproximado da comunidade.",
  },
  credits: {
    title: "Créditos: Yanis v16, GTADB e fontes do mapa | Mapa de Leonida · Mundo Vice",
    heading: "Créditos do Yanis v16 e do Mapa de Leonida",
    description:
      "Veja a atribuição do Yanis v16 e do GTADB, as fontes dos pontos de referência, as referências da Rockstar e os avisos de direitos do Mapa de Leonida.",
  },
  contributing: {
    title: "Como contribuir: fontes e correções | Mapa de Leonida · Mundo Vice",
    heading: "Como contribuir com o Mapa de Leonida",
    description:
      "Saiba como enviar fontes verificáveis, apontar correções no mapeamento e melhorar o Mapa de Leonida mantendo a atribuição das fontes.",
  },
  changelog: {
    title: "Novidades: histórico público de versões | Mapa de Leonida · Mundo Vice",
    heading: "Histórico de versões do Mapa de Leonida",
    description:
      "Leia o histórico público de versões do Mapa de Leonida, com mudanças na cartografia da comunidade, no explorador 3D opcional e nas ferramentas locais.",
  },
  licenses: {
    title: "Licenças: código, cartografia e direitos de conteúdo | Mapa de Leonida · Mundo Vice",
    heading: "Licenças de código e conteúdo do Mapa de Leonida",
    description:
      "Confira a licença AGPL do código, a atribuição da cartografia do GTADB e os direitos separados das referências da Rockstar e de outros conteúdos de terceiros.",
  },
};
export const ATLAS_ENTRY_META = {
  title: "Mapa interativo de GTA 6 | Mapa de Leonida · Mundo Vice",
  heading: "Mapa de Leonida",
  description:
    "Explore um mapa aproximado de Leonida feito pela comunidade, confira as fontes de cada local e guarde favoritos, notas e coleções no seu navegador.",
};
export function atlasPageMeta(
  pathname: string,
  search = "",
  base = "/",
  origin = "",
) {
  const prefix = `/${base.replace(/^\/+|\/+$/g, "")}`.replace(/\/$/, "");
  const relative =
    pathname === prefix
      ? ""
      : pathname.startsWith(`${prefix}/`)
        ? pathname.slice(prefix.length + 1).replace(/\/+$/, "")
        : "!unknown";
  const project = Object.hasOwn(ATLAS_PROJECT_META, relative)
    ? ATLAS_PROJECT_META[relative]
    : undefined;
  const metadata = project ?? ATLAS_ENTRY_META;
  const path = project ? `${prefix}/${relative}` : `${prefix}/`;
  let canonical: string | null = null;
  try {
    const site = new URL(origin);
    if (
      /^https?:$/.test(site.protocol) &&
      !site.username &&
      !site.password &&
      site.origin === origin.replace(/\/$/, "")
    )
      canonical = `${site.origin}${path}`;
  } catch {
    /* Public forks may omit their deployment origin. */
  }
  return {
    ...metadata,
    canonical,
    robots:
      !search && (relative === "" || project)
        ? "index, follow"
        : "noindex, follow",
  };
}
export function updateAtlasHead(pathname: string, search: string) {
  const metadata = atlasPageMeta(
    pathname,
    search,
    import.meta.env.BASE_URL,
    import.meta.env.VITE_ATLAS_SITE_ORIGIN,
  );
  document.title = metadata.title;
  for (const [name, content] of [
    ["description", metadata.description],
    ["robots", metadata.robots],
    ["twitter:title", metadata.title],
    ["twitter:description", metadata.description],
  ]) {
    let element = document.head.querySelector<HTMLMetaElement>(
      `meta[name="${name}"]`,
    );
    if (!element) {
      element = document.createElement("meta");
      element.name = name!;
      document.head.append(element);
    }
    element.content = content!;
  }
  for (const [property, content] of [
    ["og:title", metadata.title],
    ["og:description", metadata.description],
    ["og:url", metadata.canonical],
  ]) {
    const element = document.head.querySelector<HTMLMetaElement>(
      `meta[property="${property}"]`,
    );
    if (element && content) element.content = content;
  }
  const canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (canonical && metadata.canonical) canonical.href = metadata.canonical;
}

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import ProjectPage from "./ProjectPage";
import {
  ATLAS_ENTRY_META,
  ATLAS_PROJECT_META,
  atlasPageMeta,
} from "../../app/seo";
import { projectPath, publicPath } from "../explorer/public-path";

function AtlasIntroduction() {
  return (
    <main className="project-page" aria-labelledby="atlas-introduction-title">
      <header className="project-header">
        <span className="project-brand">MAPA DE LEONIDA</span>
      </header>
      <div className="project-layout">
        <nav className="project-navigation" aria-label="Páginas do projeto">
          {Object.keys(ATLAS_PROJECT_META).map((page) => (
            <a key={page} href={projectPath(page)}>
              {ATLAS_PROJECT_META[page]!.heading}
            </a>
          ))}
        </nav>
        <article className="project-article">
          <p className="project-eyebrow">MUNDO VICE · MAPA DA COMUNIDADE DE GTA 6</p>
          <h1 id="atlas-introduction-title">{ATLAS_ENTRY_META.heading}</h1>
          <p className="project-lead">{ATLAS_ENTRY_META.description}</p>
          <h2>Fontes e geografia aproximada</h2>
          <p>
            O mapa usa a cartografia Yanis v16 e os registros de pontos de
            referência do GTADB. Posições estimadas pela comunidade são
            diferentes das evidências oficiais de locais da Rockstar. Este não é
            um mapa oficial, e áreas sem cobertura continuam desconhecidas.
          </p>
          <p>
            <a href={projectPath("documentation")}>
              Leia o guia do mapa e os níveis de evidência
            </a>{" "}
            ou{" "}
            <a href={projectPath("credits")}>
              confira as fontes e a atribuição do mapa
            </a>
            .
          </p>
          <h2>Seu mapa pessoal</h2>
          <p>
            O mapa interativo abre com JavaScript. Explore como visitante, salve
            favoritos, escreva notas e organize coleções localmente neste
            navegador. Uma reconstrução 3D opcional usa a mesma base de
            coordenadas aproximada.
          </p>
          <p>
            <a href={`${publicPath("")}?view=3d`}>
              Abrir o explorador 3D opcional
            </a>
          </p>
          <p>
            Baseado no{" "}
            <a href="https://github.com/navanem/gta6-leonida-atlas">
              Leonida Atlas
            </a>{" "}
            de navanem (AGPL-3.0). Código-fonte desta versão modificada:{" "}
            <a href="https://github.com/mendesjf86/gta6-leonida-atlas">
              github.com/mendesjf86/gta6-leonida-atlas
            </a>
            . Não é afiliado à Rockstar Games nem à Take-Two Interactive.
          </p>
        </article>
      </div>
    </main>
  );
}
export function renderStaticPage(page: string, base: string, origin: string) {
  const path = `${base}${page}`;
  return {
    metadata: atlasPageMeta(path, "", base, origin),
    markup: renderToString(
      Object.hasOwn(ATLAS_PROJECT_META, page)
        ? createElement(ProjectPage, { page, onClose: () => undefined })
        : createElement(AtlasIntroduction),
    ),
  };
}

import { useId } from "react";
import { explorerPath } from "../explorer/public-path";
import type { StreetLeonidaRegionSlug } from "../street-leonida/leonida-evidence";
import {
  getRegionDiscoveries,
  RESEARCH_REGIONS,
  RESEARCH_REVIEWED_AT,
  RESEARCH_SOURCES,
} from "../street-leonida/leonida-research";
import "./regional-research.css";

interface RegionalResearchProps {
  /** Omit to show all six region groups in the explorer's existing Evidence dialog. */
  region?: StreetLeonidaRegionSlug;
  travel?: "explorer" | "link";
}

/** Shows ISO calendar dates (YYYY-MM-DD) as pt-BR dates; other values pass through. */
function formatDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export default function RegionalResearch({
  region,
  travel = "link",
}: RegionalResearchProps) {
  const headingId = useId();
  const groups = region
    ? RESEARCH_REGIONS.filter((item) => item.slug === region)
    : RESEARCH_REGIONS;
  return (
    <section className="regional-research" aria-labelledby={headingId}>
      <h3 id={headingId}>Descubra Leonida</h3>
      <p className="regional-research-intro">
        {region ? "Contexto da região. " : ""}
        Nomes oficiais e detalhes visíveis. Estas fontes não definem a
        localização exata.
      </p>
      <small className="regional-research-reviewed">
        Fontes revisadas em{" "}
        <time dateTime={RESEARCH_REVIEWED_AT}>
          {formatDate(RESEARCH_REVIEWED_AT)}
        </time>
        . As datas de publicação de cada imagem não foram informadas.
      </small>
      {groups.map((group) => (
        <details className="regional-research-group" key={group.slug}>
          <summary>
            {group.name}
            <span>
              {getRegionDiscoveries(group.slug).length}{" "}
              {getRegionDiscoveries(group.slug).length === 1
                ? "descoberta"
                : "descobertas"}
            </span>
          </summary>
          <p className="regional-research-overview">{group.summary}</p>
          <ul className="regional-discoveries">
            {getRegionDiscoveries(group.slug).map((discovery) => (
              <li key={discovery.id} data-research-discovery={discovery.id}>
                <h4>{discovery.title}</h4>
                <p>{discovery.summary}</p>
                <ul
                  className="regional-discovery-sources"
                  aria-label={`Fontes de ${discovery.title}`}
                >
                  {discovery.sourceIds.map((sourceId) => {
                    const source = RESEARCH_SOURCES[sourceId]!;
                    return (
                      <li key={sourceId}>
                        <span>
                          {source.evidence === "official-image"
                            ? "Imagem oficial"
                            : "Texto oficial"}
                        </span>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <p className="regional-research-placement">
            A viagem abre a vista aproximada da região, não o lugar exato
            descrito acima.
          </p>
          {travel === "explorer" ? (
            <button
              type="button"
              data-walk-region={group.slug}
              aria-label={`Explorar a região: ${group.name}`}
            >
              Explorar a região
            </button>
          ) : (
            <a
              className="regional-research-travel"
              href={explorerPath(`region:${group.slug}`)}
            >
              Explorar {group.name} em 3D
            </a>
          )}
        </details>
      ))}
      {!region && (
        <div className="regional-research-videos">
          <h4>Vídeos oficiais</h4>
          <p>Vídeos lançados pela Rockstar, com as datas de publicação.</p>
          {["extended-look", "trailer-2"].map((id) => {
            const source = RESEARCH_SOURCES[id]!;
            return (
              <p key={id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
                {" · "}
                <time dateTime={source.publishedAt!}>
                  {formatDate(source.publishedAt!)}
                </time>
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}

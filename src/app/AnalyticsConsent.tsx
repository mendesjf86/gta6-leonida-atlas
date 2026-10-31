import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import {
  analyticsAvailable,
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
} from './analytics';
import { projectPath } from '../features/explorer/public-path';
import './analytics-consent.css';

function useConsent() {
  return useSyncExternalStore(subscribeAnalyticsConsent, getAnalyticsConsent, () => 'unknown');
}

function Choices({ consent, beforeChoose }: { consent: string; beforeChoose?: () => void }) {
  function choose(value: 'granted' | 'denied') {
    beforeChoose?.();
    setAnalyticsConsent(value);
  }
  return (
    <div
      className="analytics-choices"
      onKeyDown={(event) => {
        // Global 3D shortcuts must leave native button activation to the browser.
        if (event.key !== 'Escape') event.stopPropagation();
      }}
    >
      <button type="button" aria-pressed={consent === 'denied'} onClick={() => choose('denied')}>
        {consent === 'denied' ? 'Estatísticas recusadas' : 'Recusar estatísticas'}
      </button>
      <button type="button" aria-pressed={consent === 'granted'} onClick={() => choose('granted')}>
        {consent === 'granted' ? 'Estatísticas permitidas' : 'Permitir estatísticas'}
      </button>
    </div>
  );
}

export function AnalyticsConsent() {
  const consent = useConsent();
  const notice = useRef<HTMLElement>(null);
  const restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (consent === 'unknown' || !restoreFocus.current) return;
    restoreFocus.current = false;
    const preference = document.querySelector<HTMLElement>(
      '#analytics-preferences button[aria-pressed="true"]',
    );
    const destination =
      preference ??
      document.querySelector<HTMLElement>(
        'main button:not(:disabled), main a[href], main input:not(:disabled), .explorer-view button:not(:disabled)',
      );
    destination?.focus();
  }, [consent]);
  if (!analyticsAvailable() || consent !== 'unknown') return null;
  return (
    <section ref={notice} className="analytics-notice" aria-labelledby="analytics-notice-title">
      <h2 id="analytics-notice-title">Ajude a gente a entender as visitas</h2>
      <p>
        Permitir que o Google Analytics conte visitas usando um ID aleatório do navegador? Sua conta,
        notas, favoritos e buscas ficam fora do Analytics. Você pode mudar sua escolha em{' '}
        <a href={`${projectPath('about')}#analytics-preferences`}>Sobre</a>.
      </p>
      <Choices
        consent={consent}
        beforeChoose={() => {
          restoreFocus.current = Boolean(notice.current?.contains(document.activeElement));
        }}
      />
    </section>
  );
}

export function AnalyticsPreferences() {
  const consent = useConsent();
  if (!analyticsAvailable()) return null;
  return (
    <section className="project-section" id="analytics-preferences" tabIndex={-1}>
      <h2>Medição de audiência</h2>
      <p>
        O Google Analytics só conta visitas e navegadores que voltam depois que você permite. Um ID
        aleatório do navegador fica salvo neste aparelho, separado da sua conta do mapa. Recursos de
        publicidade ficam desligados. Dados da conta, notas, favoritos, buscas e locais pessoais nunca
        são enviados ao Analytics.
      </p>
      <p>
        Recusar interrompe a medição e apaga o ID de medição salvo. Seus dados e sua conta do mapa
        continuam disponíveis.
      </p>
      <Choices consent={consent} />
    </section>
  );
}

import { useState } from 'react';
import { atlasRepository } from '../../db/repository';
import { saveLocal, usePersistenceStore, useUserStore } from '../../stores/atlas';
import { Modal } from '../../app/Modal';

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const preferences = useUserStore((s) => s.preferences);
  const ready = usePersistenceStore((s) => s.ready);
  const [storageMessage, setStorageMessage] = useState('');
  return (
    <Modal title="Ajustes do mapa" onClose={onClose}>
      <div className="settings-list">
        {(
          [
            {
              key: 'showLabels',
              title: 'Nomes no mapa',
              description: 'Mostrar o nome dos locais quando o zoom estiver próximo.',
            },
            {
              key: 'clusterMarkers',
              title: 'Agrupar marcadores próximos',
              description: 'Juntar pontos para deixar as áreas cheias mais fáceis de ler.',
            },
            {
              key: 'reducedMotion',
              title: 'Reduzir movimento',
              description: 'Mover o mapa sem animação e com transições mais discretas.',
            },
          ] as const
        ).map((option) => (
          <label className="setting-row" key={option.key}>
            <span>
              {option.title}
              <small>{option.description}</small>
            </span>
            <input
              type="checkbox"
              disabled={!ready}
              checked={preferences[option.key]}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                void saveLocal(() =>
                  atlasRepository.savePreferences({
                    ...useUserStore.getState().preferences,
                    [option.key]: checked,
                  }),
                );
              }}
            />
          </label>
        ))}
      </div>
      <section className="detail-section">
        <h3>Armazenamento neste aparelho</h3>
        <p className="help-text">
          Seu navegador guarda os dados pessoais no IndexedDB. Os backups protegem seu trabalho se os
          dados do navegador forem apagados. O mapa e o app abrem offline depois do primeiro
          carregamento completo, e as texturas 3D ficam em cache conforme você explora.
        </p>
        <button
          className="button"
          disabled={!ready}
          onClick={async () => {
            const persisted = await atlasRepository.requestPersistence();
            setStorageMessage(
              persisted
                ? 'O armazenamento persistente está ativado.'
                : 'Seu navegador não liberou o armazenamento persistente. Salvar localmente continua funcionando, mas guarde um backup exportado.',
            );
          }}
        >
          Proteger armazenamento local
        </button>
        {storageMessage && (
          <p role="status" className="help-text">
            {storageMessage}
          </p>
        )}
      </section>
      <section className="detail-section">
        <h3>Teclado</h3>
        <p className="help-text">
          / para buscar · Esc para fechar o local selecionado ou cancelar o posicionamento · setas para
          mover o mapa em foco · + / − para dar zoom. Use o formulário de coordenadas do marcador para
          posicionar um ponto sem mouse.
        </p>
      </section>
    </Modal>
  );
}

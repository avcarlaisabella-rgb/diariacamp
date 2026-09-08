import { Worker } from '../types';

/**
 * Um trabalhador só pode ter diárias lançadas (frequência) e aparecer no
 * setor financeiro depois de liberado na tela de Aprovações. Cadastros sem
 * approvalStatus definido (dados legados) são tratados como liberados se já
 * têm um status de atividade — só bloqueia quem está explicitamente
 * Pendente/Aguardando Liberação ou foi Rejeitado.
 */
export function isWorkerLiberado(worker: Worker): boolean {
  if (worker.approvalStatus === 'Liberado') return true;
  if (worker.approvalStatus === 'Pendente' || worker.approvalStatus === 'Rejeitado') return false;
  if (worker.status === 'Aguardando Liberação') return false;
  return true;
}

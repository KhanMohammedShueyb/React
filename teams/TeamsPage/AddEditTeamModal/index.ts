import { openModal } from '@core/components/ModalStack';
import { AddEditTeamModalProps } from './AddEditTeamModal';

export async function openAddEditTeamModal(props: AddEditTeamModalProps) {
  const { AddEditTeamModal } = await import('./AddEditTeamModal');

  openModal(AddEditTeamModal, props);
}

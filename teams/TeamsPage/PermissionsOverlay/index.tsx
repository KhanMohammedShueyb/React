import { openModal } from '@core/components/ModalStack';
import { PermissionsOverlayProps } from './PermissionsOverlay';

export async function openPermissionsOverlay(props: PermissionsOverlayProps) {
  const { PermissionsOverlay } = await import('./PermissionsOverlay');

  openModal(PermissionsOverlay, props);
}

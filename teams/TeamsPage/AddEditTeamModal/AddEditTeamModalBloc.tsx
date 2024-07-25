import { BaseBloc } from '@core/utils/bloc';
import { resolve } from '@core/utils/ioc';
import { Blocs } from '@business/blocs';

export class AddEditTeamModalBloc extends BaseBloc {
  private readonly userBloc = resolve(Blocs.user);
  private readonly teamBloc = resolve(Blocs.team);

  users$ = this.userBloc.staff$;

  onInit() {
    return this.userBloc.fetchUsers();
  }

  createTeam = this.teamBloc.createTeam;
  updateTeam = this.teamBloc.updateTeam;
}

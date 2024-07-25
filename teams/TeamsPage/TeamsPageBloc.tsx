import { Blocs } from '@business/blocs';
import { BaseBloc } from '@core/utils/bloc';
import { resolve } from '@core/utils/ioc';

export class TeamsPageBloc extends BaseBloc {
  private readonly usersBloc = resolve(Blocs.user);
  private readonly teamBloc = resolve(Blocs.team);

  teams$ = this.teamBloc.teams$;

  onInit() {
    return this.teamBloc.fetchTeams();
  }

  deleteTeam = this.teamBloc.deleteTeam;
}

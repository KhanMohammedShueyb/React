import { Blocs } from '@business/blocs';
import { BaseBloc } from '@core/utils/bloc';
import { resolve } from '@core/utils/ioc';
import { LoadingState } from '@core/utils/repository/loading_state';
import { forkJoin } from 'rxjs';

export class PermissionsOverlayBloc extends BaseBloc {
  private readonly usersBloc = resolve(Blocs.user);
  private readonly teamBloc = resolve(Blocs.team);
  private readonly channelsBloc = resolve(Blocs.supportChannel);
  private readonly dealBloc = resolve(Blocs.dealBoard);
  private readonly projectBloc = resolve(Blocs.board);
  private readonly templateBloc = resolve(Blocs.checklistTemplate);
  private readonly tmBoardBloc = resolve(Blocs.timeMaterialBoard);
  private readonly arDashboardBloc = resolve(Blocs.arDashboard);

  teams$ = this.teamBloc.teams$;
  users$ = this.usersBloc.users$;
  channels$ = this.channelsBloc.channels$;
  dealBoards$ = this.dealBloc.boards$;
  projectBoards$ = this.projectBloc.boards$;
  tmBoards$ = this.tmBoardBloc.boards$;
  templates$ = this.templateBloc.templates$;
  dashboards$ = this.arDashboardBloc.dashboards$;

  loading$ = new LoadingState();

  onInit() {
    return forkJoin(
      this.usersBloc.fetchUsers(),
      this.channelsBloc.fetchChannels(),
      this.dealBloc.fetchDealBoards(),
      this.projectBloc.fetchBoards(),
      this.teamBloc.fetchTeams(),
      this.arDashboardBloc.fetchDashoards(),
      this.templateBloc.fetchChecklists(),
      this.tmBoardBloc.fetchTimeMaterialBoards(true, true),
    ).pipe(this.loading$.run());
  }
}

import { TeamAPI } from '@business/api/team';
import { TeamId, TeamRequest, TeamResponse } from '@business/entities/team';
import { handleMessage, requestMessage } from '@business/messages';
import { BaseBloc } from '@core/utils/bloc';
import { Repository } from '@core/utils/repository';
import { showDeleteConfirmation } from '@modules/common';
import { switchMap } from 'rxjs/operators';

export class TeamBloc extends BaseBloc {
  readonly teamRepo = new Repository<TeamResponse>({
    getItemId: team => team.id,
  });

  readonly teams$ = this.teamRepo.items$;
  readonly selectTeam = this.teamRepo.selectItem;

  onReset() {
    this.teamRepo.reset();
  }

  fetchTeams = () => {
    return TeamAPI.fetchTeams().pipe(this.teamRepo.ops.reset(), handleMessage({ error: requestMessage('fetch_teams_error') }));
  };

  fetchTeam = (id: TeamId) => {
    return TeamAPI.fetchTeam(id).pipe(
      this.teamRepo.ops.upsertOne(item => ({ item })),
      handleMessage({ error: requestMessage('fetch_teams_error') }),
    );
  };

  createTeam = (data: TeamRequest) => {
    return TeamAPI.createTeam(data).pipe(
      this.teamRepo.ops.addOne(item => item),
      handleMessage({
        type: requestMessage('create_team'),
      }),
    );
  };

  updateTeam = (id: TeamId, data: TeamRequest) => {
    return TeamAPI.updateTeam(id, data).pipe(
      this.teamRepo.ops.upsertOne(item => ({ item })),
      handleMessage({
        type: requestMessage('update_team'),
      }),
    );
  };

  deleteTeam = (teamId: TeamId) => {
    return showDeleteConfirmation('Delete Team', 'Do you really want to remove this team').pipe(
      switchMap(() => TeamAPI.deleteTeam(teamId)),
      this.teamRepo.ops.removeOne(() => teamId),
      handleMessage({
        type: requestMessage('delete_team'),
      }),
    );
  };
}

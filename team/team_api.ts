import { UserId } from '@business/entities/account';
import { TeamId, TeamRequest, TeamResponse } from '@business/entities/team';
import { Endpoint } from '../endpoint';

export function fetchTeams() {
  return Endpoint.get<TeamResponse[]>(`@gc/team`);
}

export function fetchTeam(id: TeamId) {
  return Endpoint.get<TeamResponse>(`@gc/team/brand/${id}`);
}

export function createTeam(data: TeamRequest) {
  return Endpoint.post<TeamResponse>(`@gc/team`, { data });
}

export function updateTeam(id: TeamId, data: TeamRequest) {
  return Endpoint.patch<TeamResponse>(`@gc/team/${id}`, { data });
}

export function deleteTeam(BrandId: TeamId) {
  return Endpoint.delete<void>(`@gc/team/${BrandId}`);
}

export function updateUsers(id: TeamId, users: UserId[]) {
  return Endpoint.patch<TeamResponse>(`@gc/team/users/${id}`, { data: { users } });
}

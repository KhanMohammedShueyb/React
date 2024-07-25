import React, { memo, useMemo, useCallback } from 'react';
import { Container, Card, CardBody, Row, Col, UncontrolledTooltip } from 'reactstrap';
import { PageHeader } from '@modules/common';
import { CommonService } from '@business/services';
import { useBloc } from '@core/utils/bloc';
import { TeamsPageBloc } from './TeamsPageBloc';
import { useObservable } from '@core/utils/hooks/rxjs';
import './index.scss';
import { TableActions } from '@modules/common/TableActions';
import { openAddEditTeamModal } from './AddEditTeamModal';
import { TeamResponse } from '@business/entities/team';
import { R } from '@core/utils/r';
import { openPermissionsOverlay } from './PermissionsOverlay';
import { AvatarGroup } from '@modules/common/AvatarGroup';
const COLORS = ['info', 'primary', 'success', 'dark', 'secondary', 'warning', 'pink'];

interface TeamItemProps {
  team: TeamResponse;
  onEdit(): void;
  onDelete(): void;
}

const TeamItem = memo((props: TeamItemProps) => {
  const { team, onEdit, onDelete } = props;

  return (
    <Col sm={12} mg={6} lg={6}>
      <Card>
        <CardBody>
          <div className="d-flex flex-direction-column">
            <h3 style={{ flex: 3 }}>{team.name}</h3>
            <TableActions onEdit={() => onEdit()} onDelete={() => onDelete()} onPermission={() => openPermissionsOverlay({ teamId: team.id })} />
          </div>
          <AvatarGroup
            items={team.users.map(user => ({ id: user.id, title: CommonService.getFullName(user) }))}
            sort
            onClick={item => openPermissionsOverlay({ userId: item.id })}
          />
        </CardBody>
      </Card>
    </Col>
  );
});

export const TeamsPage = memo(() => {
  const bloc = useBloc(TeamsPageBloc);
  const teams = useObservable(bloc.teams$, []);

  const buttons = useMemo(() => {
    return [
      {
        title: `Add Team`,
        onClick: () => openAddEditTeamModal({}),
      },
    ];
  }, []);

  const onDelete = useCallback(
    (teamId: string) => {
      bloc.deleteTeam(teamId).subscribe();
    },
    [bloc],
  );

  const onEdit = useCallback((team: TeamResponse) => {
    openAddEditTeamModal({ team });
  }, []);

  return (
    <div className="page-content">
      <Container fluid>
        <PageHeader buttons={buttons}>Teams</PageHeader>
        <Row>
          {teams.map(team => (
            <TeamItem key={team.id} onEdit={() => onEdit(team)} onDelete={() => onDelete(team.id)} team={team} />
          ))}
        </Row>
      </Container>
    </div>
  );
});

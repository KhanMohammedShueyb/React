import { PermissionAPI } from '@business/api/permission';
import { GCModule, GCPermission, generatePermissions } from '@business/constants/permissions';
import { UserId } from '@business/entities/account';
import { PermissionResponse } from '@business/entities/permission';
import { TeamId } from '@business/entities/team';
import { CommonService } from '@business/services';
import { FlashMessage } from '@core/components/FlashMessage';
import { LoadingIndicator } from '@core/components/LoadingIndicator';
import { ModalAction, ModalContent, ModalDrawer, ModalFooter, ModalHeader } from '@core/components/Modal';
import { useModalInstance } from '@core/components/ModalStack';
import { useBloc } from '@core/utils/bloc';
import { formControl, FormDataType, formGroup, useFormConfig, useFormState } from '@core/utils/form';
import { useObservable } from '@core/utils/hooks/rxjs';
import { R } from '@core/utils/r';
import { useLoadingState } from '@core/utils/repository/loading_state';
import { css } from '@emotion/core';
import { Session } from '@modules/auth/session';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Card, CardBody } from 'reactstrap';
import { tap } from 'rxjs/operators';
import { PermissionItem } from './PermissionItem';
import { PermissionsOverlayBloc } from './PermissionsOverlayBloc';
import { useAccountSettings } from '@core/utils/hooks/misc/useSettings';

function definePermissionForm(permission: GCPermission) {
  let ids = [];
  if (permission && permission.ids && permission.ids.length) {
    ids = permission.ids;
  } else {
    if (permission.ids) {
      ids = ['0'];
    } else {
      ids = permission.defaultValue == 'me' ? ['-1'] : ['0'];
    }
  }
  return formGroup({
    item: formControl<boolean>({
      label: permission.title,
      initialValue: permission?.value,
    }),
    ids: formControl<string[]>({
      required: permission.detailed || false,
      initialValue: ids,
    }),
    module: formControl<GCModule>({
      initialValue: permission.module,
    }),
  });
}

function definePermissionsForm(permissions: GCPermission[]) {
  return formGroup({
    ...R.fromPairs(permissions.map(p => [p.key, definePermissionForm(p)])),
  });
}

export type PermissionFormData = FormDataType<typeof definePermissionForm>;

export type PermissionsFormType = ReturnType<typeof definePermissionsForm>;
export type PermissionsFormData = FormDataType<typeof definePermissionsForm>;

const styles = {
  content: css`
    padding: 25px !important;
    background-color: #f8f8fb;
  `,
};

export function flattenTree(tree: GCPermission[]): GCPermission[] {
  return R.flatMap(tree, item => (item.children ? [item, ...flattenTree(item.children)] : item));
}

export interface PermissionsOverlayProps {
  teamId?: TeamId;
  userId?: UserId;
}

export const PermissionsOverlay = memo((props: PermissionsOverlayProps) => {
  const { teamId, userId } = props;

  const bloc = useBloc(PermissionsOverlayBloc);
  const users = useObservable(bloc.users$, []);
  const teams = useObservable(bloc.teams$, []);
  const channels = useObservable(bloc.channels$, []);
  const dealBoards = useObservable(bloc.dealBoards$, []);
  const dashboards = useObservable(bloc.dashboards$, []);
  const projectBoards = useObservable(bloc.projectBoards$, []);
  const tmBoards = useObservable(bloc.tmBoards$, []);
  const templates = useObservable(bloc.templates$, []);
  const loading = useLoadingState(bloc.loading$);
  const team = useMemo(() => R.find(teams, t => t.id === teamId), [teamId, teams]);
  const user = useMemo(() => R.find(users, u => u.id === userId), [userId, users]);
  const [dbPermissions, setDbPermissions] = useState<PermissionResponse[]>([]);
  const modal = useModalInstance();
  const accountSettings = useAccountSettings();
  const isOrders = useMemo(() => accountSettings.orders, [accountSettings.orders]);
  const isTM = useMemo(() => accountSettings.timeMaterials, [accountSettings.timeMaterials]);

  useEffect(() => {
    PermissionAPI.fetch(teamId, userId)
      .pipe(
        tap(permissions => {
          setDbPermissions(permissions);
        }),
      )
      .subscribe();
  }, [teamId, userId]);

  const title = useMemo(() => {
    if (team) return team.name;
    if (user) return CommonService.getFullName(user);
    return 'No one';
  }, [team, user]);

  const userTeams = useMemo(() => {
    return teams.filter(t => t.users.map(u => u.id).includes(userId || '0'));
  }, [teams, userId]);

  const setPermissionValue = useCallback((items: GCPermission[], dbPermissions: PermissionResponse[]) => {
    return R.map(items, i => {
      const dbItem = R.find(dbPermissions, p => p.key === i.key);
      i.value = typeof dbItem?.value !== 'undefined' ? dbItem.value : false;
      i.ids = dbItem?.ids;
      i.children = !!i.children?.length ? setPermissionValue(i.children, dbPermissions) : i.children;
      return i;
    });
  }, []);

  const allPermissions = useMemo(() => {
    const items = R.map(generatePermissions(dealBoards, projectBoards, tmBoards, channels, templates, isOrders, isTM, dashboards), i => {
      const dbItem = R.find(dbPermissions, p => p.key === i.key);
      i.value = typeof dbItem?.value !== 'undefined' ? dbItem.value : true;
      i.ids = dbItem?.ids;
      i.children = !!i.children?.length ? setPermissionValue(i.children, dbPermissions) : i.children;
      return i;
    });

    return items;
  }, [dealBoards, projectBoards, tmBoards, channels, templates, isOrders, isTM, dashboards, dbPermissions, setPermissionValue]);

  const flatPermissions = useMemo(() => {
    return flattenTree(allPermissions);
  }, [allPermissions]);

  const onSubmit = useCallback(
    (data: PermissionsFormData) => {
      const permissions = R.keys(data).map(key => ({ module: data[key].module, key, ids: data[key].ids, value: data[key].item }));
      return PermissionAPI.save(permissions, teamId, userId).pipe(
        tap(user => Session.patchUser(user)),
        tap(() => FlashMessage.success('Permission Update', 'Permission has been saved')),
        tap(() => modal.close()),
      );
    },
    [modal, teamId, userId],
  );

  const form = useMemo(() => definePermissionsForm(flatPermissions), [flatPermissions]);
  useFormConfig(form, { onSubmit });
  const { submitting } = useFormState(form, { submitting: true });

  return (
    <ModalDrawer maxWidth="md">
      <ModalHeader title={`Permissions for ${title}`} />
      <ModalContent customCss={styles.content} formContainer={{ onSubmit: form.submit }}>
        <div className="d-flex flex-column">
          {loading.loading && <LoadingIndicator />}
          {!loading.loading && (
            <Fragment>
              {!!userTeams.length && (
                <Badge color="info" className="p-2 mb-2" style={{ fontSize: 12 }}>
                  Inherit permissions from {userTeams.map(t => t.name).join(', ')}
                </Badge>
              )}
              {allPermissions.map((permission, index) => (
                <Card key={index}>
                  <CardBody>
                    <PermissionItem
                      key={index}
                      permission={permission}
                      items={permission?.items || []}
                      isSingle={permission?.isSingle || false}
                      teams={teams}
                      form={form}
                    />
                  </CardBody>
                </Card>
              ))}
            </Fragment>
          )}
        </div>
      </ModalContent>
      <ModalFooter>
        <ModalAction intent="primary" text={`Save`} loading={submitting} autoClose={false} onClick={form.submit} />
      </ModalFooter>
    </ModalDrawer>
  );
});

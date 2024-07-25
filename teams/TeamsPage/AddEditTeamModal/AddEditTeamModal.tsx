import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { t } from 'ttag';
import { css } from '@emotion/core';
import { useBloc } from '@core/utils/bloc';
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalAction } from '@core/components/Modal';
import { useModalInstance } from '@core/components/ModalStack';
import { FormSelect, FormInput } from '@core/components/form';
import { useFormConfig, useFormState, formGroup, formControl, FormDataType } from '@core/utils/form';
import { CommonService } from '@business/services';
import { useObservable } from '@core/utils/hooks/rxjs';
import { AddEditTeamModalBloc } from './AddEditTeamModalBloc';
import { tap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserId } from '@business/entities/account';
import { TeamResponse } from '@business/entities/team';

function defineTeamForm() {
  return formGroup({
    name: formControl<string>({
      label: 'Team Name',
      required: true,
    }),
    users: formControl<UserId[]>({
      label: 'Select Users',
      required: true,
    }),
  });
}

const styles = {
  content: css`
    padding: 25px !important;
  `,
};

export interface AddEditTeamModalProps {
  team?: TeamResponse;
}

export type TeamFormData = FormDataType<typeof defineTeamForm>;

export const AddEditTeamModal = memo((props: AddEditTeamModalProps) => {
  const { team } = props;
  const modal = useModalInstance();
  const bloc = useBloc(AddEditTeamModalBloc);
  const users = useObservable(bloc.users$, []);

  const userItems = useMemo(() => CommonService.selectItems(users, u => CommonService.getFullName(u), 'id', true), [users]);
  const form = useMemo(() => defineTeamForm(), []);

  useEffect(() => {
    if (team) {
      form.patchValue({ name: team.name, users: team.users.map(u => u.id) });
    }
  }, [form, team]);

  const onSubmit = useCallback(
    (data: TeamFormData) => {
      return of(null).pipe(
        switchMap(() => {
          if (!team) {
            return bloc.createTeam(data);
          } else {
            return bloc.updateTeam(team.id, data);
          }
        }),
        tap(modal.close),
      );
    },
    [bloc, modal.close, team],
  );

  useFormConfig(form, { onSubmit });
  const { submitting } = useFormState(form, { submitting: true });

  const content = (
    <>
      <ModalHeader title={team ? 'Edit Team' : 'Add Team'} />
      <ModalContent formContainer={{ onSubmit: form.submit }} customCss={styles.content}>
        <FormInput autoFocus control={form.controls.name} />
        <FormSelect control={form.controls.users} items={userItems} type="multiple" />
      </ModalContent>
      <ModalFooter>
        <ModalAction intent="primary" text={t`Save`} loading={submitting} autoClose={false} onClick={form.submit} />
      </ModalFooter>
    </>
  );

  return <Modal maxWidth="sm">{content}</Modal>;
});

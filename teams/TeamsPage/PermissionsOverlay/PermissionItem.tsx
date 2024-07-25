import { GCPermission } from '@business/constants/permissions';
import { TeamResponse } from '@business/entities/team';
import { CommonService } from '@business/services';
import { PermissionService } from '@business/services/permission_service';
import { FormCheckbox, FormSelect, FormSelectItem } from '@core/components/form';
import { isGCLabelActive } from '@core/utils/hooks/misc/gcLabel';
import { useNonNilObservable } from '@core/utils/hooks/rxjs';
import { R } from '@core/utils/r';
import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { Col, Row } from 'reactstrap';
import { flattenTree, PermissionFormData, PermissionsFormType } from './PermissionsOverlay';
export interface PermissionItemProps {
  permission: GCPermission;
  level?: number;
  teams: TeamResponse[];
  form: PermissionsFormType;
  items?: FormSelectItem<any>[];
  isSingle?: boolean;
}

export const PermissionItem = memo((props: PermissionItemProps) => {
  const { permission, level = 0, teams, form, items = [], isSingle = false } = props;
  const formValue = useNonNilObservable(form.value$);
  const children = useMemo(() => permission.children || [], [permission.children]);
  const subItems = useMemo(
    () =>
      items.length === 0
        ? CommonService.selectItems([{ id: '0', name: 'All', users: [] }, { id: '-1', name: 'Me', users: [] }, ...teams], 'name', 'id')
        : items,
    [teams, items],
  );

  const onChange = useCallback(
    (value: boolean, ids: string[] = []) => {
      const subPermissions = flattenTree(permission.children || []);
      const newValues: Record<string, PermissionFormData> = {};
      subPermissions.forEach(p => {
        newValues[p.key] = { item: value, ids: ids, module: p.module };
      });
      form.patchValue(newValues);
    },
    [form, permission.children],
  );

  useEffect(() => {
    if (permission.detailed) {
      form.controls[permission.key].controls.ids.setConfig({ required: formValue[permission.key].item });
    }
  }, [form.controls, formValue, permission]);

  const onChangeIds = useCallback(
    (ids: string[]) => {
      if (ids.length === 0 || R.includes(ids, '0')) {
        // R.remove(ids);
        // ids.push('0');
      }
      const subPermissions = flattenTree(permission.children || []);
      const newValues: Record<string, PermissionFormData> = {};
      subPermissions.push(permission);
      subPermissions.forEach(p => {
        if (!p.detailed) {
          newValues[p.key] = { item: formValue[p.key].item, ids: ids, module: p.module };
        }
      });
      form.patchValue(newValues);
    },
    [form, permission, formValue],
  );
  const gcLabel = PermissionService.getLabelByModule(permission.module);
  if (gcLabel && !isGCLabelActive(gcLabel)) {
    return null;
  }

  return (
    <div>
      <Row>
        <Col lg={6} style={{ paddingLeft: level * 35 + 10, display: 'flex', alignItems: 'center' }}>
          <FormCheckbox
            control={form.controls[permission.key].controls.item}
            noPadding={permission.detailed || ((permission.children || []).length == 0 && level === 0)}
            onChange={onChange}
          />
        </Col>
        {permission.detailed && (
          <Col lg={6}>
            <FormSelect
              type={isSingle ? 'single' : 'multiple'}
              items={subItems}
              isClearable
              control={form.controls[permission.key].controls.ids}
              onChange={onChangeIds}
            />
          </Col>
        )}
      </Row>
      {children.map((permission, index) => (
        <PermissionItem
          level={level + 1}
          items={permission.items}
          isSingle={isSingle}
          key={index}
          permission={permission}
          teams={teams}
          form={form}
        />
      ))}
    </div>
  );
});

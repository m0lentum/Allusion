import './dialog.scss';
import React, { useEffect, useRef } from 'react';
import { Button, ButtonGroup } from 'components';
import { observer } from 'mobx-react-lite';
import { usePopper } from 'react-popper';

interface IDialog extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  role?: string;
  label?: string;
  labelledby?: string;
  describedby?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: (event: Event) => void;
  /** If no event listener is provided for the cancel event, by default closing
   *  with the Escape key will be disabled. This is to ensure that no error is
   * thrown when HTMLDialogElement.showModal() is called.  */
  onCancel?: (event: Event) => void;
}

const preventClosingOnEscape = (e: Event) => e.preventDefault();

const Dialog = observer((props: IDialog) => {
  const {
    open,
    role,
    label,
    labelledby,
    describedby,
    className,
    onClose,
    onCancel = preventClosingOnEscape,
    children,
    ...p
  } = props;

  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (onClose) {
      element?.addEventListener('close', onClose);
    }
    element?.addEventListener('cancel', onCancel);

    return () => {
      if (onClose) {
        element?.removeEventListener('close', onClose);
      }
      element?.removeEventListener('close', onCancel);
    };
  }, [onClose, onCancel]);

  useEffect(() => {
    if (dialog.current) {
      open ? dialog.current.showModal() : dialog.current.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialog}
      role={role}
      aria-label={label}
      aria-labelledby={labelledby}
      aria-describedby={describedby}
      className={className}
    >
      <div {...p} className="dialog-content">
        {children}
      </div>
    </dialog>
  );
});

interface IAlert extends IDialogActions {
  open: boolean;
  title: React.ReactChild;
  icon?: JSX.Element;
  information: string;
  view?: React.ReactNode;
  className?: string;
  // onSuppression?: () => void;
}

const Alert = observer((props: IAlert) => {
  const { open, onClick, title, information, view, icon } = props;

  return (
    <Dialog
      open={open}
      role="alertdialog"
      labelledby="dialog-title"
      describedby="dialog-information"
      className={props.className}
    >
      <span className="dialog-icon">{icon}</span>
      <h2 id="dialog-title" className="dialog-title">
        {title}
      </h2>
      <div id="dialog-information" className="dialog-information">
        <p>{information}</p>
        {view}
      </div>
      <div className="dialog-footer">
        <DialogActions
          closeButtonText={props.closeButtonText}
          secondaryButtonText={props.secondaryButtonText}
          primaryButtonText={props.primaryButtonText}
          defaultButton={props.defaultButton}
          onClick={onClick}
        />
      </div>
    </Dialog>
  );
});

enum DialogButton {
  CloseButton,
  PrimaryButton,
  SecondaryButton,
}

interface IDialogActions {
  onClick: (button: DialogButton) => void;
  closeButtonText: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  defaultButton?: DialogButton;
}

const DialogActions = observer((props: IDialogActions) => {
  return (
    <ButtonGroup className="dialog-actions">
      {props.primaryButtonText ? (
        <Button
          styling={props.defaultButton === DialogButton.PrimaryButton ? 'filled' : 'outlined'}
          text={props.primaryButtonText}
          onClick={() => props.onClick(DialogButton.PrimaryButton)}
        />
      ) : undefined}
      {props.secondaryButtonText ? (
        <Button
          styling={props.defaultButton === DialogButton.SecondaryButton ? 'filled' : 'outlined'}
          text={props.secondaryButtonText}
          onClick={() => props.onClick(DialogButton.SecondaryButton)}
        />
      ) : undefined}
      <Button
        styling={props.defaultButton === DialogButton.CloseButton ? 'filled' : 'outlined'}
        text={props.closeButtonText}
        onClick={() => props.onClick(DialogButton.CloseButton)}
      />
    </ButtonGroup>
  );
});

const popperOptions = {
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        // Prevents dialogs from moving elements to the side
        boundary: document.body,
      },
    },
  ],
};

interface IFlyout {
  open: boolean;
  label?: string;
  labelledby?: string;
  describedby?: string;
  target: React.ReactElement<HTMLElement>;
  /** The popover content. */
  children: React.ReactNode;
  className?: string;
  onClose?: (event: Event) => void;
  /** If no event listener is provided for the cancel event, by default closing
   *  with the Escape key will be disabled. This is to ensure that the passed
   * state valid.  */
  onCancel?: (event: Event) => void;
}

const Flyout = observer((props: IFlyout) => {
  const {
    open,
    label,
    labelledby,
    describedby,
    className,
    onClose,
    onCancel = preventClosingOnEscape,
    target,
    children,
  } = props;

  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<Element>();

  // On mount find target element
  useEffect(() => {
    if (dialog.current && dialog.current.previousElementSibling) {
      trigger.current = dialog.current.previousElementSibling;
    }
  }, []);

  // Focus first focusable element
  useEffect(() => {
    if (dialog.current && open) {
      const first =
        dialog.current.querySelector('[tabindex="0"]') ??
        dialog.current.querySelector('[tabindex="-1"]');
      if (first) {
        (first as HTMLElement).tabIndex = 0;
        (first as HTMLElement).focus();
      }
    }
  }, [open]);

  // Add event listeners because React does not have proper typings :)
  useEffect(() => {
    const element = dialog.current;
    if (onClose) {
      element?.addEventListener('close', onClose);
    }
    if (onCancel) {
      element?.addEventListener('cancel', onCancel);
    }

    return () => {
      if (onClose) {
        element?.removeEventListener('close', onClose);
      }
      if (onCancel) {
        element?.removeEventListener('close', onCancel);
      }
    };
  }, [onClose, onCancel]);

  const { styles, attributes } = usePopper(trigger.current, dialog.current, popperOptions);

  return (
    <>
      {target}
      <dialog
        style={styles.popper}
        {...attributes.popper}
        open={open}
        data-flyout
        ref={dialog}
        aria-label={label}
        aria-labelledby={labelledby}
        aria-describedby={describedby}
        className={className}
      >
        {children}
      </dialog>
    </>
  );
});

export { Alert, Dialog, DialogButton, DialogActions, Flyout };

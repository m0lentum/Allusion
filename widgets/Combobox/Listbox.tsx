import React from 'react';

interface IListbox {
  id?: string;
  /** When multiselectable is set to true, the click event handlers on the option elements must togggle the select state. */
  multiselectable?: boolean;
  children: ListboxChildren;
}

type ListboxChildren = ListboxChild | ListboxChild[] | React.ReactFragment;
type ListboxChild = React.ReactElement<IOption>;

export const Listbox = (props: IListbox) => {
  const { id, multiselectable, children } = props;

  return (
    <ul
      id={id}
      tabIndex={-1}
      role="listbox"
      aria-multiselectable={multiselectable}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
    >
      {children}
    </ul>
  );
};

interface IOption {
  value: string;
  selected?: boolean;
  /** The icon on the right side of the label because on the left is the checkmark already. */
  icon?: JSX.Element;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

export const Option = ({ value, selected, onClick, icon, disabled }: IOption) => (
  <li
    role="option"
    aria-selected={selected}
    aria-disabled={disabled}
    onClick={disabled ? undefined : onClick}
    tabIndex={-1}
  >
    <span className="item-icon" aria-hidden />
    {value}
    <span className="item-accelerator" aria-hidden>
      {icon}
    </span>
  </li>
);

function handleFocus(event: React.FocusEvent) {
  const target = (event.target as HTMLElement).closest('[role="option"]') as HTMLElement | null;
  if (target === null) {
    return;
  }

  event.stopPropagation();
  const previous: HTMLElement | null = event.currentTarget.querySelector(
    '[role="option"][tabindex="0"]',
  );
  if (previous !== null) {
    previous.tabIndex = -1;
  }
  target.focus();
}

function handleKeyDown(event: React.KeyboardEvent) {
  const target = event.target as HTMLElement;
  switch (event.key) {
    case 'Enter':
      event.stopPropagation();
      target.click();
      break;

    case 'ArrowUp':
      if (target.previousElementSibling !== null) {
        event.stopPropagation();
        (target.previousElementSibling as HTMLElement).focus();
      }
      break;

    case 'ArrowDown':
      if (target.nextElementSibling !== null) {
        event.stopPropagation();
        (target.nextElementSibling as HTMLElement).focus();
      }
      break;

    case ' ':
      // Prevents scroll behaviour
      event.preventDefault();
      // If the listbox allows multi selection, the click event will toggle the selection.
      if (event.currentTarget.getAttribute('aria-multiselectable') === 'true') {
        event.stopPropagation();
        target.click();
      }
      break;

    default:
      break;
  }
}

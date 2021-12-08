import React, {useState} from 'react'
import {useCombobox} from 'downshift'
import {menuStyles, comboboxStyles} from './shared';

export default function({data, itemToString, filterData, label, onSelectedItemChange}) {
  const [inputItems, setInputItems] = useState(data)

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: inputItems,
    onSelectedItemChange,
    itemToString,
    onInputValueChange: ({inputValue}) => setInputItems(filterData(inputValue)),
  });
  console.log(label);

  return (
    <div>
      <label {...getLabelProps()}>{label}</label>
      <div style={comboboxStyles} {...getComboboxProps()}>
        <input {...getInputProps()} />
        <button
          type="button"
          {...getToggleButtonProps()}
          aria-label="toggle menu"
        >
          &#8595;
        </button>
      </div>
      <ul {...getMenuProps()} style={menuStyles}>
        {isOpen &&
        inputItems.map((item, index) => (
          <li
            style={
              highlightedIndex === index ? {backgroundColor: '#bde4ff'} : {}
            }
            key={`${itemToString(item)}${index}`}
            {...getItemProps({item, index})}
          >
            {itemToString(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}


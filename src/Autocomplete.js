import React, {useState} from 'react'
import {useCombobox} from 'downshift'
import {menuStyles, comboboxStyles} from './shared';

export default function({data, itemToString, filterData, label, handleSelectedHelmChange, groupBy = "group"}) {
  const [inputItems, setInputItems] = useState(data);

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
    itemToString,
    onSelectedItemChange: ({selectedItem}) => handleSelectedHelmChange(selectedItem),
    onInputValueChange: ({inputValue}) => setInputItems(filterData(inputValue)),
  });

  let groupedItems = inputItems
    .map((item, index) => ({
      ...item,
      index:index,
    }))
    .reduce((acc, item, index) => {
      // debugger;
      if (groupBy && item[groupBy] && (!acc.length || (acc[acc.length-1][groupBy] && acc[acc.length-1][groupBy] !== item[groupBy]))) {
        acc.push({
          titleGroup: item[groupBy]
        })
      }
      acc.push(item);
      return acc;
  }, []);

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
        {isOpen
          && groupedItems.map((item, index) =>
          item.titleGroup
            ? (<li
              key={`group-${index}`}
              style={{
                backgroundColor: '#bde4ff'
              }}
            >{item.titleGroup}</li>)
            : (
              <li
                style={
                  highlightedIndex === item.index ? {backgroundColor: '#bde4ff'} : {}
                }
                key={`${itemToString(item)}${item.index}`}
                {...getItemProps({item, index: item.index})}
              >
                {itemToString(item)}
              </li>
            )
        )}
      </ul>
    </div>
  )
}


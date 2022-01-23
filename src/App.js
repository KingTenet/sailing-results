import React from "react";
import {useState} from "react";
import './App.css';
import Autocomplete from "./AutocompleteSimple";
import FinishTimeSelector from "./FinishTimeSelector2";
import { PhoneIcon, AddIcon, WarningIcon, CheckIcon, CheckCircleIcon } from '@chakra-ui/icons'
import {search} from "./search";

import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  FormControl,
  FormLabel,
  Box,
  Center,
  Text,
  Heading,
  FormErrorMessage,
  Input,
  Button,
  Flex,
  Spacer,
  Collapse
} from '@chakra-ui/react'

const raceResult = {
  partialRaceResult: {
    helm: "",
    boat: "",
    finishTime: "",
    dnfCode: "",
  },
  raceResults: [
    {
      helm: "",
      boat: "",
      finishTime: "",
      dnfCode: "",
    },
    {
      helm: "",
      boat: "",
      finishTime: "",
      dnfCode: "",
    }
  ]
}

function HelmSummary({helm}) {
  console.log(helm)
  return (
    <>
      {helm && 
        <Flex direction="row">
          <PhoneIcon/>
          <Text>{helm.name}</Text>
          <AddIcon/>
          <Text>{helm.daysSinceRaced}</Text>
        </Flex>
      }
    </>
  )
}

function focusNextElement () {
  //add all elements we want to include in our selection
  var focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
  if (document.activeElement && document.activeElement.form) {
      var focussable = Array.prototype.filter.call(document.activeElement.form.querySelectorAll(focussableElements),
      function (element) {
          //check for visibility while always include the current activeElement 
          return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
      });
      var index = focussable.indexOf(document.activeElement);
      if(index > -1) {
         var nextElement = focussable[index + 1] || focussable[0];
         nextElement.focus();
      }                    
  }
}

function AddHelmResult() {
  const [selectedHelm, setSelectedHelm] = useState(null);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [finishTimeSeconds, setFinishTimeSeconds] = useState()

  const createNewHelm = (event) => {

    event.preventDefault();
  };

  const processHelmResult = (event) => {
    console.log(selectedHelm);
    console.log(selectedBoat);
    console.log(finishTimeSeconds);
    event.preventDefault();
  };

  const setSelectedHelmHandler = (value) => {
    console.log(value);
    setSelectedHelm(value);
  }

  const back = () => "Navigating to race screen";

  document.addEventListener('keydown', function (event) {
    if (event.keyCode === 9 && event.target.nodeName === 'INPUT') {
      // var form = event.target.form;
      // var index = Array.prototype.indexOf.call(form, event.target);
      // form.elements[index + 1].focus();
      event.preventDefault();
    }
  });

  return (
    <>
      <form onSubmit = {(evt) => evt.preventDefault()}>
      <Center height="80vh" width="100%">
        <Flex direction={"column"} height="100%" width="100vh">
          <Autocomplete
            heading = {"Helm"}
            data = {search.helmsIndex.data}
            itemToString = {(helm) => (helm ? helm.name : "")}
            filterData = {(inputValue) => search.helmsIndex.search(inputValue)}
            handleSelectedItemChange = {setSelectedHelmHandler}
            getInvalidItemString = {(partialMatch) => `${partialMatch} has not raced before, create a new helm record`}
            createNewMessage = {"Create a new helm record"}
            placeholder = {"Enter helm name here..."}
          />
          {selectedHelm &&
            <Autocomplete
              heading = {"Boat"}
              data = {search.boatsIndex.data}
              itemToString = {(boat) => (boat ? boat.class : "")}
              filterData = {(inputValue) => search.boatsIndex.search(inputValue)}
              handleSelectedItemChange = {setSelectedBoat}
              getInvalidItemString = {(partialMatch) => `${partialMatch} has not raced before, create a new boat record`}
              createNewMessage = {"Create a new boat record"}
              placeholder = {"Enter boat sail number here..."}
            />
          }
          {selectedBoat &&
            <Collapse in={true} animateOpacity>
              <FinishTimeSelector
                setFinishTimeSeconds = {setFinishTimeSeconds}
              />
            </Collapse>
          }
          {finishTimeSeconds && 
            <>
              <Button tabIndex="-1" backgroundColor="green.500" onClick={processHelmResult} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add to race results</Text></Button>
            </>
          }
          <Button tabIndex="-1" backgroundColor="red.500" onClick={() => back()} marginLeft="50px" marginRight="50px" marginTop="50px"><Text fontSize={"lg"}>Cancel</Text></Button>
        </Flex>
      </Center>
      </form>
    </>
  );
}

export default AddHelmResult;







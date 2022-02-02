import React from "react";

import {
  Text,
  Button,
  Flex,
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


function RaceResults({helmResults}) {
  const addFinisher = () => console.log("Adding finisher");

  return (
    <Flex direction={"column"} height="100%" width="100vh">
        <Button tabIndex="-1" backgroundColor="green.500" onClick={addFinisher} marginLeft="50px" marginRight="50px" marginTop="50px" autoFocus><Text fontSize={"lg"}>Add another finisher</Text></Button>
    </Flex>
  );
}

export default RaceResults;







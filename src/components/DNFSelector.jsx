import {
    Stack,
    Box,
    Text,
} from '@chakra-ui/react'
import { GreenButton, RedButton } from './Buttons';


function DNFSelector({ isDNF, setIsDNF }) {
    return (
        <Box borderRadius={"12px"} borderWidth="1px" style={{ padding: "8px 15px 8px 15px" }} className={"input-container input-container-4"}>
            <Stack direction='row' marginTop={"0px"}>
                <Box minWidth={"110px"} paddingTop="5px">
                    <Text fontSize={"lg"}>{"Status"}</Text>
                </Box>
                {isDNF &&
                    <RedButton style={{ marginLeft: "0px" }} onClick={() => setIsDNF(false)}>{"Did not finish"}</RedButton>
                }
                {!isDNF &&
                    <GreenButton style={{ marginLeft: "0px" }} onClick={() => setIsDNF(true)}>{"Finished the race"}</GreenButton>
                }
            </Stack>
        </Box>
    );
}

export default DNFSelector;
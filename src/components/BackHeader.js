import { Icon } from '@chakra-ui/icons';
import {
    Text,
    Flex,
    Spacer,
} from '@chakra-ui/react'
import { useBack } from '../common';

const BackIcon = (props) => (
    <Icon viewBox='0 0 219.151 219.151' {...props}>
        <path
            fill='currentColor'
            d="M109.576 219.151c60.419 0 109.573-49.156 109.573-109.576C219.149 49.156 169.995 0 109.576 0S.002 49.156.002 109.575c0 60.42 49.155 109.576 109.574 109.576zm0-204.151c52.148 0 94.573 42.426 94.574 94.575 0 52.149-42.425 94.575-94.574 94.576-52.148-.001-94.573-42.427-94.573-94.577C15.003 57.427 57.428 15 109.576 15z" /><path d="M94.861 156.507a7.502 7.502 0 0 0 10.606 0 7.499 7.499 0 0 0-.001-10.608l-28.82-28.819 83.457-.008a7.5 7.5 0 0 0-.001-15l-83.46.008 28.827-28.825a7.5 7.5 0 0 0-10.607-10.608l-41.629 41.628a7.495 7.495 0 0 0-2.197 5.303 7.51 7.51 0 0 0 2.198 5.305l41.627 41.624z"
        />
    </Icon>
)

function BackHeader({ heading, paddingTop = "5px", paddingLeft = "5px", paddingRight = "5px", onClick, ...props }) {
    const navigateBack = useBack();

    return (
        <Flex direction="row" justifyContent={"space-between"} width="100%" className="back-header" marginBottom="0" paddingLeft={paddingLeft} paddingRight={paddingRight} {...props}>
            {heading &&
                <Text fontSize={"2xl"}>{heading}</Text>
            }
            <Spacer />
            <Flex direction="row" className="back-button-container" justifyContent={"flex-end"} marginTop="4px" onClick={() => onClick ? onClick() : navigateBack()} >
                <Text fontSize={"l"} marginRight="5px">{"Go Back"}</Text>
                <BackIcon boxSize="5" marginTop="3px" />
            </Flex>
        </Flex>
    );
}

export default BackHeader;

import { Text, UnorderedList, ListItem } from "@chakra-ui/react";

function ThreeHelms({ raceRegistered, finished, dnf, ...props }) {
  const numberOfHelms = [...raceRegistered, ...finished, ...dnf].length;
  const numberFinished = [...finished, ...dnf].length;

  return (
    <div className="m-auto w-full">
      <div
        className={
          "m-auto w-[95%] border-black border border-dashed rounded-lg p-2"
        }
      >
        <Text mb={2}>To manage helms:</Text>
        <UnorderedList>
          <ListItem>Tap a helm to update their finish time</ListItem>
          <ListItem>Swipe right to remove a helm</ListItem>
          <ListItem>Swipe left to mark as DNF (Did Not Finish)</ListItem>
        </UnorderedList>
        <Text mb={2} mt={4}>
          To view calculated race results:
        </Text>
        <UnorderedList>
          <ListItem>
            <Text mb={2}>
              {`
            Register at least 3 helms
            ${numberOfHelms > 2 ? "✅" : "❌"}
            ${
              numberOfHelms && numberOfHelms < 3
                ? `(register ${3 - numberOfHelms} more helm${
                    3 - numberOfHelms > 1 ? "s" : ""
                  })`
                : ""
            }
            `}
            </Text>
          </ListItem>
          {numberOfHelms >= 3 && (
            <ListItem>
              <Text mb={2}>
                {`
            Add finish times or DNFs to all registered helms
            ${!raceRegistered.length ? "✅" : "❌"}
            ${
              raceRegistered.length
                ? `(update ${raceRegistered.length} more helm${
                    raceRegistered.length > 1 ? "s" : ""
                  })`
                : ""
            }
            `}
              </Text>
            </ListItem>
          )}
          {numberOfHelms >= 3 && !Boolean(finished.length) && (
            <ListItem>
              <Text mb={2}>
                {`
            Add at least 1 finish time to a registered helm
            ${finished.length ? "✅" : "❌"}
            `}
              </Text>
            </ListItem>
          )}
        </UnorderedList>
        {props.children}
      </div>
    </div>
  );
}

function NextSteps() {
  return (
    <div className="m-auto w-full">
      <div
        className={
          "m-auto w-[95%] border-black border border-dashed rounded-lg p-2"
        }
      >
        <Text mb={2}>Next steps:</Text>
        <UnorderedList>
          <ListItem>Register a helm</ListItem>
          <ListItem>Register a race officer</ListItem>
        </UnorderedList>
      </div>
    </div>
  );
}

export function RaceNotes(props) {
  const { raceRegistered, finished, dnf } = props;
  const numberOfHelms = [...raceRegistered, ...finished, ...dnf].length;

  if (!numberOfHelms) {
    return <NextSteps />;
  }

  return (
    <div className="space-y-3 w-full mb-8">
      <ThreeHelms {...props} />
    </div>
  );
}

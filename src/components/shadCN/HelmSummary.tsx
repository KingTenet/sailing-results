import { Box, Flex, Text } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShadCNWrapper } from "@/components/ui/ShadCN";

export default function HelmSummary() {
  return (
    <Box p={4}>
      {/* Use Chakra for layout */}
      <Flex direction="column" gap={4}>
        {/* Use shadcn for card components */}
        <ShadCNWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Your Handicap History</CardTitle>
            </CardHeader>
            <CardContent>{/* Chart content */}</CardContent>
          </Card>
        </ShadCNWrapper>

        {/* Use Chakra for simpler components */}
        <Box bg="white" p={4} borderRadius="md" shadow="sm">
          <Text>Simple content</Text>
        </Box>
      </Flex>
    </Box>
  );
}

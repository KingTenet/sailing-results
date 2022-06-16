import { ListItem, Text, Grid, GridItem } from "@chakra-ui/react";
import { Box, Flex } from "@chakra-ui/react";
import React from "react";

const ARCHIVE_BASE_URL = "https://nhebsc.org.uk/results/";
const ARCHIVE_SERIES = [
    "Race Results for the Year 2019 Sorted Position.pdf",
    "Race Results for the Year 2018 Sorted Position.pdf",
    "Race Results for the Year 2017 Sorted Position.pdf",
    "Race Results for the Year 2016 Sorted Position.pdf",
    "Personal Handicap System for N H E B S C Issue 3.htm",
    "Personal Handicap System for N H E B S C Issue 2.htm",
    "Personal Handicap Database.htm",
    "New Results.htm",
    "N H E B S C Class Handicap Data 2020.htm",
    "2021 Wednesday Evening.htm",
    "2021 Spring.htm",
    "2021 Pursuit.htm",
    "2021 Late Summer.htm",
    "2021 Early Summer.htm",
    "2021 Autumn.htm",
    "2020 Icicle.htm",
    "2019 Wednesday Evening.htm",
    "2019 Spring.htm",
    "2019 Pursuit.htm",
    "2019 Late Summer.htm",
    "2019 Icicle.htm",
    "2019 Frostbite.htm",
    "2019 Early Summer.htm",
    "2019 Autumn.htm",
    "2019 Accolades.htm",
    "2018 Wednesday Evening.htm",
    "2018 Spring.htm",
    "2018 Pursuit.htm",
    "2018 Multi Winter.htm",
    "2018 Multi Summer.htm",
    "2018 Late Summer.htm",
    "2018 Icicle.htm",
    "2018 Frostbite.htm",
    "2018 Early Summer.htm",
    "2018 Autumn.htm",
    "2017 Wednesday Evening.htm",
    "2017 Spring.htm",
    "2017 Pursuit.htm",
    "2017 Late Summer.htm",
    "2017 Icicle.htm",
    "2017 Frostbite.htm",
    "2017 Early Summer.htm",
    "2017 Autumn.htm",
    "2016 Wednesday Evening.htm",
    "2016 Spring.htm",
    "2016 Pursuit.htm",
    "2016 Late Summer.htm",
    "2016 Icicle.htm",
    "2016 Frostbite.htm",
    "2016 Early Summer.htm",
    "2016 Autumn.htm",
    "2015 Wednesday Evening.htm",
    "2015 Spring.htm",
    "2015 Pursuit.htm",
    "2015 Late Summer.htm",
    "2015 Icicle.htm",
    "2015 Frostbite.htm",
    "2015 Early Summer.htm",
    "2015 Autumn.htm",
    "2014 Wednesday Evening.htm",
    "2014 Spring.htm",
    "2014 Pursuit.htm",
    "2014 Late Summer.htm",
    "2014 Icicle.htm",
    "2014 Frostbite.htm",
    "2014 Early Summer.htm",
    "2014 Autumn.htm",
    "2013 Wednesday Evening.htm",
    "2013 Spring.htm",
    "2013 Pursuit.htm",
    "2013 Late Summer.htm",
    "2013 Icicle.htm",
    "2013 Frostbite.htm",
    "2013 Early Summer.htm",
    "2013 Autumn.htm",
    "2012-1-1.htm",
    "2012-09-16_ Laser_ Open.htm",
    "2012-01-08.htm",
    "2012 Wednesday Evening.htm",
    "2012 Spring.htm",
    "2012 Pursuit.htm",
    "2012 Late Summer.htm",
    "2012 Icicle.htm",
    "2012 Frostbite.htm",
    "2012 Early Summer.htm",
    "2012 Autumn.htm",
    "2011-12-26- Boxing Day.htm",
    "2011-09-18_ Laser_ Open.htm"
];

function SeriesDimension({ children, ...props }) {
    return (
        <GridItem
            height='20px'
            {...props}>
            <Text isTruncated>{children}</Text>
        </GridItem>
    );
}

function ArchiveLink({ baseUrl, seriesTitle }) {
    const url = `${baseUrl}${encodeURI(seriesTitle)}`;
    const title = seriesTitle.split(".")[0];

    return (
        <ListItem>
            <a href={url} >
                <Box padding={"10px"} borderRadius={"12px"} borderWidth={"1px"} borderColor={"grey"} bg={"white"} >
                    <Flex>
                        <Grid
                            templateColumns={`repeat(2, 1fr)`}
                            gap={5}
                            width={"100%"}>
                            <SeriesDimension colSpan={1}>{title}</SeriesDimension>
                            <SeriesDimension colSpan={1}></SeriesDimension>
                        </Grid>
                    </Flex>
                </Box>
            </a>
        </ListItem>
    );
}

export default function SeriesArchive() {
    return (
        <>
            {ARCHIVE_SERIES.map((seriesTitle, index) =>
                <ArchiveLink baseUrl={ARCHIVE_BASE_URL} seriesTitle={seriesTitle} key={index} />
            )}
        </>
    );
}
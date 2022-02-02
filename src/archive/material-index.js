import "typeface-roboto";
import { render } from "react-dom";
import React, { Component, PropTypes } from "react";
import MaterialCombobox from "./material-combobox";
import List, { ListItem, ListItemText } from "material-ui/List";
import Avatar from "material-ui/Avatar";
import Card, { CardActions, CardContent, CardMedia } from "material-ui/Card";
import Button from "material-ui/Button";
import Typography from "material-ui/Typography";

const styles = {
  fontFamily: "Roboto",
  textAlign: "center",
  maxWidth: 780,
  marginLeft: "auto",
  marginRight: "auto"
};

import data from "./data.js";

const displayTemplate = (item, props) => {
  const tronca = 35;
  const shortDescription = item.description.slice(0, tronca);
  const trail = item.description.length > tronca ? "..." : "";
  let stateColor = "rgba(0,0,0,0)";

  if (props["data-highlighted"]) {
    stateColor = "rgba(0,0,0,0.12)";
  }

  if (props["data-selected"]) {
    stateColor = "rgba(0,0,0,0.46)";
  }

  return (
    <ListItem
      button
      {...props}
      style={{
        backgroundColor: stateColor,
        textAlign: "left"
      }}
      key={`autocomplete-item-${item.id}`}
      dense
    >
      <Avatar src={item.image.url} />
      <ListItemText
        primary={`${item.name}`}
        secondary={`${shortDescription}${trail}`}
      />
    </ListItem>
  );
};

class App extends Component {
  state = {
    synth: null,
    listening: false
  };

  makeSynthCard = synth => {
    const mediaHeight = 250;

    if (!synth) {
      return null;
    }

    let cardMedia = (
      <CardMedia>
        <img
          src={synth.image.url}
          style={{ width: "100%", height: mediaHeight }}
        />
      </CardMedia>
    );
    if (this.state.listening) {
      cardMedia = (
        <CardMedia>
          <iframe
            src={synth.demo}
            style={{ width: "100%", height: mediaHeight }}
            frameborder="0"
          />
        </CardMedia>
      );
    }

    return (
      <div>
        <Card
          style={{
            width: 300,
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          {cardMedia}
          <CardContent>
            <Typography type="headline" component="h2">
              {synth.name}
            </Typography>
            <Typography component="p">
              {synth.description}
            </Typography>
          </CardContent>
          <CardActions>
            <Button dense color="primary">
              Share
            </Button>
            <Button
              dense
              color="primary"
              onClick={() => {
                if (synth.demo && !this.state.listening) {
                  this.setState({
                    listening: true
                  });
                } else {
                  this.setState({
                    listening: false
                  });
                }
              }}
            >
              {this.state.listening ? "Stop Listening" : "Hear It!"}
            </Button>
          </CardActions>
        </Card>
      </div>
    );
  };

  render() {
    const { synth } = this.state;

    return (
      <div style={styles}>
        <Typography type="headline" gutterBottom>
          {"🎹"} Synth Selector {"🎹"}
        </Typography>
        <Typography type="caption" gutterBottom align="right">
          Downshift | @1.0.0-beta.22
        </Typography>
        <Typography type="caption" gutterBottom align="right">
          Material | UI 1.0.0-beta.4
        </Typography>

        <div>
          <MaterialCombobox
            
            //This is the list of data that is databound to the combobox
            items={data}
            
            //This is a template that can be overridden for each list item
            displayTemplate={displayTemplate}
            
            //This is the label that appears atop the input
            label={"Search by Synthesizer"}
            
            //This is placeholder text when the input has focus
            placeholder={"begin typing .."}
            
            // This affects the search behavior
            // Maybe what you search is different from just
            // one single prop.
            // so this is how one might search across many properties
            searchTemplate={item => `${item.name} ${item.description}`}
            
            // Currently a noop, but you can fire an event
            // as a side effect each time the input changes
            onChangeInput={event => {}}
            
            // This controls what you see in the actual input
            // when an item is selected
            inputDisplayTemplate={selectedItem => `${selectedItem.name}`}
            
            //This event fires every time there are state changes inside the Combobox
            onStateChange={({
              highlightedIndex,
              inputValue,
              isOpen,
              selectedItem
            }) => {
              //Uncomment this, if you'd like to track the state changes in the console.
              /*
              console.log('highlightedIndex',highlightedIndex);
              console.log('inputValue',inputValue);
              console.log('isOpen',isOpen);
              console.log('selectedItem',selectedItem)
              */
            }}
            
            // This (very important) event fires everytime a new item in the combobox
            // Is selected
            onChange={({ selectedItem, previousItem }) => {
              this.setState({
                synth: selectedItem,
                listening: false
              });
            }}
          />
        </div>
        <div>
          {this.makeSynthCard(synth)}
        </div>
      </div>
    );
  }
}
render(<App />, document.getElementById("root"));

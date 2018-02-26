import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
// import ProtocopRankingSelector from './ProtocopRankingSelector';
import AnswersetList from './AnswersetList';

class AnswersetExplorer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tabKey: 1,
    };

    this.handleTabSelect = this.handleTabSelect.bind(this);
  }

  handleTabSelect(tabKey) {
    this.setState({ tabKey });
  }

  render() {
    return (
      <Tabs activeKey={this.state.tabKey} onSelect={this.handleTabSelect} id="AnswersetExplorerTabs">
        <Tab eventKey={1} title="List Explorer">
          <AnswersetList
            answers={this.props.answers}
          />
        </Tab>
        <Tab eventKey={2} title="Interactive">
          {/* <ProtocopRankingSelector
            ranking={this.props.ranking}
          /> */}
        </Tab>
      </Tabs>
    );
  }
}

export default AnswersetExplorer;

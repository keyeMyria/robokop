import React from 'react';

import { Row, Col, Alert, FormGroup, FormControl, Popover, OverlayTrigger, ProgressBar, DropdownButton, MenuItem } from 'react-bootstrap';

import GoPencil from 'react-icons/lib/go/pencil';
import FaDownload from 'react-icons/lib/fa/download';

import QuestionToolbar from './QuestionToolbar';

const _ = require('lodash');
const shortid = require('shortid');

class QuestionHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editedName: false,
      editedNatural: false,
      editedNotes: false,
      name: '',
      notes: '',
      natural: '',
    };

    this.onEditName = this.onEditName.bind(this);
    this.onEditNatural = this.onEditNatural.bind(this);
    this.onEditNotes = this.onEditNotes.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    this.syncPropsAndState(this.props);
  }
  shouldComponentUpdate(newProps, newState) {
    const propsAllMatch = (newProps.editedName === this.props.editedName) &&
      (newProps.editedNatural === this.props.editedNatural) &&
      (newProps.editedNotes === this.props.editedNotes) &&
      (('name' in newProps.question) && ('name' in this.props.question) && (newProps.question.name === this.props.question.name)) &&
      (('natural_question' in newProps.question) && ('natural_question' in this.props.question) && (newProps.question.natural_question === this.props.question.natural_question)) &&
      (('notes' in newProps.question) && ('notes' in this.props.question) && (newProps.question.notes === this.props.question.notes)) &&
      (newProps.showToolbar === this.props.showToolbar) &&
      (newProps.refreshBusy === this.props.refreshBusy) &&
      (newProps.answerBusy === this.props.answerBusy) &&
      (newProps.enableNewAnswersets === this.props.enableNewAnswersets) &&
      (newProps.enableQuestionRefresh === this.props.enableQuestionRefresh) &&
      (newProps.enableQuestionEdit === this.props.enableQuestionEdit) &&
      (newProps.enableQuestionDelete === this.props.enableQuestionDelete) &&
      (newProps.enableQuestionFork === this.props.enableQuestionFork) &&
      (newProps.enableQuestionSelect === this.props.enableQuestionSelect) &&
      (newProps.showOtherQuestions === this.props.showOtherQuestions) &&
      _.isEqual(newProps.otherQuestions, this.props.otherQuestions) &&
      (newProps.showOtherAnswersets === this.props.showOtherAnswersets) &&
      _.isEqual(newProps.otherAnswersets, this.props.otherAnswersets) &&
      (newProps.showDownload === this.props.showDownload);

    const stateAllMatch = (newState.editedName === this.state.editedName) &&
      (newState.editedNatural === this.state.editedNatural) &&
      (newState.editedNotes === this.state.editedNotes) &&
      (newState.name === this.state.name) &&
      (newState.notes === this.state.notes) &&
      (newState.natural === this.state.natural);

    return !(propsAllMatch && stateAllMatch);
  }

  onEditName(e) {
    this.setState({ editedName: true, name: e.target.value });
  }

  onEditNatural(e) {
    this.setState({ editedNatural: true, natural: e.target.value });
  }
  onEditNotes(e) {
    this.setState({ editedNotes: true, notes: e.target.value });
  }
  onSave() {
    const newMeta = {
      question_id: this.props.question.id,
      natural_question: this.state.natural,
      name: this.state.name,
      notes: this.state.notes,
    };

    this.props.callbackUpdate(
      newMeta,
      () => this.setState({ editedName: false, editedNatural: false, editedNotes: false }),
    );
  }

  syncPropsAndState(newProps) {
    this.setState({
      editedName: false,
      editedNatural: false,
      editedNotes: false,
      name: newProps.question.name,
      natural: newProps.question.natural_question,
      notes: newProps.question.notes,
    });
  }

  render() {
    const {
      name,
      notes,
      natural,
    } = this.state;

    const popoverEditName = (
      <Popover id="popover-edit-name" title="Edit Question Name" style={{ minWidth: '500px' }}>
        <FormGroup role="form">
          <p>
          This will change the public name of this question and will impact how this question shows up in search results.
          </p>
          <FormControl
            type="text"
            value={name}
            placeholder="Question Name"
            onChange={this.onEditName}
          />
        </FormGroup>
      </Popover>
    );

    const editNameNode = (
      <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={popoverEditName} container={this}>
        <GoPencil />
      </OverlayTrigger>
    );

    const popoverEditNatural = (
      <Popover id="popover-edit-natural" title="Edit Question" style={{ minWidth: '500px' }}>
        <FormGroup role="form">
          <p>
          At this point our interpretation of your question is fixed. This will not cause a re-evaluation of your question. This is only used to correct typos etc.
          </p>
          <FormControl
            type="text"
            value={natural}
            placeholder="Question?"
            onChange={this.onEditNatural}
          />
        </FormGroup>
      </Popover>
    );

    const editNaturalNode = (
      <OverlayTrigger trigger="click" placement="bottom" rootClose overlay={popoverEditNatural} container={this}>
        <GoPencil />
      </OverlayTrigger>
    );

    const edited = this.state.editedName || this.state.editedNatural || this.state.editedNotes;
    const active = this.props.refreshBusy || this.props.answerBusy;

    const notesStyle = {
      minHeight: '50px',
      resize: 'vertical',
    };
    if (!this.props.enableQuestionEdit) {
      notesStyle.color = '#000';
      notesStyle.background = '#fff';
    }

    let activityMessage = '';
    if (this.props.refreshBusy) {
      activityMessage = 'Knowledge Graph Update in Progress';
    }
    if (this.props.answerBusy) {
      activityMessage = 'Getting Answers';
    }

    const otherAnswersetMenuItemList = this.props.otherAnswersets.map((a, i) => {
      const d = new Date(a.timestamp);
      return (
        <MenuItem
          eventKey={`${i + 2}`}
          key={shortid.generate()}
          onClick={() => this.props.callbackAnswersetSelect(a)}
        >
          {d.toLocaleString()} - {a.creator}
        </MenuItem>
      );
    });
    let answersetDate = new Date();
    if (('answerset' in this.props) && ('timestamp' in this.props.answerset)) {
      answersetDate = new Date(this.props.answerset.timestamp);
    }
    let creator = 'Reasoner';
    if (('answerset' in this.props) && ('creator' in this.props.answerset)) {
      creator = this.props.answerset.creator;
    }
    const answersetMenuItemList = [
      <MenuItem
        eventKey="1"
        key={shortid.generate()}
        active
      >
        {`${answersetDate.toLocaleString()} - ${creator}`}
      </MenuItem>,
    ].concat(otherAnswersetMenuItemList);

    const otherQuestionsMenuItemList = this.props.otherQuestions.map((q, i) => (
      <MenuItem
        eventKey={`${i + 2}`}
        key={shortid.generate()}
        onClick={() => this.props.callbackQuestionSelect(q)}
      >
        {q.name}
      </MenuItem>
    ));
    const questionMenuItemList = [
      <MenuItem eventKey="1" key={shortid.generate()} active>
        {this.state.name}
      </MenuItem>,
    ].concat(otherQuestionsMenuItemList);

    return (
      <div>
        <Row>
          <Col md={12}>
            {active &&
              <Alert bsStyle="success" style={{ padding: '5px 10px 5px 10px' }}>
                {activityMessage}
                <ProgressBar striped active style={{ marginBottom: '5px' }} bsStyle="success" now={100} />
              </Alert>
            }
            <div style={{ position: 'relative' }}>
              <h1 style={{ paddingRight: '50px' }}>
                {this.props.enableQuestionSelect &&
                  <span onClick={() => this.props.callbackQuestionSelect(this.props.question)} style={{ cursor: 'pointer' }}>{name}</span>
                }
                {!this.props.enableQuestionSelect &&
                  name
                }
                {this.props.enableQuestionEdit &&
                  <div style={{ display: 'inline', fontSize: '12px' }}>
                    &nbsp;
                    &nbsp;
                    {editNameNode}
                  </div>
                }
                <div className="pull-right" style={{ position: 'absolute', right: 0, bottom: 0 }}>
                  {edited &&
                    <div style={{ display: 'inline' }}>
                      <Alert bsStyle="warning" style={{ fontSize: '12px', display: 'inline', paddingTop: '5px', paddingBottom: '5px' }}>
                        You have unsaved changes! <span onClick={this.onSave} style={{ cursor: 'pointer', textDecoration: 'underline'}}>Save Now</span>
                      </Alert>
                      &nbsp;
                      &nbsp;
                    </div>
                  }
                  {this.props.showOtherQuestions && questionMenuItemList.length > 1 &&
                    <DropdownButton id="diminisheddropdown" noCaret title="Similar Questions">
                      {questionMenuItemList}
                    </DropdownButton>
                  }
                  {this.props.showOtherAnswersets && answersetMenuItemList.length > 1 &&
                    <DropdownButton id="diminisheddropdown" noCaret title="Other Answersets">
                      {answersetMenuItemList}
                    </DropdownButton>
                  }
                  {this.props.showToolbar &&
                    <QuestionToolbar
                      callbackNewAnswerset={this.props.callbackNewAnswerset}
                      callbackRefresh={this.props.callbackRefresh}
                      callbackFork={this.props.callbackFork}
                      callbackDelete={this.props.callbackDelete}

                      enableNewAnswersets={this.props.enableNewAnswersets && !active}
                      enableQuestionRefresh={this.props.enableQuestionRefresh && !active}
                      enableQuestionDelete={this.props.enableQuestionDelete && !active}
                      enableQuestionFork={this.props.enableQuestionFork}
                    />
                  }
                  {this.props.showDownload &&
                    <span style={{ fontSize: '22px' }} title="Download">
                      <FaDownload style={{ cursor: 'pointer' }} onClick={() => this.props.callbackDownload()} />
                    </span>
                  }
                </div>
              </h1>
            </div>
            <h1 style={{ paddingTop: 0, marginTop: '5px' }}>
              <small>
                {natural}
                {this.props.enableQuestionEdit &&
                  <div style={{ display: 'inline', fontSize: '12px' }}>
                    &nbsp;
                    &nbsp;
                    {editNaturalNode}
                  </div>
                }
              </small>
            </h1>
          </Col>
        </Row>
        <Row>
          <Col id="questionNotes" md={12}>
            <FormControl
              disabled={!this.props.enableQuestionEdit}
              componentClass="textarea"
              placeholder="User Notes"
              style={notesStyle}
              inputRef={(ref) => { this.notesRef = ref; }}
              value={notes}
              onChange={this.onEditNotes}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

QuestionHeader.defaultProps = {
  question: {},
  showToolbar: false,
  refreshBusy: false,
  answerBusy: false,

  callbackNewAnswerset: () => {},
  callbackRefresh: () => {},
  callbackUpdate: () => {},
  callbackFork: () => {},
  callbackDelete: () => {},

  enableNewAnswersets: false,
  enableQuestionRefresh: false,
  enableQuestionEdit: false,
  enableQuestionDelete: false,
  enableQuestionFork: false,

  enableQuestionSelect: false,

  showOtherQuestions: false,
  otherQuestions: [],
  callbackQuestionSelect: () => {},

  showOtherAnswersets: false,
  otherAnswersets: [],
  callbackAnswersetSelect: () => {},

  showDownload: false,
  callbackDownload: () => {},
};

export default QuestionHeader;

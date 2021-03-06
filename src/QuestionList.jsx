import React from 'react';
import { Grid } from 'react-bootstrap';
import AppConfig from './AppConfig';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import QuestionListPres from './components/questionList/QuestionListPres';

class QuestionList extends React.Component {
  constructor(props) {
    super(props);
    // We only read the communications config on creation
    this.appConfig = new AppConfig(props.config);

    this.state = {
      dataReady: false,
      userReady: false,
      user: {},
      questions: [],
    };

    this.callbackQuestionNew = this.callbackQuestionNew.bind(this);
  }

  componentDidMount() {
    this.appConfig.questionListData(data => this.setState({
      questions: data,
      dataReady: true,
    }));
    this.appConfig.user(data => this.setState({
      user: this.appConfig.ensureUser(data),
      userReady: true,
    }));
  }
  callbackQuestionNew() {
    this.appConfig.redirect(this.appConfig.urls.questionDesign);
  }
  renderLoading() {
    return (
      <Loading />
    );
  }
  renderLoaded() {
    return (
      <div>
        <Header
          config={this.props.config}
          user={this.state.user}
        />
        <Grid>
          <QuestionListPres
            loginUrl={this.appConfig.urls.login}
            callbackQuestionNew={this.callbackQuestionNew}
            answersetUrlFunction={(q, a) => this.appConfig.urls.answerset(q.id, a.id)}
            callbackAnswersetSelect={(q, a) => this.appConfig.open(this.appConfig.urls.answerset(q.id, a.id))}
            callbackQuestionSelect={q => this.appConfig.open(this.appConfig.urls.question(q.id))}
            questions={this.state.questions}
            user={this.state.user}
          />
        </Grid>
        <Footer config={this.props.config} />
      </div>
    );
  }
  render() {
    const ready = this.state.dataReady && this.state.userReady;
    return (
      <div>
        {!ready && this.renderLoading()}
        {ready && this.renderLoaded()}
      </div>
    );
  }
}

export default QuestionList;
